import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '../SessionStore.js';
import { TurnManager } from '../TurnManager.js';
import { GameEngine } from '../GameEngine.js';
import { BeliefState } from '../BeliefState.js';
import { makeTaskHandler, registerBeliefDecay } from '../taskAction.js';

describe('task action wiring (IP-2010)', () => {
  let store: SessionStore;
  let engine: GameEngine;
  let beliefState: BeliefState;
  let sessionId: string;
  const turnManagers = new Map<string, TurnManager>();
  const turnManagerFor = (sid: string) => {
    let tm = turnManagers.get(sid);
    if (!tm) {
      tm = new TurnManager(store, sid);
      turnManagers.set(sid, tm);
    }
    return tm;
  };

  beforeEach(() => {
    store = new SessionStore();
    engine = new GameEngine(store);
    beliefState = new BeliefState();
    sessionId = store.createSession('alice');
    store.joinSession(sessionId, 'bob');
    store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');

    const alice = store.getPlayerState(sessionId, 'alice')!;
    alice.assets.push({
      assetId: 'alice-sensor',
      ownerId: 'alice',
      templateId: 'ground-tracking-array',
      basing: 'ground',
      chainRoles: ['fix', 'track'],
      trueRegime: 'LEO-EQUATORIAL',
      maneuverState: null,
      deployState: null,
      activeEffects: [],
      isKing: false,
      missionSet: null,
      consecutiveDenialTurns: 0,
      totalDenialTurns: 0,
      destroyed: false,
    });

    engine.registerHandler('task', makeTaskHandler(store, turnManagerFor, beliefState, 1));
    registerBeliefDecay(store, turnManagerFor, sessionId, beliefState);
  });

  it('tasking bob\'s king regime (LEO-POLAR) creates a belief entry, deducting 1 AP', () => {
    const result = engine.handleAction(sessionId, 'alice', {
      type: 'task',
      payload: { sourceAssetId: 'alice-sensor', targetRegime: 'LEO-POLAR' },
    });
    expect(result.accepted).toBe(true);
    const alice = store.getPlayerState(sessionId, 'alice')!;
    expect(alice.apRemaining).toBe(4);
    expect(alice.beliefOfOpponent.get('bob-king')).toBeDefined();
  });

  it('rejects tasking with a non-existent source asset', () => {
    const result = engine.handleAction(sessionId, 'alice', {
      type: 'task',
      payload: { sourceAssetId: 'no-such-asset', targetRegime: 'LEO-POLAR' },
    });
    expect(result.accepted).toBe(false);
  });

  it('rejects tasking with an effector-only asset (no sensing chainRoles) — VR-2010 F1', () => {
    const alice = store.getPlayerState(sessionId, 'alice')!;
    alice.assets.push({
      assetId: 'alice-effector',
      ownerId: 'alice',
      templateId: 'kinetic-rpo-effector',
      basing: 'space',
      chainRoles: ['engage'], // no find/fix/track/target
      trueRegime: 'LEO-EQUATORIAL',
      maneuverState: null,
      deployState: null,
      activeEffects: [],
      isKing: false,
      missionSet: null,
      consecutiveDenialTurns: 0,
      totalDenialTurns: 0,
      destroyed: false,
    });
    const apBefore = alice.apRemaining;
    const result = engine.handleAction(sessionId, 'alice', {
      type: 'task',
      payload: { sourceAssetId: 'alice-effector', targetRegime: 'LEO-POLAR' },
    });
    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/no F2T2E sensing capability/);
    expect(alice.apRemaining).toBe(apBefore); // no AP spent on a rejected action
    expect(alice.beliefOfOpponent.size).toBe(0); // no belief entry created either
  });

  it('a legitimate ceiling-reached re-task is accepted as a no-op refresh, not rejected', () => {
    // alice-sensor's ceiling is 'track' (chainRoles: ['fix','track']); task repeatedly until
    // the entry sits at 'track', then confirm a further tasking action is still accepted
    // (AP-spending, entry refreshed) rather than treated like the no-capability rejection above.
    for (let i = 0; i < 3; i++) {
      engine.handleAction(sessionId, 'alice', {
        type: 'task',
        payload: { sourceAssetId: 'alice-sensor', targetRegime: 'LEO-POLAR' },
      });
    }
    const alice = store.getPlayerState(sessionId, 'alice')!;
    expect(alice.beliefOfOpponent.get('bob-king')!.precision).toBe('track');

    const result = engine.handleAction(sessionId, 'alice', {
      type: 'task',
      payload: { sourceAssetId: 'alice-sensor', targetRegime: 'LEO-POLAR' },
    });
    expect(result.accepted).toBe(true); // still a legal action, just capped at 'track'
    expect(alice.beliefOfOpponent.get('bob-king')!.precision).toBe('track');
  });
});
