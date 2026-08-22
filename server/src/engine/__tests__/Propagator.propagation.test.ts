import { describe, expect, it } from 'vitest';
import type { Asset } from '@owchess/shared';
import { Propagator } from '../Propagator.js';

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

describe('Propagator.advance (IP-5010)', () => {
  it('is deterministic given fixed initial elements (NFR-2100)', () => {
    const p1 = new Propagator();
    const p2 = new Propagator();
    const a1 = makeAsset({});
    const a2 = makeAsset({});
    for (let i = 0; i < 5; i++) {
      p1.advance([a1]);
      p2.advance([a2]);
    }
    // Same initial regime, same number of ticks -> same resulting regime (no hidden randomness).
    expect(p1.currentRegime(a1)).toBe(p2.currentRegime(a2));
  });

  it('does not change an asset\'s regime through propagation alone (no maneuver)', () => {
    const p = new Propagator();
    const asset = makeAsset({ trueRegime: 'MEO-POLAR' });
    for (let i = 0; i < 20; i++) p.advance([asset]);
    expect(p.currentRegime(asset)).toBe('MEO-POLAR');
  });

  it('currentRegime never returns anything but one of R-203\'s 9 named labels', () => {
    const p = new Propagator();
    const asset = makeAsset({ trueRegime: 'GEO-PROGRADE' });
    const label = p.currentRegime(asset);
    expect([
      'LEO-EQUATORIAL', 'LEO-PROGRADE', 'LEO-POLAR',
      'MEO-EQUATORIAL', 'MEO-PROGRADE', 'MEO-POLAR',
      'GEO-EQUATORIAL', 'GEO-PROGRADE', 'GEO-POLAR',
    ]).toContain(label);
  });
});
