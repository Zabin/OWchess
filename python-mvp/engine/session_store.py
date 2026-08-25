"""
SessionStore — in-memory session state, no persistent DB (matches server/src/engine/SessionStore.ts's
NFR-6100 constraint). Sprint-0 hot-seat mode only ever has one live session, but the store supports
several so a fresh /new-game doesn't collide with a stale one still referenced by an old browser tab.
"""
from __future__ import annotations

import secrets

from .types import Asset, PlayerState, SessionState

STARTING_AP = 5


def _new_king(owner_id: str, mission_set: str, regime: str) -> Asset:
    return Asset(
        asset_id=f"{owner_id}-king",
        owner_id=owner_id,
        template_id=mission_set,
        basing="space",
        chain_roles=[],
        true_regime=regime,
        is_king=True,
        mission_set=mission_set,
    )


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionState] = {}

    def create_session(self, player_a_id: str, player_b_id: str, king_a: tuple[str, str], king_b: tuple[str, str]) -> SessionState:
        session_id = "session-" + secrets.token_urlsafe(12)
        players = [
            PlayerState(player_id=player_a_id, king=_new_king(player_a_id, *king_a), ap_remaining=STARTING_AP),
            PlayerState(player_id=player_b_id, king=_new_king(player_b_id, *king_b), ap_remaining=STARTING_AP),
        ]
        session = SessionState(session_id=session_id, players=players, active_turn=player_a_id, turn_number=1)
        self._sessions[session_id] = session
        return session

    def get(self, session_id: str) -> SessionState | None:
        return self._sessions.get(session_id)
