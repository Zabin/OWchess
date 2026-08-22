/**
 * Deploy action + pre-online blocking (IP-3010). Fills GameEngine's 'deploy' handler slot
 * (stubbed by IP-1010).
 */
import type { Asset, PlayerId, SessionId, TemplateId, OrbitalRegimeLabel, ActionResult } from '@owchess/shared';
import type { SessionStore } from './SessionStore.js';
import type { TurnManager } from './TurnManager.js';
import type { TemplateRegistry } from './TemplateRegistry.js';

let nextAssetSuffix = 1;

/** FR-3500: any action targeting an asset not yet online is rejected. */
export function assertOnline(asset: Asset, _currentTurn: number): { ok: boolean; reason?: string } {
  if (asset.deployState !== null) {
    return { ok: false, reason: 'asset is not yet online' };
  }
  return { ok: true };
}

export function makeDeployHandler(
  store: SessionStore,
  turnManagerFor: (sessionId: SessionId) => TurnManager,
  registry: TemplateRegistry
) {
  return function deployAsset(
    sessionId: SessionId,
    actingPlayer: PlayerId,
    action: { type: string; payload: Record<string, unknown> }
  ): ActionResult {
    const templateId = action.payload.templateId as TemplateId;
    const targetRegime = action.payload.targetRegime as OrbitalRegimeLabel;
    const template = registry.getAssetTemplate(templateId);
    if (!template) return { accepted: false, reason: `unknown template ${templateId}` };

    const tm = turnManagerFor(sessionId);
    const player = store.getPlayerState(sessionId, actingPlayer);
    if (!player) return { accepted: false, reason: 'no such player in session' };

    // No per-template cap (BL-0013) — AP scarcity is the only brake.
    const spend = tm.spendAP(actingPlayer, template.apCost);
    if (!spend.accepted) return spend;

    const asset: Asset = {
      assetId: `${actingPlayer}-asset-${nextAssetSuffix++}`,
      ownerId: actingPlayer,
      templateId,
      basing: template.basing,
      chainRoles: template.chainRoles,
      trueRegime: targetRegime,
      maneuverState: null,
      deployState: template.timeToOnline > 0 ? { turnsUntilOnline: template.timeToOnline } : null,
      activeEffects: [],
      isKing: false,
      missionSet: null,
      consecutiveDenialTurns: 0,
      totalDenialTurns: 0,
      destroyed: false,
    };
    player.assets.push(asset);
    return { accepted: true };
  };
}

/**
 * Decrements every deploying asset's turnsUntilOnline by one owner-turn (mirrors OQ-11's
 * "counted in the owner's own turns" convention already used for maneuvers). Called once per
 * turn-advance, for the player whose turn just ended.
 */
export function tickDeployStates(assets: Asset[]): void {
  for (const asset of assets) {
    if (asset.deployState !== null) {
      asset.deployState.turnsUntilOnline -= 1;
      if (asset.deployState.turnsUntilOnline <= 0) {
        asset.deployState = null;
      }
    }
  }
}
