"""
Action handlers for deploy/maneuver/task/engage, plus their turn-end tick functions. Mirrors
server/src/engine/{deployAction,maneuverAction,taskAction,engageAction}.ts, collapsed into one
module for Sprint 0 since there's no separate transport layer dispatching to them.
"""
from __future__ import annotations

from typing import Optional

from .belief_state import BeliefState, has_sensor_capability
from .effect_resolver import EffectResolver
from .propagator import Propagator
from .template_registry import TemplateRegistry
from .turn_manager import TurnManager
from .types import Asset, DeployState, FiveDsEffect, OrbitalRegimeLabel, PlayerState, SessionState

TASK_AP_COST = 1
ENGAGE_AP_COST = 1
MANEUVER_AP_COST = 1

_asset_counter = {"n": 0}


def _next_asset_id(owner_id: str) -> str:
    _asset_counter["n"] += 1
    return f"{owner_id}-asset-{_asset_counter['n']}"


def assert_online(asset: Asset) -> tuple[bool, Optional[str]]:
    if asset.deploy_state is not None:
        return False, "asset is not yet online"
    return True, None


def deploy_asset(
    session: SessionState,
    tm: TurnManager,
    registry: TemplateRegistry,
    acting_player: str,
    template_id: str,
    target_regime: OrbitalRegimeLabel,
) -> tuple[bool, Optional[str]]:
    template = registry.get_asset_template(template_id)
    if template is None:
        return False, f"unknown template {template_id}"
    if target_regime not in template.regime_affinity:
        return False, f"{template_id} has no affinity for {target_regime}"

    player = session.player(acting_player)
    spent, reason = tm.spend_ap(acting_player, template.ap_cost)
    if not spent:
        return False, reason

    asset = Asset(
        asset_id=_next_asset_id(acting_player),
        owner_id=acting_player,
        template_id=template_id,
        basing=template.basing,
        chain_roles=list(template.chain_roles),
        true_regime=target_regime,
        deploy_state=DeployState(turns_until_online=template.time_to_online) if template.time_to_online > 0 else None,
    )
    player.assets.append(asset)
    return True, None


def maneuver_asset(
    session: SessionState,
    tm: TurnManager,
    propagator: Propagator,
    acting_player: str,
    asset_id: str,
    target_regime: OrbitalRegimeLabel,
) -> tuple[bool, Optional[str]]:
    player = session.player(acting_player)
    asset = player.find_owned(asset_id)
    if asset is None:
        return False, f"no such owned asset {asset_id}"

    online, reason = assert_online(asset)
    if not online:
        return False, reason

    plan = propagator.plan_maneuver(asset, target_regime)
    if plan["rejected"]:
        return False, plan["rejected"]

    spent, reason = tm.spend_ap(acting_player, MANEUVER_AP_COST)
    if not spent:
        return False, reason

    from .types import ManeuverState
    asset.maneuver_state = ManeuverState(target_regime=target_regime, turns_remaining=plan["turns_required"])
    return True, None


def task_asset(
    session: SessionState,
    tm: TurnManager,
    belief_state: BeliefState,
    acting_player: str,
    source_asset_id: str,
    target_regime: OrbitalRegimeLabel,
) -> tuple[bool, Optional[str]]:
    observer_state = session.player(acting_player)
    opponent_state = session.opponent_of(acting_player)

    source = observer_state.find_owned(source_asset_id)
    if source is None:
        return False, f"no such owned asset {source_asset_id}"
    if not has_sensor_capability(source.chain_roles):
        return False, f"{source_asset_id} has no F2T2E sensing capability"

    online, reason = assert_online(source)
    if not online:
        return False, reason

    spent, reason = tm.spend_ap(acting_player, TASK_AP_COST)
    if not spent:
        return False, reason

    belief_state.apply_tasking(observer_state, source, target_regime, opponent_state, session.turn_number)
    return True, None


def engage_asset(
    session: SessionState,
    tm: TurnManager,
    effect_resolver: EffectResolver,
    belief_state: BeliefState,
    registry: TemplateRegistry,
    acting_player: str,
    effector_asset_id: str,
    target_asset_id: str,
    effect: FiveDsEffect,
    false_regime: Optional[OrbitalRegimeLabel] = None,
) -> tuple[bool, Optional[str]]:
    observer_state = session.player(acting_player)
    opponent_state = session.opponent_of(acting_player)

    effector = observer_state.find_owned(effector_asset_id)
    if effector is None:
        return False, f"no such owned asset {effector_asset_id}"
    target = opponent_state.find_owned(target_asset_id)
    if target is None:
        return False, f"no such opponent asset {target_asset_id}"

    online, reason = assert_online(effector)
    if not online:
        return False, reason

    template = registry.get_asset_template(effector.template_id)
    if template and template.applicable_effects and effect not in template.applicable_effects:
        return False, f"{effector.template_id} cannot apply {effect}"

    spent, reason = tm.spend_ap(acting_player, ENGAGE_AP_COST)
    if not spent:
        return False, reason

    success, reason = effect_resolver.resolve_engagement(
        observer_state, effector, target, opponent_state, effect, belief_state, session.turn_number, false_regime
    )
    return success, reason


def register_turn_end_ticks(
    tm: TurnManager,
    propagator: Propagator,
    effect_resolver: EffectResolver,
    belief_state: BeliefState,
    session: SessionState,
) -> None:
    """Wires deploy-state ticking, maneuver ticking + propagation, effect ticking, and belief
    decay into the turn-advance loop — the composition-root wiring createGameEngine.ts did for
    the TypeScript build (see that file's own docstring on why nothing else should do it)."""

    def on_turn_end(ending_player: PlayerState, turn_number: int) -> None:
        all_assets = ending_player.all_assets()

        for asset in ending_player.assets:
            if asset.deploy_state is not None:
                asset.deploy_state.turns_until_online -= 1
                if asset.deploy_state.turns_until_online <= 0:
                    asset.deploy_state = None

        propagator.advance(all_assets)
        for asset in all_assets:
            if asset.maneuver_state is not None:
                asset.maneuver_state.turns_remaining -= 1
                propagator.maneuver_complete(asset)

        for asset in all_assets:
            effect_resolver.tick_active_effects(asset, turn_number)

        for player in session.players:
            belief_state.decay_stale_entries(player, session.turn_number)

    tm.register_turn_end_hook(on_turn_end)
