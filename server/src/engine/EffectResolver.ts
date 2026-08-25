/**
 * EffectResolver (IP-4010) — engagement gating, structural Deceive/Destroy dispatch, cumulative
 * Degrade stacking, and the King denial-streak tracker (BL-0015: stored field, not recomputed).
 */
import type {
  Asset,
  EffectStateEntry,
  EngagementResult,
  FiveDsEffect,
  OrbitalRegimeLabel,
  PlayerState,
} from '@owchess/shared';
import type { BeliefState } from './BeliefState.js';

/** FS-105's pinned numeric refinement: durations short enough that no single application wins
 *  outright against the 6-turn mission-denial threshold (FR-4400). */
const DISRUPT_DENY_DURATION = 3;
const DEGRADE_DURATION = 4;

export class EffectResolver {
  /**
   * FR-4002: requires at least 'target'-level precision (read from the effector's own player's
   * beliefOfOpponent — a deviation matching BL-0028/BL-0033's pattern, since GDS-09's signature
   * has no state-access parameter either; see this package's Deviation note). Destroy flags the
   * target destroyed; Deceive calls BeliefState.applyDeception instead of mutating target's own
   * true state (the structural distinction GDS-04/07 require, enforced here, not merely
   * described).
   */
  resolveEngagement(
    effectorObserverState: PlayerState,
    effector: Asset,
    target: Asset,
    effect: FiveDsEffect,
    beliefState: BeliefState,
    currentTurn: number,
    falseRegime?: OrbitalRegimeLabel
  ): EngagementResult {
    const belief = effectorObserverState.beliefOfOpponent.get(target.assetId);
    if (belief?.precision !== 'target') {
      return { effect, success: false, reason: 'insufficient targeting-quality data (FR-4002)' };
    }

    switch (effect) {
      case 'destroy':
        target.destroyed = true;
        return { effect, success: true };

      case 'deceive':
        beliefState.applyDeception(
          effectorObserverState,
          target.assetId,
          falseRegime ?? target.trueRegime,
          currentTurn,
          effector.assetId
        );
        return { effect, success: true };

      case 'disrupt':
      case 'deny':
        this.addEffectEntry(target, effect, DISRUPT_DENY_DURATION, currentTurn, effector.assetId);
        return { effect, success: true };

      case 'degrade':
        this.addEffectEntry(target, 'degrade', DEGRADE_DURATION, currentTurn, effector.assetId);
        return { effect, success: true };

      default:
        return { effect, success: false, reason: `unknown effect kind ${effect}` };
    }
  }

  private addEffectEntry(
    target: Asset,
    kind: 'disrupt' | 'deny' | 'degrade',
    durationTurns: number,
    currentTurn: number,
    sourceEffectorAssetId: string
  ): void {
    // FR-4300: multiple concurrent Degrade entries coexist and tick independently, they don't
    // overwrite. A fresh Disrupt/Deny application is likewise its own new entry.
    const entry: EffectStateEntry = {
      kind,
      appliedTurn: currentTurn,
      durationTurns,
      stackCount: 1,
      sourceEffectorAssetId,
    };
    target.activeEffects.push(entry);
  }

  /**
   * Decrements every active effect's remaining duration; expires (removes) entries that reach
   * zero. Updates the King's consecutiveDenialTurns (BL-0015): increments while >=1 qualifying
   * Disrupt/Deny/Degrade entry is active, resets to 0 the instant none are.
   */
  tickActiveEffects(asset: Asset, currentTurn: number): void {
    asset.activeEffects = asset.activeEffects.filter((entry) => {
      if (entry.durationTurns === 'until-cleared') return true;
      const elapsed = currentTurn - entry.appliedTurn;
      return elapsed < entry.durationTurns;
    });

    if (asset.isKing) {
      const denied = asset.activeEffects.some(
        (e) => e.kind === 'disrupt' || e.kind === 'deny' || e.kind === 'degrade'
      );
      if (denied) {
        asset.consecutiveDenialTurns += 1;
        asset.totalDenialTurns += 1;
      } else {
        asset.consecutiveDenialTurns = 0;
      }
    }
  }
}
