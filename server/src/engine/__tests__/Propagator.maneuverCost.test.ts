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

describe('Propagator.planManeuver — Maneuver Cost Table (IP-5010)', () => {
  it('matches FS-104\'s worked example: LEO-EQUATORIAL -> GEO-POLAR = 11 fuel / 5 turns', () => {
    const p = new Propagator();
    const asset = makeAsset({ trueRegime: 'LEO-EQUATORIAL' });
    const plan = p.planManeuver(asset, 'GEO-POLAR');
    expect(plan).toMatchObject({ fuelCost: 11, turnsRequired: 5 });
  });

  it('prices a same-band, plane-only change using the plane component alone', () => {
    const p = new Propagator();
    const asset = makeAsset({ trueRegime: 'LEO-EQUATORIAL' });
    const plan = p.planManeuver(asset, 'LEO-PROGRADE');
    expect(plan).toMatchObject({ fuelCost: 6, turnsRequired: 2 });
  });

  it('prices a same-plane, altitude-only change using the altitude component alone', () => {
    const p = new Propagator();
    const asset = makeAsset({ trueRegime: 'LEO-EQUATORIAL' });
    const plan = p.planManeuver(asset, 'MEO-EQUATORIAL');
    expect(plan).toMatchObject({ fuelCost: 3, turnsRequired: 2 });
  });

  it('plane changes are cheaper at higher starting altitude (GEO vs. LEO)', () => {
    const p = new Propagator();
    const leoAsset = makeAsset({ trueRegime: 'LEO-EQUATORIAL' });
    const geoAsset = makeAsset({ assetId: 'a2', trueRegime: 'GEO-EQUATORIAL' });
    const fromLeo = p.planManeuver(leoAsset, 'LEO-POLAR');
    const fromGeo = p.planManeuver(geoAsset, 'GEO-POLAR');
    expect(fromGeo.fuelCost).toBeLessThan(fromLeo.fuelCost);
  });

  it('BL-0014: rejects a second maneuver while one is already in progress', () => {
    const p = new Propagator();
    const asset = makeAsset({
      trueRegime: 'LEO-EQUATORIAL',
      maneuverState: { targetRegime: 'MEO-EQUATORIAL', turnsRemaining: 2 },
    });
    const plan = p.planManeuver(asset, 'GEO-POLAR');
    expect(plan.rejected).toMatch(/already in progress/);
  });
});

describe('Propagator.maneuverComplete (IP-5010)', () => {
  it('completes and updates trueRegime once turnsRemaining reaches 0', () => {
    const p = new Propagator();
    const asset = makeAsset({
      trueRegime: 'LEO-EQUATORIAL',
      maneuverState: { targetRegime: 'MEO-EQUATORIAL', turnsRemaining: 0 },
    });
    const done = p.maneuverComplete(asset);
    expect(done).toBe(true);
    expect(asset.trueRegime).toBe('MEO-EQUATORIAL');
    expect(asset.maneuverState).toBeNull();
    expect(p.currentRegime(asset)).toBe('MEO-EQUATORIAL');
  });

  it('does not complete while turnsRemaining is still positive', () => {
    const p = new Propagator();
    const asset = makeAsset({
      trueRegime: 'LEO-EQUATORIAL',
      maneuverState: { targetRegime: 'MEO-EQUATORIAL', turnsRemaining: 1 },
    });
    expect(p.maneuverComplete(asset)).toBe(false);
    expect(asset.maneuverState).not.toBeNull();
  });

  it('returns false for an asset with no in-progress maneuver', () => {
    const p = new Propagator();
    const asset = makeAsset({ maneuverState: null });
    expect(p.maneuverComplete(asset)).toBe(false);
  });
});
