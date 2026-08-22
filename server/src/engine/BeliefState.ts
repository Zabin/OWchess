/**
 * BeliefState (IP-2010) — content-producing half: tasking + staleness decay.
 * computeOpponentView/applyDeception (the enforcement half) are added by IP-6010 to this same
 * file, per FS-106's own scope split (see that package's Documentation Updates note).
 */
import type {
  Asset,
  AssetId,
  BeliefPrecision,
  BeliefStateEntry,
  ChainRole,
  OpponentView,
  OrbitalRegimeLabel,
  PlayerId,
  PlayerState,
} from '@owchess/shared';

const PRECISION_ORDER: BeliefPrecision[] = ['find', 'fix', 'track', 'target'];
/** BL-0009: turns without refresh before an entry decays one precision level. */
const STALENESS_WINDOW = 5;

function precisionIndex(p: BeliefPrecision): number {
  return PRECISION_ORDER.indexOf(p);
}

/**
 * True if chainRoles includes at least one F2T2E sensing role (find/fix/track/target) — false
 * for a purely 'engage' (effector-only) asset, which has nothing to task with (VR-2010 F1: a
 * caller must check this before spending AP, since applyTasking itself only no-ops silently).
 */
export function hasSensorCapability(chainRoles: ChainRole[]): boolean {
  return capabilityCeiling(chainRoles) >= 0;
}

/** The highest F2T2E precision level a sensor's declared chainRoles can produce. */
function capabilityCeiling(chainRoles: ChainRole[]): number {
  let ceiling = -1;
  for (const role of chainRoles) {
    const idx = PRECISION_ORDER.indexOf(role as BeliefPrecision);
    if (idx > ceiling) ceiling = idx;
  }
  return ceiling;
}

export class BeliefState {
  /**
   * FR-2100/2200: advances the observer's belief about whichever opponent asset(s) actually sit
   * in targetRegime, one precision level, capped at sourceAsset's chainRoles ceiling. A tasking
   * action that finds nothing in the regime produces no belief entry.
   */
  applyTasking(
    observer: PlayerId,
    observerState: PlayerState,
    sourceAsset: Asset,
    targetRegime: OrbitalRegimeLabel,
    opponentTrueState: PlayerState,
    turnNumber: number
  ): void {
    const ceiling = capabilityCeiling(sourceAsset.chainRoles);
    if (ceiling < 0) return; // no sensor role at all — nothing this asset can task with

    const presentAssets = [opponentTrueState.king, ...opponentTrueState.assets].filter(
      (a) => !a.destroyed && a.trueRegime === targetRegime
    );

    for (const target of presentAssets) {
      const existing = observerState.beliefOfOpponent.get(target.assetId);
      const currentIdx = existing ? precisionIndex(existing.precision) : -1;
      const nextIdx = Math.min(currentIdx + 1, ceiling, PRECISION_ORDER.length - 1);
      const precision = PRECISION_ORDER[Math.max(nextIdx, 0)];
      const entry: BeliefStateEntry = {
        subject: target.assetId,
        precision,
        lastUpdatedTurn: turnNumber,
        sourceAssetId: sourceAsset.assetId,
        deceived: existing?.deceived ?? false,
        apparentRegime: precisionIndex(precision) >= precisionIndex('fix') ? targetRegime : null,
      };
      observerState.beliefOfOpponent.set(target.assetId, entry);
    }
  }

  /**
   * FR-2300 (BL-0009): entries unrefreshed for >= 5 turns downgrade one level; a stale 'find'
   * entry is removed entirely (reverts to fully unknown), not floored.
   */
  decayStaleEntries(observerState: PlayerState, currentTurn: number): void {
    for (const [key, entry] of observerState.beliefOfOpponent) {
      if (currentTurn - entry.lastUpdatedTurn < STALENESS_WINDOW) continue;
      const idx = precisionIndex(entry.precision);
      if (idx <= 0) {
        observerState.beliefOfOpponent.delete(key);
        continue;
      }
      const downgraded: BeliefStateEntry = {
        ...entry,
        precision: PRECISION_ORDER[idx - 1],
        lastUpdatedTurn: currentTurn, // reset the clock on the downgraded level itself
        apparentRegime: idx - 1 >= precisionIndex('fix') ? entry.apparentRegime : null,
      };
      observerState.beliefOfOpponent.set(key, downgraded);
    }
  }

  /**
   * FR-6100/NFR-3100 (IP-6010): the SOLE function permitted to construct client-bound opponent
   * data. Reads only observerState.beliefOfOpponent (what observer has earned) — never reads
   * trueOpponentState's assets/king/activeEffects directly, which is what makes an accidental
   * full-object leak structurally impossible rather than merely a missed filter.
   */
  computeOpponentView(
    observer: PlayerId,
    observerState: PlayerState,
    trueOpponentState: PlayerState,
    _turnNumber: number
  ): OpponentView {
    return {
      playerId: trueOpponentState.playerId,
      beliefEntries: Array.from(observerState.beliefOfOpponent.values()),
    };
  }

  /**
   * FR-4003 (Deceive path, GDS-04/07's structural distinction): corrupts observer's own belief
   * entry for subject — never touches subject's true Asset record. Distinct code path from
   * Destroy (which removes/flags the true Asset itself, EffectResolver's job, not BeliefState's).
   */
  applyDeception(
    observerState: PlayerState,
    subject: AssetId,
    falseRegime: OrbitalRegimeLabel,
    turnNumber: number,
    sourceAssetId: AssetId
  ): void {
    const existing = observerState.beliefOfOpponent.get(subject);
    const entry: BeliefStateEntry = {
      subject,
      precision: existing?.precision ?? 'fix',
      lastUpdatedTurn: turnNumber,
      sourceAssetId: existing?.sourceAssetId ?? sourceAssetId,
      deceived: true,
      apparentRegime: falseRegime,
    };
    observerState.beliefOfOpponent.set(subject, entry);
  }
}
