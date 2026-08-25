"""
Core entity shapes, mirroring shared/src/types.ts (GDS-07) — the same one-job-per-module
split the TypeScript engine used, ported to Python for Sprint 0 (hot-seat MVP). See
python-mvp/README.md for what's deliberately deferred (network transport, persistence).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional, Union

OrbitalRegimeLabel = str  # one of the 9 REGIME_LABELS below
ChainRole = Literal["find", "fix", "track", "target", "engage"]
BeliefPrecision = Literal["find", "fix", "track", "target"]
EffectKind = Literal["disrupt", "deny", "degrade"]
FiveDsEffect = Literal["deceive", "disrupt", "deny", "degrade", "destroy"]
ActionType = Literal["deploy", "maneuver", "task", "engage", "pass", "resign"]
SessionPhase = Literal["deploying", "active", "ended"]
WinReason = Literal["destruction", "denial", "resignation", "timeout-tiebreak"]

REGIME_LABELS: list[OrbitalRegimeLabel] = [
    "LEO-EQUATORIAL", "LEO-PROGRADE", "LEO-POLAR",
    "MEO-EQUATORIAL", "MEO-PROGRADE", "MEO-POLAR",
    "GEO-EQUATORIAL", "GEO-PROGRADE", "GEO-POLAR",
]


@dataclass
class ManeuverState:
    target_regime: OrbitalRegimeLabel
    turns_remaining: int


@dataclass
class DeployState:
    turns_until_online: int


@dataclass
class EffectStateEntry:
    kind: EffectKind
    applied_turn: int
    duration_turns: Union[int, Literal["until-cleared"]]
    stack_count: int
    source_effector_asset_id: str


@dataclass
class Asset:
    asset_id: str
    owner_id: str
    template_id: str
    basing: Literal["ground", "space"]
    chain_roles: list[ChainRole]
    true_regime: OrbitalRegimeLabel
    maneuver_state: Optional[ManeuverState] = None
    deploy_state: Optional[DeployState] = None
    active_effects: list[EffectStateEntry] = field(default_factory=list)
    is_king: bool = False
    mission_set: Optional[str] = None
    consecutive_denial_turns: int = 0
    total_denial_turns: int = 0
    destroyed: bool = False


@dataclass
class BeliefStateEntry:
    subject: str  # asset_id
    precision: BeliefPrecision
    last_updated_turn: int
    source_asset_id: str
    deceived: bool = False
    apparent_regime: Optional[OrbitalRegimeLabel] = None


@dataclass
class PlayerState:
    player_id: str
    king: Asset
    assets: list[Asset] = field(default_factory=list)
    ap_remaining: int = 5
    belief_of_opponent: dict[str, BeliefStateEntry] = field(default_factory=dict)

    def all_assets(self) -> list[Asset]:
        return [self.king, *self.assets]

    def find_owned(self, asset_id: str) -> Optional[Asset]:
        for a in self.all_assets():
            if a.asset_id == asset_id:
                return a
        return None


@dataclass
class EventRecord:
    turn_number: int
    acting_player_id: str
    action_type: str
    payload: dict
    state_delta_summary: str


@dataclass
class WinResult:
    winner: Optional[str]
    reason: WinReason


@dataclass
class SessionState:
    session_id: str
    players: list[PlayerState]  # length 2
    active_turn: str
    turn_number: int = 1
    event_log: list[EventRecord] = field(default_factory=list)
    phase: SessionPhase = "active"
    resigned_by: Optional[str] = None
    win_result: Optional[WinResult] = None
    # Sprint 0 hot-seat "pass the device" convention (NOT a security boundary, see README):
    # true until the active player has clicked through the reveal gate this turn.
    revealed: bool = False

    def player(self, player_id: str) -> PlayerState:
        for p in self.players:
            if p.player_id == player_id:
                return p
        raise KeyError(player_id)

    def opponent_of(self, player_id: str) -> PlayerState:
        for p in self.players:
            if p.player_id != player_id:
                return p
        raise KeyError(player_id)


@dataclass
class ActionResult:
    accepted: bool
    reason: Optional[str] = None
