/**
 * Task action wiring (IP-2010) — fills GameEngine's 'task' handler slot (stubbed by IP-1010),
 * and wires BeliefState.decayStaleEntries into the turn-advance loop.
 */
import type { ActionResult, OrbitalRegimeLabel, PlayerId, SessionId, TemplateId } from '@owchess/shared';
import type { SessionStore } from './SessionStore.js';
import type { TurnManager } from './TurnManager.js';
import { BeliefState } from './BeliefState.js';
import { assertOnline } from './deployAction.js';

export function makeTaskHandler(
  store: SessionStore,
  turnManagerFor: (sessionId: SessionId) => TurnManager,
  beliefState: BeliefState,
  taskApCost: number
) {
  return function taskAsset(
    sessionId: SessionId,
    actingPlayer: PlayerId,
    action: { type: string; payload: Record<string, unknown> }
  ): ActionResult {
    const sourceAssetId = action.payload.sourceAssetId as TemplateId;
    const targetRegime = action.payload.targetRegime as OrbitalRegimeLabel;

    const observerState = store.getPlayerState(sessionId, actingPlayer);
    const opponentState = store.getOpponentState(sessionId, actingPlayer);
    if (!observerState || !opponentState) return { accepted: false, reason: 'no such session' };

    const source = [observerState.king, ...observerState.assets].find(
      (a) => a.assetId === sourceAssetId
    );
    if (!source) return { accepted: false, reason: `no such owned asset ${sourceAssetId}` };

    const session = store.getSession(sessionId)!;
    const online = assertOnline(source, session.turnNumber);
    if (!online.ok) return { accepted: false, reason: online.reason };

    const tm = turnManagerFor(sessionId);
    const spend = tm.spendAP(actingPlayer, taskApCost);
    if (!spend.accepted) return spend;

    beliefState.applyTasking(
      actingPlayer,
      observerState,
      source,
      targetRegime,
      opponentState,
      session.turnNumber
    );
    return { accepted: true };
  };
}

/** Registers per-turn-advance decay for both players' belief-of-opponent maps. */
export function registerBeliefDecay(
  store: SessionStore,
  turnManagerFor: (sessionId: SessionId) => TurnManager,
  sessionId: SessionId,
  beliefState: BeliefState
): void {
  const tm = turnManagerFor(sessionId);
  tm.registerTurnEndHook(() => {
    const session = store.getSession(sessionId);
    if (!session) return;
    for (const player of session.players) {
      beliefState.decayStaleEntries(player, session.turnNumber);
    }
  });
}
