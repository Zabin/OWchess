/**
 * Propagator (IP-5010) — two-body Keplerian propagation (MSTR-001 C4 v0.3: no J2 term for v1),
 * discrete-regime classification (R-203's 9 labels), and maneuver planning/completion using
 * FS-104's Maneuver Cost Table (grounded in R-201). Sole module holding continuous orbital
 * state (GDS-03's isolation boundary) — every external read goes through currentRegime, never a
 * raw element.
 */
import type { Asset, OrbitalRegimeLabel } from '@owchess/shared';

type AltitudeBand = 'LEO' | 'MEO' | 'GEO';
type PlaneClass = 'EQUATORIAL' | 'PROGRADE' | 'POLAR';

const ALTITUDE_BANDS: AltitudeBand[] = ['LEO', 'MEO', 'GEO'];
const PLANE_CLASSES: PlaneClass[] = ['EQUATORIAL', 'PROGRADE', 'POLAR'];

/** Mean motion (degrees per turn-tick), a fixed per-altitude-band constant — faster in lower
 *  orbits, matching real orbital mechanics (shorter period at lower altitude). Internal
 *  bookkeeping only; never exposed past currentRegime. */
const MEAN_MOTION_DEG_PER_TICK: Record<AltitudeBand, number> = {
  LEO: 24, // fast — short real-world period (~90 min)
  MEO: 6, // GPS-like, ~12h period
  GEO: 1.5, // ~24h period
};

interface InternalOrbitalState {
  altitude: AltitudeBand;
  plane: PlaneClass;
  meanAnomalyDeg: number;
}

function parseRegime(label: OrbitalRegimeLabel): { altitude: AltitudeBand; plane: PlaneClass } {
  const [altitude, plane] = label.split('-') as [AltitudeBand, PlaneClass];
  return { altitude, plane };
}

function regimeLabel(altitude: AltitudeBand, plane: PlaneClass): OrbitalRegimeLabel {
  return `${altitude}-${plane}` as OrbitalRegimeLabel;
}

/** FS-104 Maneuver Cost Table §Altitude component. */
const ALTITUDE_COST: Record<string, { fuel: number; turns: number }> = {
  'LEO-LEO': { fuel: 0, turns: 0 },
  'MEO-MEO': { fuel: 0, turns: 0 },
  'GEO-GEO': { fuel: 0, turns: 0 },
  'LEO-MEO': { fuel: 3, turns: 2 },
  'MEO-LEO': { fuel: 3, turns: 2 },
  'MEO-GEO': { fuel: 1, turns: 3 },
  'GEO-MEO': { fuel: 1, turns: 3 },
  'LEO-GEO': { fuel: 4, turns: 4 },
  'GEO-LEO': { fuel: 4, turns: 4 },
};

/** FS-104 Maneuver Cost Table §Plane-class component, evaluated at the given (starting) altitude. */
const PLANE_COST: Record<AltitudeBand, Record<string, { fuel: number; turns: number }>> = {
  LEO: {
    'EQUATORIAL-EQUATORIAL': { fuel: 0, turns: 0 },
    'PROGRADE-PROGRADE': { fuel: 0, turns: 0 },
    'POLAR-POLAR': { fuel: 0, turns: 0 },
    'EQUATORIAL-PROGRADE': { fuel: 6, turns: 2 },
    'PROGRADE-EQUATORIAL': { fuel: 6, turns: 2 },
    'PROGRADE-POLAR': { fuel: 6, turns: 2 },
    'POLAR-PROGRADE': { fuel: 6, turns: 2 },
    'EQUATORIAL-POLAR': { fuel: 11, turns: 3 },
    'POLAR-EQUATORIAL': { fuel: 11, turns: 3 },
  },
  MEO: {
    'EQUATORIAL-EQUATORIAL': { fuel: 0, turns: 0 },
    'PROGRADE-PROGRADE': { fuel: 0, turns: 0 },
    'POLAR-POLAR': { fuel: 0, turns: 0 },
    'EQUATORIAL-PROGRADE': { fuel: 3, turns: 1 },
    'PROGRADE-EQUATORIAL': { fuel: 3, turns: 1 },
    'PROGRADE-POLAR': { fuel: 3, turns: 1 },
    'POLAR-PROGRADE': { fuel: 3, turns: 1 },
    'EQUATORIAL-POLAR': { fuel: 5, turns: 2 },
    'POLAR-EQUATORIAL': { fuel: 5, turns: 2 },
  },
  GEO: {
    'EQUATORIAL-EQUATORIAL': { fuel: 0, turns: 0 },
    'PROGRADE-PROGRADE': { fuel: 0, turns: 0 },
    'POLAR-POLAR': { fuel: 0, turns: 0 },
    'EQUATORIAL-PROGRADE': { fuel: 2, turns: 1 },
    'PROGRADE-EQUATORIAL': { fuel: 2, turns: 1 },
    'PROGRADE-POLAR': { fuel: 2, turns: 1 },
    'POLAR-PROGRADE': { fuel: 2, turns: 1 },
    'EQUATORIAL-POLAR': { fuel: 4, turns: 1 },
    'POLAR-EQUATORIAL': { fuel: 4, turns: 1 },
  },
};

