import { describe, expect, it } from 'vitest';
import type { Asset, PlayerState } from '@owchess/shared';
import { computeLegalActions } from '../legality/legalityPreFilter.js';

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    assetId: 'a1',
    ownerId: 'alice',
    templateId: 't1',
    basing: 'space',
    chainRoles: [],
    trueRegime: 'LEO-EQUATORIAL',
    maneuverState: null,
    deployState: null,
    activeEffects: [],
    isKing: false,
    missionSet: null,
    consecutiveDenialTurns: 0,
    totalDenialTurns: 0,
    destroyed: false,
    ...overrides,
  };
}

function makePlayerState(overrides: Partial<PlayerState>): PlayerState {
  return {
    playerId: 'alice',
    king: makeAsset({ assetId: 'alice-king', isKing: true }),
    assets: [],
    apRemaining: 5,
    beliefOfOpponent: new Map(),
    ...overrides,
  };
}

describe('legalityPreFilter (IP-8010, resolves BL-0004)', () => {
  it('marks every action illegal when it is not the player\'s turn', () => {
    const state = makePlayerState({});
    const legality = computeLegalActions(state, 'bob');
    for (const kind of ['pass', 'deploy', 'maneuver', 'task', 'engage'] as const) {
      expect(legality[kind].legal).toBe(false);
      expect(legality[kind].reason).toMatch(/not your turn/);
    }
  });

  it('pass is always legal on your own turn regardless of AP', () => {
    const state = makePlayerState({ apRemaining: 0 });
    const legality = computeLegalActions(state, 'alice');
    expect(legality.pass.legal).toBe(true);
  });

  it('deploy/maneuver/task/engage are illegal with 0 AP', () => {
    const state = makePlayerState({ apRemaining: 0 });
    const legality = computeLegalActions(state, 'alice');
    expect(legality.deploy.legal).toBe(false);
    expect(legality.maneuver.legal).toBe(false);
    expect(legality.task.legal).toBe(false);
    expect(legality.engage.legal).toBe(false);
  });

  it('maneuver requires an online, non-maneuvering asset', () => {
    const state = makePlayerState({
      assets: [makeAsset({ assetId: 'a1', deployState: { turnsUntilOnline: 2 } })],
    });
    // King is online with no maneuverState -> maneuver should be legal via the King.
    expect(computeLegalActions(state, 'alice').maneuver.legal).toBe(true);

    const noOnlineAsset = makePlayerState({
      king: makeAsset({ assetId: 'alice-king', isKing: true, maneuverState: { targetRegime: 'MEO-EQUATORIAL', turnsRemaining: 2 } }),
    });
    expect(computeLegalActions(noOnlineAsset, 'alice').maneuver.legal).toBe(false);
  });

  it('task requires an online asset with a sensing chainRole', () => {
    const noSensor = makePlayerState({ assets: [makeAsset({ assetId: 'a1', chainRoles: ['engage'] })] });
    expect(computeLegalActions(noSensor, 'alice').task.legal).toBe(false);

    const withSensor = makePlayerState({ assets: [makeAsset({ assetId: 'a1', chainRoles: ['find'] })] });
    expect(computeLegalActions(withSensor, 'alice').task.legal).toBe(true);
  });

  it('engage requires an online asset with the engage chainRole', () => {
    const noEffector = makePlayerState({ assets: [makeAsset({ assetId: 'a1', chainRoles: ['find'] })] });
    expect(computeLegalActions(noEffector, 'alice').engage.legal).toBe(false);

    const withEffector = makePlayerState({ assets: [makeAsset({ assetId: 'a1', chainRoles: ['engage'] })] });
    expect(computeLegalActions(withEffector, 'alice').engage.legal).toBe(true);
  });

  it('a pre-online asset does not count toward task/engage/maneuver legality', () => {
    const state = makePlayerState({
      king: makeAsset({ assetId: 'alice-king', isKing: true, maneuverState: { targetRegime: 'MEO-EQUATORIAL', turnsRemaining: 1 } }),
      assets: [makeAsset({ assetId: 'a1', chainRoles: ['find', 'engage'], deployState: { turnsUntilOnline: 1 } })],
    });
    const legality = computeLegalActions(state, 'alice');
    expect(legality.task.legal).toBe(false);
    expect(legality.engage.legal).toBe(false);
    expect(legality.maneuver.legal).toBe(false);
  });
});
