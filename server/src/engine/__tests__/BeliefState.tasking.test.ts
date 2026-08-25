import { beforeEach, describe, expect, it } from 'vitest';
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

describe('BeliefState (IP-2010)', () => {
  let beliefState: BeliefState;
  let observerState: PlayerState;
  let opponentState: PlayerState;

  beforeEach(() => {
    beliefState = new BeliefState();
    observerState = makePlayerState({ playerId: 'alice' });
    opponentState = makePlayerState({
      playerId: 'bob',
      assets: [makeAsset({ assetId: 'bob-sat', trueRegime: 'LEO-POLAR' })],
    });
  });

  it('advances precision one level per tasking action, capped at the sensor ceiling', () => {
    const findOnlySensor = makeAsset({ assetId: 'alice-sensor', chainRoles: ['find'] });
    beliefState.applyTasking('alice', observerState, findOnlySensor, 'LEO-POLAR', opponentState, 1);
    let entry = observerState.beliefOfOpponent.get('bob-sat')!;
    expect(entry.precision).toBe('find');

    beliefState.applyTasking('alice', observerState, findOnlySensor, 'LEO-POLAR', opponentState, 2);
    entry = observerState.beliefOfOpponent.get('bob-sat')!;
    expect(entry.precision).toBe('find'); // capped — sensor can never exceed 'find'
  });

  it('a fix-ceiling sensor advances find -> fix but no further', () => {
    const fixSensor = makeAsset({ assetId: 'alice-sensor', chainRoles: ['find', 'fix'] });
    beliefState.applyTasking('alice', observerState, fixSensor, 'LEO-POLAR', opponentState, 1);
    beliefState.applyTasking('alice', observerState, fixSensor, 'LEO-POLAR', opponentState, 2);
    beliefState.applyTasking('alice', observerState, fixSensor, 'LEO-POLAR', opponentState, 3);
    const entry = observerState.beliefOfOpponent.get('bob-sat')!;
    expect(entry.precision).toBe('fix');
    expect(entry.apparentRegime).toBe('LEO-POLAR');
  });

  it('a track-ceiling sensor advances up to track but not target', () => {
    const trackSensor = makeAsset({ assetId: 'alice-sensor', chainRoles: ['find', 'fix', 'track'] });
    for (let turn = 1; turn <= 4; turn++) {
      beliefState.applyTasking('alice', observerState, trackSensor, 'LEO-POLAR', opponentState, turn);
    }
    expect(observerState.beliefOfOpponent.get('bob-sat')!.precision).toBe('track');
  });

  it('produces no entry when the targeted regime is empty', () => {
    const sensor = makeAsset({ assetId: 'alice-sensor', chainRoles: ['find'] });
    beliefState.applyTasking('alice', observerState, sensor, 'GEO-EQUATORIAL', opponentState, 1);
    expect(observerState.beliefOfOpponent.size).toBe(0);
  });

  it('downgrades a stale entry one level after 5 turns without refresh (FR-2300/BL-0009)', () => {
    observerState.beliefOfOpponent.set('bob-sat', {
      subject: 'bob-sat',
      precision: 'fix',
      lastUpdatedTurn: 1,
      sourceAssetId: 'alice-sensor',
      deceived: false,
      apparentRegime: 'LEO-POLAR',
    });
    beliefState.decayStaleEntries(observerState, 6); // 6 - 1 = 5 turns stale
    expect(observerState.beliefOfOpponent.get('bob-sat')!.precision).toBe('find');
  });

  it('removes (not floors) a stale find-level entry (BL-0009)', () => {
    observerState.beliefOfOpponent.set('bob-sat', {
      subject: 'bob-sat',
      precision: 'find',
      lastUpdatedTurn: 1,
      sourceAssetId: 'alice-sensor',
      deceived: false,
      apparentRegime: null,
    });
    beliefState.decayStaleEntries(observerState, 6);
    expect(observerState.beliefOfOpponent.has('bob-sat')).toBe(false);
  });

  it('does not decay an entry refreshed within the staleness window', () => {
    observerState.beliefOfOpponent.set('bob-sat', {
      subject: 'bob-sat',
      precision: 'fix',
      lastUpdatedTurn: 3,
      sourceAssetId: 'alice-sensor',
      deceived: false,
      apparentRegime: 'LEO-POLAR',
    });
    beliefState.decayStaleEntries(observerState, 6); // only 3 turns stale
    expect(observerState.beliefOfOpponent.get('bob-sat')!.precision).toBe('fix');
  });
});
