"""
BeliefState — per-player derived belief-state of the opponent; the fog-of-war boundary.
Mirrors server/src/engine/BeliefState.ts (tasking + staleness decay + the enforcement half:
computeOpponentView/applyDeception).

Sprint-0 fix (Deceive direction, per CLAUDE.md's documented defect): the TypeScript engine called
applyDeception(effectorObserverState, target.assetId, falseRegime ?? target.trueRegime, ...) — the
attacker corrupting *its own* belief entry about the opponent's asset with that asset's *real*
regime (since the client never sent falseRegime). That's not deception, it's a no-op that
happens to re-confirm the truth. A five-D "deceive" effect is EW doctrine for planting false
sensor returns in the victim's picture, so the corrected direction is: the effector plants a
false position for *itself* in the *target's owner's* belief map — beliefState.applyDeception is
now called with the target's owner's PlayerState (the party being deceived), subject =
effector.asset_id (the asset whose apparent position is now false), and a false_regime the
attacking player chooses in the Engage form (defaulting to a regime different from the
effector's true one if the player leaves it unset). This is a Sprint-0 spec call, flagged for
06-feature-specification once the pipeline resumes, per the task brief.
"""
from __future__ import annotations

from .types import Asset, BeliefStateEntry, ChainRole, OrbitalRegimeLabel, PlayerState

PRECISION_ORDER = ["find", "fix", "track", "target"]
STALENESS_WINDOW = 5  # turns without refresh before an entry decays one precision level


def _precision_index(p: str) -> int:
    return PRECISION_ORDER.index(p)


def has_sensor_capability(chain_roles: list[ChainRole]) -> bool:
    return _capability_ceiling(chain_roles) >= 0


def _capability_ceiling(chain_roles: list[ChainRole]) -> int:
    ceiling = -1
    for role in chain_roles:
        if role in PRECISION_ORDER:
            ceiling = max(ceiling, PRECISION_ORDER.index(role))
    return ceiling


class BeliefState:
    def apply_tasking(
        self,
        observer_state: PlayerState,
        source_asset: Asset,
        target_regime: OrbitalRegimeLabel,
        opponent_true_state: PlayerState,
        turn_number: int,
    ) -> None:
        ceiling = _capability_ceiling(source_asset.chain_roles)
        if ceiling < 0:
            return

        present = [
            a
            for a in opponent_true_state.all_assets()
            if not a.destroyed and a.true_regime == target_regime
        ]
        for target in present:
            existing = observer_state.belief_of_opponent.get(target.asset_id)
            current_idx = _precision_index(existing.precision) if existing else -1
            next_idx = min(current_idx + 1, ceiling, len(PRECISION_ORDER) - 1)
            precision = PRECISION_ORDER[max(next_idx, 0)]
            entry = BeliefStateEntry(
                subject=target.asset_id,
                precision=precision,
                last_updated_turn=turn_number,
                source_asset_id=source_asset.asset_id,
                deceived=existing.deceived if existing else False,
                apparent_regime=target_regime if _precision_index(precision) >= _precision_index("fix") else None,
            )
            observer_state.belief_of_opponent[target.asset_id] = entry

    def decay_stale_entries(self, observer_state: PlayerState, current_turn: int) -> None:
        for key in list(observer_state.belief_of_opponent.keys()):
            entry = observer_state.belief_of_opponent[key]
            if current_turn - entry.last_updated_turn < STALENESS_WINDOW:
                continue
            idx = _precision_index(entry.precision)
            if idx <= 0:
                del observer_state.belief_of_opponent[key]
                continue
            entry.precision = PRECISION_ORDER[idx - 1]
            entry.last_updated_turn = current_turn
            if idx - 1 < _precision_index("fix"):
                entry.apparent_regime = None

    def compute_opponent_view(self, observer_state: PlayerState) -> list[BeliefStateEntry]:
        return list(observer_state.belief_of_opponent.values())

    def apply_deception(
        self,
        victim_state: PlayerState,
        subject_asset_id: str,
        false_regime: OrbitalRegimeLabel,
        turn_number: int,
        source_asset_id: str,
    ) -> None:
        existing = victim_state.belief_of_opponent.get(subject_asset_id)
        entry = BeliefStateEntry(
            subject=subject_asset_id,
            precision=existing.precision if existing else "fix",
            last_updated_turn=turn_number,
            source_asset_id=existing.source_asset_id if existing else source_asset_id,
            deceived=True,
            apparent_regime=false_regime,
        )
        victim_state.belief_of_opponent[subject_asset_id] = entry
