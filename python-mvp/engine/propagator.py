"""
Propagator — FR-5005 boundary. Discrete regime taxonomy + maneuver cost table, mirroring
server/src/engine/Propagator.ts (FS-104's Maneuver Cost Table). Sprint-0 fix: TypeScript's
Propagator.advance() had zero production callers (orbital math never ran, CLAUDE.md's documented
defect) — this port's GameEngine calls advance() from the same turn-end hook that ticks deploy
states and maneuvers, so it always runs.
"""
from __future__ import annotations

from .types import Asset, OrbitalRegimeLabel

MEAN_MOTION_DEG_PER_TICK = {"LEO": 24, "MEO": 6, "GEO": 1.5}

ALTITUDE_COST = {
    "LEO-LEO": (0, 0), "MEO-MEO": (0, 0), "GEO-GEO": (0, 0),
    "LEO-MEO": (3, 2), "MEO-LEO": (3, 2),
    "MEO-GEO": (1, 3), "GEO-MEO": (1, 3),
    "LEO-GEO": (4, 4), "GEO-LEO": (4, 4),
}

PLANE_COST = {
    "LEO": {
        "EQUATORIAL-EQUATORIAL": (0, 0), "PROGRADE-PROGRADE": (0, 0), "POLAR-POLAR": (0, 0),
        "EQUATORIAL-PROGRADE": (6, 2), "PROGRADE-EQUATORIAL": (6, 2),
        "PROGRADE-POLAR": (6, 2), "POLAR-PROGRADE": (6, 2),
        "EQUATORIAL-POLAR": (11, 3), "POLAR-EQUATORIAL": (11, 3),
    },
    "MEO": {
        "EQUATORIAL-EQUATORIAL": (0, 0), "PROGRADE-PROGRADE": (0, 0), "POLAR-POLAR": (0, 0),
        "EQUATORIAL-PROGRADE": (3, 1), "PROGRADE-EQUATORIAL": (3, 1),
        "PROGRADE-POLAR": (3, 1), "POLAR-PROGRADE": (3, 1),
        "EQUATORIAL-POLAR": (5, 2), "POLAR-EQUATORIAL": (5, 2),
    },
    "GEO": {
        "EQUATORIAL-EQUATORIAL": (0, 0), "PROGRADE-PROGRADE": (0, 0), "POLAR-POLAR": (0, 0),
        "EQUATORIAL-PROGRADE": (2, 1), "PROGRADE-EQUATORIAL": (2, 1),
        "PROGRADE-POLAR": (2, 1), "POLAR-PROGRADE": (2, 1),
        "EQUATORIAL-POLAR": (4, 1), "POLAR-EQUATORIAL": (4, 1),
    },
}

COMBINED_MANEUVER_DISCOUNT = 0.25


def _parse(label: OrbitalRegimeLabel) -> tuple[str, str]:
    altitude, plane = label.split("-")
    return altitude, plane


class Propagator:
    def __init__(self) -> None:
        self._mean_anomaly: dict[str, float] = {}

    def advance(self, assets: list[Asset]) -> None:
        for asset in assets:
            altitude, _ = _parse(asset.true_regime)
            current = self._mean_anomaly.get(asset.asset_id, 0.0)
            self._mean_anomaly[asset.asset_id] = (current + MEAN_MOTION_DEG_PER_TICK[altitude]) % 360

    def current_regime(self, asset: Asset) -> OrbitalRegimeLabel:
        return asset.true_regime

    def plan_maneuver(self, asset: Asset, target_regime: OrbitalRegimeLabel) -> dict:
        if asset.maneuver_state is not None:
            return {"turns_required": 0, "fuel_cost": 0, "rejected": "a maneuver is already in progress"}

        from_alt, from_plane = _parse(asset.true_regime)
        to_alt, to_plane = _parse(target_regime)

        alt_fuel, alt_turns = ALTITUDE_COST[f"{from_alt}-{to_alt}"]
        plane_fuel, plane_turns = PLANE_COST[from_alt][f"{from_plane}-{to_plane}"]

        if alt_fuel > 0 and plane_fuel > 0:
            fuel_cost = int((alt_fuel + plane_fuel) * (1 - COMBINED_MANEUVER_DISCOUNT))
            turns_required = max(alt_turns, plane_turns) + 1
        elif alt_fuel > 0:
            fuel_cost, turns_required = alt_fuel, alt_turns
        else:
            fuel_cost, turns_required = plane_fuel, plane_turns

        return {"turns_required": turns_required, "fuel_cost": fuel_cost, "rejected": None}

    def maneuver_complete(self, asset: Asset) -> bool:
        if asset.maneuver_state is None:
            return False
        if asset.maneuver_state.turns_remaining > 0:
            return False
        asset.true_regime = asset.maneuver_state.target_regime
        asset.maneuver_state = None
        return True
