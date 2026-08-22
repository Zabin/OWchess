/**
 * Composition root (filed as BL-0030) — wires every module's handlers and turn-end hooks
 * together for one session. No package explicitly named this file; it closes a real gap several
 * packages' turn-end hooks otherwise leave dangling (deploy-state ticking, belief decay,
 * maneuver ticking were each implemented and unit-tested in isolation but never actually
 * connected to TurnManager.advanceTurn() in a runnable path). IP-7010 (transport) is expected to
 * own the real production composition root; this is the minimal version needed to prove the
 * pieces already built actually work together, and what IP-7010 should extend rather than
 * reinvent.
 */
import type { SessionId } from '@owchess/shared';
import { SessionStore } from './SessionStore.js';
import { GameEngine } from './GameEngine.js';
import { TurnManager } from './TurnManager.js';
import { TemplateRegistry } from './TemplateRegistry.js';
import { BeliefState } from './BeliefState.js';
import { Propagator } from './Propagator.js';
import { makeDeployHandler, tickDeployStates } from './deployAction.js';
import { makeTaskHandler, registerBeliefDecay } from './taskAction.js';
import { makeManeuverHandler, tickManeuvers } from './maneuverAction.js';
import { loadContent } from '../content/loadContent.js';

const TASK_AP_COST = 1;

export function createGameEngine() {
  const store = new SessionStore();
  const engine = new GameEngine(store);
  const registry = new TemplateRegistry();
  loadContent(registry);
  const beliefState = new BeliefState();
  const propagator = new Propagator();

  const turnManagers = new Map<SessionId, TurnManager>();
  const turnManagerFor = (sessionId: SessionId): TurnManager => {
    let tm = turnManagers.get(sessionId);
    if (!tm) {
      tm = new TurnManager(store, sessionId);
      tm.registerTurnEndHook((endingPlayer) => {
        tickDeployStates(endingPlayer.assets);
        tickManeuvers([endingPlayer.king, ...endingPlayer.assets], propagator);
      });
      turnManagers.set(sessionId, tm);
      registerBeliefDecay(store, turnManagerFor, sessionId, beliefState);
    }
    return tm;
  };

  engine.registerHandler('deploy', makeDeployHandler(store, turnManagerFor, registry));
  engine.registerHandler('task', makeTaskHandler(store, turnManagerFor, beliefState, TASK_AP_COST));
  engine.registerHandler('maneuver', makeManeuverHandler(store, turnManagerFor, propagator));

  return { store, engine, registry, beliefState, propagator, turnManagerFor };
}
