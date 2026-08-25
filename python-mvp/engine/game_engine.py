"""
GameEngine — the single entry point for "an action arrived"; dispatches to the right action
handler and runs the win-condition check after every resolved action. Mirrors
server/src/engine/GameEngine.ts.

Sprint-0 fix: TypeScript's checkWinConditions had zero production callers (CLAUDE.md's documented
defect — a game could never end). This port's handle_action calls check_win_conditions itself,
every time, right after the action resolves, and flips session.phase to 'ended' when it fires.
"""
from __future__ import annotations

from typing import Optional

from . import actions
from .belief_state import BeliefState
from .effect_resolver import EffectResolver
from .propagator import Propagator
from .template_registry import TemplateRegistry
from .turn_manager import TurnManager
from .types import ActionResult, EventRecord, SessionState, WinResult

DENIAL_STREAK_THRESHOLD = 6
TIMEOUT_TURN_CAP = 60


class GameEngine:
    def __init__(self, registry: TemplateRegistry) -> None:
        self.registry = registry
        self.belief_state = BeliefState()
        self.propagator = Propagator()
        self.effect_resolver = EffectResolver()
        self._turn_managers: dict[str, TurnManager] = {}

    def turn_manager_for(self, session: SessionState) -> TurnManager:
        tm = self._turn_managers.get(session.session_id)
        if tm is None:
            tm = TurnManager(session)
            actions.register_turn_end_ticks(tm, self.propagator, self.effect_resolver, self.belief_state, session)
            self._turn_managers[session.session_id] = tm
        return tm

    def handle_action(self, session: SessionState, acting_player: str, action_type: str, payload: dict) -> ActionResult:
        if session.phase != "active":
            return ActionResult(accepted=False, reason=f"session is {session.phase}, not active")

        tm = self.turn_manager_for(session)

        if action_type == "resign":
            session.phase = "ended"
            session.resigned_by = acting_player
            self._log(session, acting_player, action_type, payload, "resigned")
            session.win_result = self.check_win_conditions(session)
            return ActionResult(accepted=True)

        ok, reason = tm.submit_action(acting_player)
        if not ok:
            return ActionResult(accepted=False, reason=reason)

        if action_type == "pass":
            turn_before = session.turn_number
            tm.advance_turn()
            self._log(session, acting_player, action_type, payload, f"turn {turn_before} passed")
            win = self.check_win_conditions(session)
            if win is not None:
                session.phase = "ended"
                session.win_result = win
            return ActionResult(accepted=True)

        handler_result = self._dispatch(session, tm, acting_player, action_type, payload)
        if handler_result.accepted:
            self._log(session, acting_player, action_type, payload, self._summarize(action_type, payload))
            win = self.check_win_conditions(session)
            if win is not None:
                session.phase = "ended"
                session.win_result = win
        return handler_result

    def _dispatch(self, session, tm, acting_player, action_type, payload) -> ActionResult:
        if action_type == "deploy":
            ok, reason = actions.deploy_asset(
                session, tm, self.registry, acting_player, payload["templateId"], payload["targetRegime"]
            )
        elif action_type == "maneuver":
            ok, reason = actions.maneuver_asset(
                session, tm, self.propagator, acting_player, payload["assetId"], payload["targetRegime"]
            )
        elif action_type == "task":
            ok, reason = actions.task_asset(
                session, tm, self.belief_state, acting_player, payload["sourceAssetId"], payload["targetRegime"]
            )
        elif action_type == "engage":
            ok, reason = actions.engage_asset(
                session,
                tm,
                self.effect_resolver,
                self.belief_state,
                self.registry,
                acting_player,
                payload["effectorAssetId"],
                payload["targetAssetId"],
                payload["effect"],
                payload.get("falseRegime"),
            )
        else:
            return ActionResult(accepted=False, reason=f"unknown action type {action_type}")
        return ActionResult(accepted=ok, reason=reason)

    def _summarize(self, action_type: str, payload: dict) -> str:
        return f"{action_type}({', '.join(f'{k}={v}' for k, v in payload.items())})"

    def _log(self, session: SessionState, acting_player: str, action_type: str, payload: dict, summary: str) -> None:
        session.event_log.append(
            EventRecord(
                turn_number=session.turn_number,
                acting_player_id=acting_player,
                action_type=action_type,
                payload=dict(payload),
                state_delta_summary=summary,
            )
        )

    def check_win_conditions(self, session: SessionState) -> Optional[WinResult]:
        a, b = session.players

        if session.resigned_by:
            winner = b.player_id if session.resigned_by == a.player_id else a.player_id
            return WinResult(winner=winner, reason="resignation")

        if a.king.destroyed:
            return WinResult(winner=b.player_id, reason="destruction")
        if b.king.destroyed:
            return WinResult(winner=a.player_id, reason="destruction")

        if a.king.consecutive_denial_turns >= DENIAL_STREAK_THRESHOLD:
            return WinResult(winner=b.player_id, reason="denial")
        if b.king.consecutive_denial_turns >= DENIAL_STREAK_THRESHOLD:
            return WinResult(winner=a.player_id, reason="denial")

        if session.turn_number > TIMEOUT_TURN_CAP:
            if a.king.total_denial_turns > b.king.total_denial_turns:
                return WinResult(winner=b.player_id, reason="timeout-tiebreak")
            if b.king.total_denial_turns > a.king.total_denial_turns:
                return WinResult(winner=a.player_id, reason="timeout-tiebreak")
            return WinResult(winner=None, reason="timeout-tiebreak")

        return None
