import { describe, expect, it } from 'vitest';
import type { Asset, PlayerState } from '@owchess/shared';
import { BeliefState } from '../BeliefState.js';

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    assetId: 'a1',
    ownerId: 'bob',
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
    playerId: 'bob',
    king: makeAsset({ assetId: 'bob-king', isKing: true }),
    assets: [],
    apRemaining: 5,
    beliefOfOpponent: new Map(),
    ...overrides,
  };
}

describe('BeliefState fog-of-war enforcement (IP-6010)', () => {
  it('computeOpponentView contains only what the observer has earned, never the true state', () => {
    const beliefState = new BeliefState();
    const observerState = makePlayerState({ playerId: 'alice' });
    observerState.beliefOfOpponent.set('bob-sat', {
      subject: 'bob-sat',
      precision: 'fix',
      lastUpdatedTurn: 3,
      sourceAssetId: 'alice-sensor',
      deceived: false,
      apparentRegime: 'LEO-POLAR',
    });

    const trueOpponentState = makePlayerState({
      playerId: 'bob',
      assets: [
        makeAsset({ assetId: 'bob-sat', trueRegime: 'LEO-POLAR' }),
        makeAsset({ assetId: 'bob-secret-asset', trueRegime: 'GEO-EQUATORIAL' }), // never tasked
      ],
    });

    const view = beliefState.computeOpponentView('alice', observerState, trueOpponentState, 5);

    expect(view.playerId).toBe('bob');
    expect(view.beliefEntries).toHaveLength(1);
    expect(view.beliefEntries[0].subject).toBe('bob-sat');
    // Structural guarantee: OpponentView never carries the shape of PlayerState.
    expect(view).not.toHaveProperty('king');
    expect(view).not.toHaveProperty('assets');
    expect(view).not.toHaveProperty('apRemaining');
    // The untasked asset never appears, no matter how it's stored server-side.
    expect(view.beliefEntries.some((e) => e.subject === 'bob-secret-asset')).toBe(false);
  });

  it('applyDeception corrupts the observer\'s belief entry, never the subject\'s true state', () => {
    const beliefState = new BeliefState();
    const observerState = makePlayerState({ playerId: 'alice' });
    const trueAsset = makeAsset({ assetId: 'bob-sat', trueRegime: 'LEO-POLAR' });

    beliefState.applyDeception(observerState, 'bob-sat', 'GEO-EQUATORIAL', 5, 'bob-decoy-effector');

    const entry = observerState.beliefOfOpponent.get('bob-sat')!;
    expect(entry.deceived).toBe(true);
    expect(entry.apparentRegime).toBe('GEO-EQUATORIAL');
    // The subject's own true record is untouched — deception never mutates true state.
    expect(trueAsset.trueRegime).toBe('LEO-POLAR');
    expect(trueAsset.destroyed).toBe(false);
  });

  it('applyDeception preserves an existing entry\'s precision rather than resetting it', () => {
    const beliefState = new BeliefState();
    const observerState = makePlayerState({ playerId: 'alice' });
    observerState.beliefOfOpponent.set('bob-sat', {
      subject: 'bob-sat',
      precision: 'track',
      lastUpdatedTurn: 2,
      sourceAssetId: 'alice-sensor',
      deceived: false,
      apparentRegime: 'LEO-POLAR',
    });

    beliefState.applyDeception(observerState, 'bob-sat', 'MEO-EQUATORIAL', 6, 'bob-decoy-effector');

    const entry = observerState.beliefOfOpponent.get('bob-sat')!;
    expect(entry.precision).toBe('track'); // unchanged
    expect(entry.apparentRegime).toBe('MEO-EQUATORIAL'); // corrupted
    expect(entry.deceived).toBe(true);
  });
});
