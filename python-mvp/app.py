"""
OW Chess — Sprint 0 hot-seat MVP. One FastAPI process, one browser tab, two players taking
turns at the same screen (see python-mvp/README.md for full scope and what's deliberately
deferred). Server-rendered-per-action loop: every action is a POST, followed by a redirect back
to GET / which renders whatever the session's current state actually is — no client-side game
logic, matching the architecture's "client never computes legality/opponent state" rule even
though there's only one client here.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from engine.actions import ENGAGE_AP_COST, MANEUVER_AP_COST, TASK_AP_COST
from engine.belief_state import has_sensor_capability
from engine.board_svg import render_board
from engine.game_engine import GameEngine
from engine.session_store import SessionStore
from engine.template_registry import TemplateRegistry
from engine.types import REGIME_LABELS, SessionState

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI()
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

registry = TemplateRegistry()
engine = GameEngine(registry)
store = SessionStore()

PLAYER_A = "A"
PLAYER_B = "B"


class AppState:
    def __init__(self) -> None:
        self.stage = "landing"  # landing, king_a, king_b_gate, king_b, playing, game_over
        self.names = {PLAYER_A: "Player A", PLAYER_B: "Player B"}
        self.pending_king: dict[str, tuple[str, str]] = {}
        self.session: SessionState | None = None
        self.flash: str | None = None


state = AppState()


def _opaque_label(subject_asset_id: str) -> str:
    return "contact-" + hashlib.sha1(subject_asset_id.encode()).hexdigest()[:4]


def _render(request: Request, template: str, **ctx) -> HTMLResponse:
    ctx.setdefault("flash", state.flash)
    resp = templates.TemplateResponse(request, template, ctx)
    state.flash = None
    return resp


@app.get("/", response_class=HTMLResponse)
def index(request: Request) -> HTMLResponse:
    if state.stage == "landing":
        return _render(request, "landing.html")

    if state.stage == "king_a":
        return _render(
            request, "king_deploy.html",
            player_name=state.names[PLAYER_A], player_id=PLAYER_A,
            mission_sets=list(registry.mission_sets.values()),
        )

    if state.stage == "king_b_gate":
        return _render(
            request, "reveal.html", player_name=state.names[PLAYER_B],
            subtitle="Player A has deployed. Player B, deploy your King next — Player A shouldn't be looking.",
        )

    if state.stage == "king_b":
        return _render(
            request, "king_deploy.html",
            player_name=state.names[PLAYER_B], player_id=PLAYER_B,
            mission_sets=list(registry.mission_sets.values()),
        )

    if state.stage == "playing":
        session = state.session
        assert session is not None
        if not session.revealed:
            active_name = state.names[session.active_turn]
            return _render(
                request, "reveal.html", player_name=active_name,
                subtitle=f"Turn {session.turn_number}. Pass the device to {active_name} — no one else should see the next screen.",
            )
        return _render(request, "board.html", **_board_context(session))

    if state.stage == "game_over":
        session = state.session
        assert session is not None
        win = session.win_result
        winner_name = state.names[win.winner] if win and win.winner else None
        return _render(
            request, "game_over.html", winner_name=winner_name,
            reason=win.reason if win else "unknown", event_log=session.event_log,
        )

    return _render(request, "landing.html")


@app.post("/start")
def start(name_a: str = Form("Player A"), name_b: str = Form("Player B")) -> RedirectResponse:
    state.__init__()
    state.names[PLAYER_A] = name_a.strip() or "Player A"
    state.names[PLAYER_B] = name_b.strip() or "Player B"
    state.stage = "king_a"
    return RedirectResponse("/", status_code=303)


@app.post("/king-deploy")
def king_deploy(player: str = Form(...), missionSet: str = Form(...), regime: str = Form(...)) -> RedirectResponse:
    state.pending_king[player] = (missionSet, regime)
    if player == PLAYER_A:
        state.stage = "king_b_gate"
    else:
        session = store.create_session(
            PLAYER_A, PLAYER_B, state.pending_king[PLAYER_A], state.pending_king[PLAYER_B]
        )
        session.revealed = False
        state.session = session
        state.stage = "playing"
    return RedirectResponse("/", status_code=303)


@app.post("/reveal")
def reveal() -> RedirectResponse:
    if state.stage == "king_b_gate":
        state.stage = "king_b"
    elif state.stage == "playing" and state.session is not None:
        state.session.revealed = True
    return RedirectResponse("/", status_code=303)


@app.post("/new-game")
def new_game() -> RedirectResponse:
    state.__init__()
    return RedirectResponse("/", status_code=303)


def _require_revealed(session: SessionState) -> str | None:
    """Sprint-0 pass-the-device convention: no action may be submitted while the reveal gate is
    up, regardless of what a direct POST claims — the UI only ever renders action forms once
    session.revealed is True, so a request reaching here otherwise isn't a real player action."""
    if not session.revealed:
        return "turn not revealed yet"
    return None