/** Combined-maneuver discount (FS-104 §Maneuver Cost Table): both axes change in one call. */
const COMBINED_MANEUVER_DISCOUNT = 0.25;

export class Propagator {
  private states = new Map<string, InternalOrbitalState>();

  private stateFor(asset: Asset): InternalOrbitalState {
    let state = this.states.get(asset.assetId);
    if (!state) {
      const { altitude, plane } = parseRegime(asset.trueRegime);
      state = { altitude, plane, meanAnomalyDeg: 0 };
      this.states.set(asset.assetId, state);
    }
    return state;
  }

  /** Advances every tracked asset's true orbital position by one turn-tick (NFR-2100:
   *  deterministic given fixed prior state). A stable orbit's altitude/plane class do not change
   *  from mere propagation (real two-body mechanics) — only a completed maneuver changes them. */
  advance(assets: Asset[]): void {
    for (const asset of assets) {
      const state = this.stateFor(asset);
      state.meanAnomalyDeg = (state.meanAnomalyDeg + MEAN_MOTION_DEG_PER_TICK[state.altitude]) % 360;
    }
  }

  /** FR-5200: discrete presentation only — never exposes raw elements past this call's return. */
  currentRegime(asset: Asset): OrbitalRegimeLabel {
    const state = this.stateFor(asset);
    return regimeLabel(state.altitude, state.plane);
  }

  /**
   * FS-104's Maneuver Cost Table. BL-0014: rejects outright if a maneuver is already in progress
   * (GDS-07's single-field maneuverState schema — no queuing/replacement).
   */
  planManeuver(
    asset: Asset,
    targetRegime: OrbitalRegimeLabel
  ): { turnsRequired: number; fuelCost: number; rejected?: string } {
    if (asset.maneuverState !== null) {
      return { turnsRequired: 0, fuelCost: 0, rejected: 'a maneuver is already in progress (BL-0014)' };
    }
    const from = parseRegime(this.currentRegime(asset));
    const to = parseRegime(targetRegime);

    const altitude = ALTITUDE_COST[`${from.altitude}-${to.altitude}`];
    const plane = PLANE_COST[from.altitude][`${from.plane}-${to.plane}`];

    let fuelCost: number;
    let turnsRequired: number;
    if (altitude.fuel > 0 && plane.fuel > 0) {
      fuelCost = Math.floor((altitude.fuel + plane.fuel) * (1 - COMBINED_MANEUVER_DISCOUNT));
      turnsRequired = Math.max(altitude.turns, plane.turns) + 1;
    } else if (altitude.fuel > 0) {
      fuelCost = altitude.fuel;
      turnsRequired = altitude.turns;
    } else {
      fuelCost = plane.fuel;
      turnsRequired = plane.turns;
    }
    return { turnsRequired, fuelCost };
  }

  /**
   * True if an in-progress maneuver has completed this owner-turn-advance; finalizes trueRegime
   * and internal state, clearing maneuverState, when it has.
   */
  maneuverComplete(asset: Asset): boolean {
    if (asset.maneuverState === null) return false;
    if (asset.maneuverState.turnsRemaining > 0) return false;

    const target = parseRegime(asset.maneuverState.targetRegime);
    const state = this.stateFor(asset);
    state.altitude = target.altitude;
    state.plane = target.plane;
    asset.trueRegime = asset.maneuverState.targetRegime;
    asset.maneuverState = null;
    return true;
  }
}
