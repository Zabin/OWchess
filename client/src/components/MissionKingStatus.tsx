/**
 * MissionKingStatus (IP-8010) — turn/AP/King status panel. apRemaining is visible and updates
 * immediately on each AP-spending action (FR-7004, since ownState is re-rendered from the
 * server's own StateDeltaMessage after every resolved action).
 */
import type { PlayerId, PlayerState } from '@owchess/shared';

export interface MissionKingStatusProps {
  ownState: PlayerState;
  activeTurn: PlayerId;
}

export function MissionKingStatus({ ownState, activeTurn }: MissionKingStatusProps) {
  const isMyTurn = activeTurn === ownState.playerId;
  return (
    <div className="mission-king-status" data-testid="mission-king-status">
      <div data-testid="turn-indicator">{isMyTurn ? 'Your turn' : "Opponent's turn"}</div>
      <div data-testid="ap-remaining">AP: {ownState.apRemaining}</div>
      <div data-testid="king-status">
        King — {ownState.king.trueRegime} ({ownState.king.missionSet})
        {ownState.king.consecutiveDenialTurns > 0
          ? ` — denied ${ownState.king.consecutiveDenialTurns} consecutive turn(s)`
          : ''}
        {ownState.king.destroyed ? ' — DESTROYED' : ''}
      </div>
    </div>
  );
}