def _finish_action(accepted: bool, reason: str | None, session: SessionState) -> RedirectResponse:
    state.flash = None if accepted else (reason or "action rejected")
    if session.phase == "ended":
        state.stage = "game_over"
    return RedirectResponse("/", status_code=303)


@app.post("/action/deploy")
def act_deploy(templateId: str = Form(...), targetRegime: str = Form(...)) -> RedirectResponse:
    session = state.session
    assert session is not None
    if (blocked := _require_revealed(session)):
        return _finish_action(False, blocked, session)
    result = engine.handle_action(session, session.active_turn, "deploy", {"templateId": templateId, "targetRegime": targetRegime})
    return _finish_action(result.accepted, result.reason, session)


@app.post("/action/maneuver")
def act_maneuver(assetId: str = Form(...), targetRegime: str = Form(...)) -> RedirectResponse:
    session = state.session
    assert session is not None
    if (blocked := _require_revealed(session)):
        return _finish_action(False, blocked, session)
    result = engine.handle_action(session, session.active_turn, "maneuver", {"assetId": assetId, "targetRegime": targetRegime})
    return _finish_action(result.accepted, result.reason, session)


@app.post("/action/task")
def act_task(sourceAssetId: str = Form(...), targetRegime: str = Form(...)) -> RedirectResponse:
    session = state.session
    assert session is not None
    if (blocked := _require_revealed(session)):
        return _finish_action(False, blocked, session)
    result = engine.handle_action(session, session.active_turn, "task", {"sourceAssetId": sourceAssetId, "targetRegime": targetRegime})
    return _finish_action(result.accepted, result.reason, session)


@app.post("/action/engage")
def act_engage(
    effectorAssetId: str = Form(...), targetAssetId: str = Form(...),
    effect: str = Form(...), falseRegime: str = Form(""),
) -> RedirectResponse:
    session = state.session
    assert session is not None
    if (blocked := _require_revealed(session)):
        return _finish_action(False, blocked, session)
    payload = {"effectorAssetId": effectorAssetId, "targetAssetId": targetAssetId, "effect": effect}
    if effect == "deceive" and falseRegime:
        payload["falseRegime"] = falseRegime
    result = engine.handle_action(session, session.active_turn, "engage", payload)
    return _finish_action(result.accepted, result.reason, session)


@app.post("/action/pass")
def act_pass() -> RedirectResponse:
    session = state.session
    assert session is not None
    if (blocked := _require_revealed(session)):
        return _finish_action(False, blocked, session)
    result = engine.handle_action(session, session.active_turn, "pass", {})
    return _finish_action(result.accepted, result.reason, session)


@app.post("/action/resign")
def act_resign() -> RedirectResponse:
    session = state.session
    assert session is not None
    if (blocked := _require_revealed(session)):
        return _finish_action(False, blocked, session)
    result = engine.handle_action(session, session.active_turn, "resign", {})
    return _finish_action(result.accepted, result.reason, session)


