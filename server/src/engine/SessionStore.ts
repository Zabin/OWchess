/**
 * In-memory SessionState/PlayerState storage (IP-1010). No database in v1 (NFR-6100).
 */
import { randomBytes } from 'node:crypto';
import type {
  Asset,
  MissionSetId,
  OrbitalRegimeLabel,
  PlayerId,
  PlayerState,
  SessionId,
  SessionState,
} from '@owchess/shared';

const STARTING_AP = 5;

function newKingAsset(ownerId: PlayerId, missionSet: MissionSetId, regime: OrbitalRegimeLabel): Asset {
  return {
    assetId: `${ownerId}-king`,
    ownerId,
    templateId: missionSet,
    basing: 'space',
    chainRoles: [],
    trueRegime: regime,
    maneuverState: null,
    deployState: null,
    activeEffects: [],
    isKing: true,
    missionSet,
    consecutiveDenialTurns: 0,
    totalDenialTurns: 0,
    destroyed: false,
  };
}

function newPlayerState(playerId: PlayerId, king: Asset): PlayerState {
  return {
    playerId,
    king,
    assets: [],
    apRemaining: STARTING_AP,
    beliefOfOpponent: new Map(),
  };
}

interface PendingKingSelection {
  missionSet: MissionSetId;
  regime: OrbitalRegimeLabel;
}

/** One session's full mutable record, including pre-deployment bookkeeping. */
class SessionRecord {
  session: SessionState | null = null;
  playerIds: PlayerId[] = [];
  pendingKingSelections = new Map<PlayerId, PendingKingSelection>();

  constructor(public readonly sessionId: SessionId) {}
}

/**
 * NFR-3200: session IDs must be computationally infeasible to guess (>=122 bits of entropy).
 * 16 random bytes = 128 bits, base64url-encoded (no padding) -> a 22-character unguessable token.
 */
function generateSessionId(): SessionId {
  return `session-${randomBytes(16).toString('base64url')}`;
}

export class SessionStore {
  private sessions = new Map<SessionId, SessionRecord>();

  /** FR-1110: create a session, returning its join-able ID. */
  createSession(creatorId: PlayerId): SessionId {
    const sessionId = generateSessionId();
    const record = new SessionRecord(sessionId);
    record.playerIds.push(creatorId);
    this.sessions.set(sessionId, record);
    return sessionId;
  }

  /** FR-1120/FR-1121: join an existing session; rejects once both slots are filled. */
  joinSession(sessionId: SessionId, joinerId: PlayerId): { accepted: boolean; reason?: string } {
    const record = this.sessions.get(sessionId);
    if (!record) return { accepted: false, reason: 'no such session' };
    if (record.playerIds.length >= 2) {
      return { accepted: false, reason: 'session already has two players' };
    }
    if (record.playerIds.includes(joinerId)) {
      return { accepted: false, reason: 'already joined' };
    }
    record.playerIds.push(joinerId);
    return { accepted: true };
  }

  /**
   * FR-1210/FR-1220: secret, simultaneous King deployment. Neither selection is visible to the
   * opponent until both have submitted; the second submission resolves both simultaneously.
   */
  submitKingDeployment(
    sessionId: SessionId,
    playerId: PlayerId,
    missionSet: MissionSetId,
    regime: OrbitalRegimeLabel
  ): { accepted: boolean; reason?: string } {
    const record = this.sessions.get(sessionId);
    if (!record) return { accepted: false, reason: 'no such session' };
    if (record.playerIds.length < 2) {
      return { accepted: false, reason: 'session not yet full (FR-1130)' };
    }
    if (!record.playerIds.includes(playerId)) {
      return { accepted: false, reason: 'not a player in this session' };
    }
    if (record.session) {
      return { accepted: false, reason: 'King already deployed (FR-1230)' };
    }
    record.pendingKingSelections.set(playerId, { missionSet, regime });

    if (record.pendingKingSelections.size === 2) {
      const [firstId, secondId] = record.playerIds;
      const firstSel = record.pendingKingSelections.get(firstId)!;
      const secondSel = record.pendingKingSelections.get(secondId)!;
      const players: [PlayerState, PlayerState] = [
        newPlayerState(firstId, newKingAsset(firstId, firstSel.missionSet, firstSel.regime)),
        newPlayerState(secondId, newKingAsset(secondId, secondSel.missionSet, secondSel.regime)),
      ];
      record.session = {
        sessionId,
        players,
        activeTurn: firstId,
        turnNumber: 1,
        eventLog: [],
        phase: 'active',
      };
    }
    return { accepted: true };
  }

  getSession(sessionId: SessionId): SessionState | undefined {
    return this.sessions.get(sessionId)?.session ?? undefined;
  }

  getPlayerState(sessionId: SessionId, playerId: PlayerId): PlayerState | undefined {
    return this.getSession(sessionId)?.players.find((p) => p.playerId === playerId);
  }

  getOpponentState(sessionId: SessionId, playerId: PlayerId): PlayerState | undefined {
    return this.getSession(sessionId)?.players.find((p) => p.playerId !== playerId);
  }
}
