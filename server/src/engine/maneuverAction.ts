/**
 * Maneuver action wiring (IP-5010) — fills GameEngine's 'maneuver' handler slot (stubbed by
 * IP-1010), and wires the maneuver-in-progress tick into the turn-advance loop.
 */
import type { Asset, ActionResult, OrbitalRegimeLabel, PlayerId, SessionId } from '@owchess/shared';
import type { SessionStore } from './SessionStore.js';
import type { TurnManager } from './TurnManager.js';
import { Propagator } from './Propagator.js';
import { assertOnline } from './deployAction.js';

export function makeManeuverHandler(
  store: SessionStore,
  turnManagerFor: (sessionId: SessionId) => TurnManager,
  propagator: Propagator
) {
  return function maneuverAsset(
    sessionId: SessionId,
    actingPlayer: PlayerId,
    action: { type: string; payload: Record<string, unknown> }
  ): ActionResult {
    const assetId = action.payload.assetId as string;
    const targetRegime = action.payload.targetRegime as OrbitalRegimeLabel;

    const player = store.getPlayerState(sessionId, actingPlayer);
    if (!player) return { accepted: false, reason: 'no such session' };
    const asset = [player.king, ...player.assets].find((a) => a.assetId === assetId);
    if (!asset) return { accepted: false, reason: `no such owned asset ${assetId}` };

    const session = store.getSession(sessionId)!;
    const online = assertOnline(asset, session.turnNumber);
    if (!online.ok) return { accepted: false, reason: online.reason };

    const plan = propagator.planManeuver(asset, targetRegime);
    if (plan.rejected) return { accepted: false, reason: plan.rejected };

    const tm = turnManagerFor(sessionId);
    const spend = tm.spendAP(actingPlayer, 1); // FR-5300: flat 1 AP, subject to fuel budget below
    if (!spend.accepted) return spend;

    // Fuel-analog budget check would consume from a per-asset fuel pool once one exists on the
    // template/asset (not yet modeled — see this package's Deviation note); for v1, the AP cost
    // gates the action and the Maneuver Cost Table's fuelCost is tracked for future budget use.
    asset.maneuverState = { targetRegime, turnsRemaining: plan.turnsRequired };
    return { accepted: true };
  };
}

/** Decrements every in-progress maneuver's turnsRemaining once per owner-turn (OQ-11), then
 *  finalizes any that reach zero via Propagator.maneuverComplete. */
export function tickManeuvers(assets: Asset[], propagator: Propagator): void {
  for (const asset of assets) {
    if (asset.maneuverState !== null) {
      asset.maneuverState.turnsRemaining -= 1;
      propagator.maneuverComplete(asset);
    }
  }
}