def _board_context(session: SessionState) -> dict:
    acting = session.active_turn
    own = session.player(acting)
    opp = session.opponent_of(acting)

    own_assets = []
    for a in own.assets:
        own_assets.append({
            "id": a.asset_id, "template_id": a.template_id, "regime": a.true_regime,
            "online": a.deploy_state is None, "turns_until_online": a.deploy_state.turns_until_online if a.deploy_state else None,
            "maneuvering": a.maneuver_state is not None,
            "maneuver_target": a.maneuver_state.target_regime if a.maneuver_state else None,
            "maneuver_turns": a.maneuver_state.turns_remaining if a.maneuver_state else None,
            "chain_roles": a.chain_roles, "destroyed": a.destroyed,
            "effects": [f'{e.kind}({e.duration_turns - (session.turn_number - e.applied_turn)}t left)' if isinstance(e.duration_turns, int) else f'{e.kind}(persistent)' for e in a.active_effects],
        })

    belief_entries = engine.belief_state.compute_opponent_view(own)
    opponent_belief = []
    unknown_count = 0
    opp_markers = []
    for entry in belief_entries:
        if entry.apparent_regime is None:
            unknown_count += 1
            continue
        label = _opaque_label(entry.subject)
        opponent_belief.append({
            "label": label, "precision": entry.precision,
            "apparent_regime": entry.apparent_regime, "deceived": entry.deceived,
            "subject": entry.subject,
        })
        opp_markers.append({"regime": entry.apparent_regime, "label": label, "kind": "asset", "destroyed": False, "deceived": entry.deceived})

    own_markers = [{"regime": own.king.true_regime, "label": "King", "kind": "king", "destroyed": own.king.destroyed}]
    for a in own.assets:
        if not a.destroyed:
            own_markers.append({"regime": a.true_regime, "label": a.template_id.split("-")[0], "kind": "asset", "destroyed": False})

    board_svg = render_board(own_markers, opp_markers, unknown_count)

    mission_set = registry.get_mission_set(own.king.mission_set) if own.king.mission_set else None
    deploy_templates = [registry.get_asset_template(tid) for tid in (mission_set.asset_type_ids if mission_set else [])]

    maneuverable = [
        {"id": a.asset_id, "label": f'King ({a.true_regime})' if a.is_king else f'{a.template_id} ({a.true_regime})'}
        for a in own.all_assets() if a.deploy_state is None and a.maneuver_state is None and not a.destroyed
    ]
    taskable = [
        {"id": a.asset_id, "label": f'{a.template_id} ({a.true_regime})'}
        for a in own.all_assets() if a.deploy_state is None and not a.destroyed and has_sensor_capability(a.chain_roles)
    ]
    engageable_effectors = []
    for a in own.all_assets():
        if a.deploy_state is None and not a.destroyed and "engage" in a.chain_roles:
            template = registry.get_asset_template(a.template_id)
            engageable_effectors.append({
                "id": a.asset_id, "label": f'{a.template_id} ({a.true_regime})',
                "effects": template.applicable_effects if template else [],
            })
    engageable_targets = [
        {"id": e["subject"], "label": f'{e["label"]} — {e["apparent_regime"]}'}
        for e in opponent_belief if e["precision"] == "target"
    ]

    return dict(
        session=session, active_player_name=state.names[acting], active_player_id=acting,
        opponent_name=state.names[opp.player_id],
        turn_number=session.turn_number, ap_remaining=own.ap_remaining,
        king={
            "regime": own.king.true_regime, "destroyed": own.king.destroyed,
            "denial_turns": own.king.consecutive_denial_turns,
            "effects": [e.kind for e in own.king.active_effects],
            "maneuvering": own.king.maneuver_state is not None,
            "maneuver_target": own.king.maneuver_state.target_regime if own.king.maneuver_state else None,
            "maneuver_turns": own.king.maneuver_state.turns_remaining if own.king.maneuver_state else None,
        },
        own_assets=own_assets, opponent_belief=opponent_belief, unknown_count=unknown_count,
        board_svg=board_svg, event_log=list(reversed(session.event_log[-14:])),
        deploy_templates=deploy_templates, regimes=REGIME_LABELS,
        maneuverable=maneuverable, taskable=taskable, engageable_effectors=engageable_effectors,
        engageable_targets=engageable_targets,
        task_ap_cost=TASK_AP_COST, engage_ap_cost=ENGAGE_AP_COST, maneuver_ap_cost=MANEUVER_AP_COST,
    )
