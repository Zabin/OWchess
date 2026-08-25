"""
TurnManager — owns whose turn is active, AP allotment/spend, turn-advance. Mirrors
server/src/engine/TurnManager.ts. The only module allowed to reject an out-of-turn action.

Sprint-0 fix: the TypeScript build kept a second, hookless TurnManager instance inside
GameEngine.handleAction's own map, separate from the hooked instance createGameEngine.ts wired
up — so `pass` (which GameEngine drove directly against its private map) fired no turn-end hooks
(CLAUDE.md's documented defect). This port has exactly one TurnManager per session, constructed
once by GameEngine and shared with every action handler, so pass and AP-exhaustion both go
through the same advance_turn() call.
"""
from __future__ import annotations

from typing import Callable, Optional

from .types import PlayerState, SessionState

STARTING_AP = 5

TurnEndHook = Callable[[PlayerState, int], None]


class TurnManager:
    def __init__(self, session: SessionState) -> None:
        self.session = session
        self._turn_end_hooks: list[TurnEndHook] = []

    def register_turn_end_hook(self, hook: TurnEndHook) -> None:
        self._turn_end_hooks.append(hook)

    def active_player(self) -> str:
        return self.session.active_turn

    def ap_remaining(self) -> int:
        return self.session.player(self.session.active_turn).ap_remaining

    def submit_action(self, acting_player: str) -> tuple[bool, Optional[str]]:
        if acting_player != self.session.active_turn:
            return False, "not your turn"
        return True, None

    def spend_ap(self, acting_player: str, cost: int) -> tuple[bool, Optional[str]]:
        player = self.session.player(acting_player)
        if player.ap_remaining < cost:
            return False, "insufficient AP"
        player.ap_remaining -= cost
        if player.ap_remaining == 0:
            self.advance_turn()
        return True, None

    def advance_turn(self) -> None:
        a, b = self.session.players
        ending = a if self.session.active_turn == a.player_id else b
        nxt = b if ending is a else a
        for hook in self._turn_end_hooks:
            hook(ending, self.session.turn_number)
        nxt.ap_remaining = STARTING_AP
        self.session.active_turn = nxt.player_id
        self.session.turn_number += 1
        self.session.revealed = False
