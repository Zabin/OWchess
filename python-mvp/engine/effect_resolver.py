"""
EffectResolver — applies a Five D's effect to a target's true state on successful engagement,
gated by 'target'-level belief precision. Mirrors server/src/engine/EffectResolver.ts.
"""
from __future__ import annotations

from typing import Optional

from .belief_state import BeliefState
from .types import Asset, EffectStateEntry, FiveDsEffect, OrbitalRegimeLabel, PlayerState

DISRUPT_DENY_DURATION = 3
DEGRADE_DURATION = 4


class EffectResolver:
    def resolve_engagement(
        self,
        effector_observer_state: PlayerState,
        effector: Asset,
        target: Asset,
        target_owner_state: PlayerState,
        effect: FiveDsEffect,
        belief_state: BeliefState,
        current_turn: int,
        false_regime: Optional[OrbitalRegimeLabel] = None,
    ) -> tuple[bool, Optional[str]]:
        belief = effector_observer_state.belief_of_opponent.get(target.asset_id)
        if belief is None or belief.precision != "target":
            return False, "insufficient targeting-quality data (need 'target'-level precision)"

        if effect == "destroy":
            target.destroyed = True
            return True, None

        if effect == "deceive":
            # Sprint-0 fix: plants a false regime in the *target's owner's* belief about the
            # effector's own asset — see belief_state.py's module docstring for the reasoning.
            resolved_false_regime = false_regime or effector.true_regime
            belief_state.apply_deception(
                target_owner_state, effector.asset_id, resolved_false_regime, current_turn, target.asset_id
            )
            return True, None

        if effect in ("disrupt", "deny"):
            self._add_effect_entry(target, effect, DISRUPT_DENY_DURATION, current_turn, effector.asset_id)
            return True, None

        if effect == "degrade":
            self._add_effect_entry(target, "degrade", DEGRADE_DURATION, current_turn, effector.asset_id)
            return True, None

        return False, f"unknown effect kind {effect}"

    def _add_effect_entry(
        self, target: Asset, kind: str, duration_turns: int, current_turn: int, source_effector_asset_id: str
    ) -> None:
        target.active_effects.append(
            EffectStateEntry(
                kind=kind,  # type: ignore[arg-type]
                applied_turn=current_turn,
                duration_turns=duration_turns,
                stack_count=1,
                source_effector_asset_id=source_effector_asset_id,
            )
        )

    def tick_active_effects(self, asset: Asset, current_turn: int) -> None:
        kept = []
        for entry in asset.active_effects:
            if entry.duration_turns == "until-cleared":
                kept.append(entry)
                continue
            elapsed = current_turn - entry.applied_turn
            if elapsed < entry.duration_turns:
                kept.append(entry)
        asset.active_effects = kept

        if asset.is_king:
            denied = any(e.kind in ("disrupt", "deny", "degrade") for e in asset.active_effects)
            if denied:
                asset.consecutive_denial_turns += 1
                asset.total_denial_turns += 1
            else:
                asset.consecutive_denial_turns = 0
