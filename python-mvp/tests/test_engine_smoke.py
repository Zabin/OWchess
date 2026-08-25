"""Sprint-0 smoke tests — cover the two bugs the sprint was explicitly told to fix (pass firing
turn-end hooks; Deceive planting a false regime in the victim's belief map, not the deceiver's
own) plus the "a game can actually end" fix, against the Python engine (not the HTTP layer)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine.belief_state import BeliefState
from engine.effect_resolver import EffectResolver
from engine.game_engine import GameEngine
from engine.session_store import SessionStore
from engine.template_registry import TemplateRegistry
from engine.types import Asset, BeliefStateEntry, PlayerState


def make_game():
    registry = TemplateRegistry()
    engine = GameEngine(registry)
    store = SessionStore()
    session = store.create_session("A", "B", ("satcom", "GEO-EQUATORIAL"), ("isr", "LEO-POLAR"))
    return registry, engine, session


def test_pass_advances_turn_and_fires_hooks():
    _, engine, session = make_game()
    r = engine.handle_action(session, "A", "deploy", {"templateId": "ground-tracking-array", "targetRegime": "LEO-EQUATORIAL"})
    assert r.accepted
    asset = session.player("A").assets[0]
    assert asset.deploy_state.turns_until_online == 1

    assert session.active_turn == "A"
    r = engine.handle_action(session, "A", "pass", {})
    assert r.accepted
    assert session.active_turn == "B"
    # pass must fire the same turn-end hooks AP-exhaustion does (the TS hookless-TurnManager bug).
    assert asset.deploy_state is None, "pass did not fire turn-end hooks"


def test_deceive_corrupts_victim_belief_not_deceivers_own():
    effector = Asset(asset_id="A-asset-1", owner_id="A", template_id="ew-jamming-effector",
                      basing="space", chain_roles=["engage"], true_regime="GEO-EQUATORIAL")
    target = Asset(asset_id="B-asset-1", owner_id="B", template_id="wide-area-sda-radar",
                    basing="ground", chain_roles=["find", "fix"], true_regime="LEO-EQUATORIAL")

    a_state = PlayerState(player_id="A", king=Asset(asset_id="A-king", owner_id="A", template_id="satcom",
                                                      basing="space", chain_roles=[], true_regime="GEO-EQUATORIAL", is_king=True))
    b_state = PlayerState(player_id="B", king=Asset(asset_id="B-king", owner_id="B", template_id="isr",
                                                      basing="space", chain_roles=[], true_regime="LEO-POLAR", is_king=True))

    # A has already achieved 'target' precision on B's asset (the engagement gate).
    a_state.belief_of_opponent["B-asset-1"] = BeliefStateEntry(
        subject="B-asset-1", precision="target", last_updated_turn=1, source_asset_id="A-asset-1",
        apparent_regime="LEO-EQUATORIAL",
    )

    resolver = EffectResolver()
    belief = BeliefState()
    ok, reason = resolver.resolve_engagement(
        a_state, effector, target, b_state, "deceive", belief, current_turn=2, false_regime="GEO-POLAR",
    )
    assert ok, reason

    # The deceiver's own belief about the target must be untouched...
    assert a_state.belief_of_opponent["B-asset-1"].apparent_regime == "LEO-EQUATORIAL"
    assert a_state.belief_of_opponent["B-asset-1"].deceived is False
    # ...and the *victim's* belief about the deceiver's own asset must now be false.
    entry = b_state.belief_of_opponent["A-asset-1"]
    assert entry.apparent_regime == "GEO-POLAR"
    assert entry.deceived is True


def test_win_condition_ends_game_on_king_destroy():
    _, engine, session = make_game()
    session.player("B").king.destroyed = True
    result = engine.check_win_conditions(session)
    assert result is not None and result.winner == "A" and result.reason == "destruction"

    # handle_action must actually call this (the TS unreachable-checkWinConditions bug).
    engine.handle_action(session, "A", "pass", {})
    assert session.phase == "ended"
    assert session.win_result is not None
    assert session.win_result.winner == "A"


def test_deploy_rejects_regime_outside_affinity():
    _, engine, session = make_game()
    r = engine.handle_action(session, "A", "deploy", {"templateId": "ground-tracking-array", "targetRegime": "GEO-POLAR"})
    assert not r.accepted


if __name__ == "__main__":
    test_pass_advances_turn_and_fires_hooks()
    test_deceive_corrupts_victim_belief_not_deceivers_own()
    test_win_condition_ends_game_on_king_destroy()
    test_deploy_rejects_regime_outside_affinity()
    print("all smoke tests passed")
