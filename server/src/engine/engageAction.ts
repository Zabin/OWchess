/**
 * Engage action wiring (IP-4010) — fills GameEngine's 'engage' handler slot (stubbed by IP-1010).
 */
import type { ActionResult, FiveDsEffect, OrbitalRegimeLabel, PlayerId, SessionId } from '@owchess/shared';
import type { SessionStore } from './SessionStore.js';
import type { TurnManager } from './TurnManager.js';
import { EffectResolver } from './EffectResolver.js';
import { BeliefState } from './BeliefState.js';
import { assertOnline } from './deployAction.js';

const ENGAGE_AP_COST = 1;

export function makeEngageHandler(
  store: SessionStore,
  turnManagerFor: (sessionId: SessionId) => TurnManager,
  effectResolver: EffectResolver,
  beliefState: BeliefState
) {
  return function engageAsset(
    sessionId: SessionId,
    actingPlayer: PlayerId,
    action: { type: string; payload: Record<string, unknown> }
  ): ActionResult {
    const effectorAssetId = action.payload.effectorAssetId as string;
    const targetAssetId = action.payload.targetAssetId as string;
    const effect = action.payload.effect as FiveDsEffect;
    const falseRegime = action.payload.falseRegime as OrbitalRegimeLabel | undefined;

    const observerState = store.getPlayerState(sessionId, actingPlayer);
    const opponentState = store.getOpponentState(sessionId, actingPlayer);
    if (!observerState || !opponentState) return { accepted: false, reason: 'no such session' };

    const effector = [observerState.king, ...observerState.assets].find(
      (a) => a.assetId === effectorAssetId
    );
    if (!effector) return { accepted: false, reason: `no such owned asset ${effectorAssetId}` };

    const target = [opponentState.king, ...opponentState.assets].find(
      (a) => a.assetId === targetAssetId
    );
    if (!target) return { accepted: false, reason: `no such opponent asset ${targetAssetId}` };

    const session = store.getSession(sessionId)!;
    const online = assertOnline(effector, session.turnNumber);
    if (!online.ok) return { accepted: false, reason: online.reason };

    const tm = turnManagerFor(sessionId);
    const spend = tm.spendAP(actingPlayer, ENGAGE_AP_COST);
    if (!spend.accepted) return spend;

    const result = effectResolver.resolveEngagement(
      observerState,
      effector,
      target,
      effect,
      beliefState,
      session.turnNumber,
      falseRegime
    );
    return { accepted: result.success, reason: result.reason };
  };
}
