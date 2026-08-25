import { beforeEach, describe, expect, it } from 'vitest';
import { createGameEngine } from '../createGameEngine.js';

describe('createGameEngine wiring (BL-0030)', () => {
  let ctx: ReturnType<typeof createGameEngine>;
  let sessionId: string;

  beforeEach(() => {
    ctx = createGameEngine();
    sessionId = ctx.store.createSession('alice');
    ctx.store.joinSession(sessionId, 'bob');
    ctx.store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    ctx.store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');
    ctx.turnManagerFor(sessionId); // ensures hooks are registered before play begins
  });

  it('a deployed asset actually comes online after its owner\'s turns elapse', () => {
    const deploy = ctx.engine.handleAction(sessionId, 'alice', {
      type: 'deploy',
      payload: { templateId: 'ground-tracking-array', targetRegime: 'LEO-EQUATORIAL' },
    });
    expect(deploy.accepted).toBe(true);
    const alice = ctx.store.getPlayerState(sessionId, 'alice')!;
    expect(alice.assets[0].deployState).toEqual({ turnsUntilOnline: 1 });

    // ground-tracking-array timeToOnline=1: one of alice's own turn-ends should bring it online.
    const tm = ctx.turnManagerFor(sessionId);
    tm.advanceTurn(); // alice's turn ends
    tm.advanceTurn(); // bob's turn ends -> back to alice
    expect(alice.assets[0].deployState).toBeNull();
  });

  it('a maneuver actually completes and updates trueRegime after enough owner turns', () => {
    const kingId = 'alice-king';
    const maneuver = ctx.engine.handleAction(sessionId, 'alice', {
      type: 'maneuver',
      payload: { assetId: kingId, targetRegime: 'GEO-POLAR' },
    });
    expect(maneuver.accepted).toBe(true);
    const alice = ctx.store.getPlayerState(sessionId, 'alice')!;
    expect(alice.king.maneuverState).not.toBeNull();
    const turnsRequired = alice.king.maneuverState!.turnsRemaining; // same-plane? no, cross plane

    const tm = ctx.turnManagerFor(sessionId);
    // Advance alice's own turn `turnsRequired` times (each pair of advanceTurn calls is one
    // full round: alice's turn ends, bob's turn ends).
    for (let i = 0; i < turnsRequired; i++) {
      tm.advanceTurn(); // alice's turn ends (ticks alice's assets)
      tm.advanceTurn(); // bob's turn ends (ticks bob's assets, not alice's)
    }
    expect(alice.king.maneuverState).toBeNull();
    expect(alice.king.trueRegime).toBe('GEO-POLAR');
  });

  it('tasking bob\'s king builds a belief entry that later decays after 5 stale turns', () => {
    const alice = ctx.store.getPlayerState(sessionId, 'alice')!;
    alice.assets.push({
      assetId: 'alice-sensor',
      ownerId: 'alice',
      templateId: 'ground-tracking-array',
      basing: 'ground',
      chainRoles: ['fix', 'track'],
      trueRegime: 'LEO-POLAR',
      maneuverState: null,
      deployState: null,
      activeEffects: [],
      isKing: false,
      missionSet: null,
      consecutiveDenialTurns: 0,
      totalDenialTurns: 0,
      destroyed: false,
    });

    const task = ctx.engine.handleAction(sessionId, 'alice', {
      type: 'task',
      payload: { sourceAssetId: 'alice-sensor', targetRegime: 'LEO-POLAR' },
    });
    expect(task.accepted).toBe(true);
    expect(alice.beliefOfOpponent.get('bob-king')).toBeDefined();

    const tm = ctx.turnManagerFor(sessionId);
    for (let i = 0; i < 6; i++) tm.advanceTurn(); // several rounds pass with no refresh
    // Entry started at 'find' (single tasking) -> stale removal after 5 turns unrefreshed.
    expect(alice.beliefOfOpponent.has('bob-king')).toBe(false);
  });
});
