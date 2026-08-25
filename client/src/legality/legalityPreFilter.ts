/**
 * Client-side legality pre-filter (IP-8010, resolves BL-0004) — a bounded, read-only copy of the
 * server's coarse legality rules, generated against `shared/`'s own types (never a hand-invented
 * duplicate ruleset). NFR-4200's one permitted exception: this can be briefly stale relative to a
 * change in flight; the server's own validation remains the real gate (FR-1320/NFR-4002).
 */
import type { Asset, PlayerId, PlayerState } from '@owchess/shared';

export type ActionKind = 'pass' | 'deploy' | 'maneuver' | 'task' | 'engage';

export interface LegalActionResult {
  legal: boolean;
  reason?: string;
}

export type LegalActionSet = Record<ActionKind, LegalActionResult>;

function isOnline(asset: Asset): boolean {
  return asset.deployState === null;
}

const SENSOR_ROLES = new Set(['find', 'fix', 'track', 'target']);

function hasSensorRole(asset: Asset): boolean {
  return asset.chainRoles.some((r) => SENSOR_ROLES.has(r));
}

function hasEngageRole(asset: Asset): boolean {
  return asset.chainRoles.includes('engage');
}

/**
 * Computes which action types are currently legal for `ownState`, given whose turn it is.
 * Matches the server's own coarse gates (turn, AP > 0, at least one eligible online asset) —
 * exact per-action legality (a specific maneuver's fuel cost, a specific target's precision)
 * still belongs to the server; this pre-filter exists only so the UI never shows a dead menu
 * entry for a whole action *category* that has no chance of being legal (FR-1320).
 */
export function computeLegalActions(ownState: PlayerState, activeTurn: PlayerId): LegalActionSet {
  const isMyTurn = activeTurn === ownState.playerId;
  if (!isMyTurn) {
    const notYourTurn: LegalActionResult = { legal: false, reason: 'not your turn' };
    return { pass: notYourTurn, deploy: notYourTurn, maneuver: notYourTurn, task: notYourTurn, engage: notYourTurn };
  }

  const allAssets = [ownState.king, ...ownState.assets];
  const ap = ownState.apRemaining;

  const noAp: LegalActionResult = { legal: false, reason: 'no AP remaining' };

  return {
    pass: { legal: true }, // always legal on your own turn, regardless of AP (FR-1340)
    deploy: ap > 0 ? { legal: true } : noAp,
    maneuver:
      ap > 0 && allAssets.some((a) => isOnline(a) && a.maneuverState === null)
        ? { legal: true }
        : ap <= 0
          ? noAp
          : { legal: false, reason: 'no online, non-maneuvering asset' },
    task:
      ap > 0 && allAssets.some((a) => isOnline(a) && hasSensorRole(a))
        ? { legal: true }
        : ap <= 0
          ? noAp
          : { legal: false, reason: 'no online sensor asset' },
    engage:
      ap > 0 && allAssets.some((a) => isOnline(a) && hasEngageRole(a))
        ? { legal: true }
        : ap <= 0
          ? noAp
          : { legal: false, reason: 'no online effector asset' },
  };
}
