/**
 * WebSocket transport (IP-7010) — ActionMessage ingestion, per-recipient StateDeltaMessage push
 * (routed through BeliefState.computeOpponentView, never a raw PlayerState), and the disconnect
 * notify/choice/reconnect sequence (FS-101 §W7: no grace period, notify-and-choose).
 *
 * Game logic here is decoupled from the actual WebSocket library via the `Connection` interface
 * (connectionRegistry.ts) so it's unit-testable without a real socket. A thin adapter wrapping a
 * real `ws` WebSocket into `Connection` — and an actual `WebSocketServer` bootstrap — is left to
 * whichever entry point first runs the server for real; this package's own scope is the message-
 * handling logic, not the process bootstrap (server/src/index.ts remains a scaffold placeholder).
 */
import type {
  ActionMessage,
  DisconnectResponse,
  RejectedActionMessage,
  StateDeltaMessage,
} from '@owchess/shared';
import type { PlayerId, SessionId } from '@owchess/shared';
import type { GameEngine } from '../engine/GameEngine.js';
import type { BeliefState } from '../engine/BeliefState.js';
import type { SessionStore } from '../engine/SessionStore.js';
import { ConnectionRegistry, type Connection } from './connectionRegistry.js';

export function createTransport(
  store: SessionStore,
  engine: GameEngine,
  beliefState: BeliefState
) {
  const registry = new ConnectionRegistry();

  /** Pushes each player their own independently-computed StateDeltaMessage (never shared). */
  function broadcastStateDelta(sessionId: SessionId): void {
    const session = store.getSession(sessionId);
    if (!session) return;
    for (const player of session.players) {
      const opponent = session.players.find((p) => p.playerId !== player.playerId)!;
      const message: StateDeltaMessage = {
        type: 'state-delta',
        ownState: player,
        opponentView: beliefState.computeOpponentView(
          player.playerId,
          player,
          opponent,
          session.turnNumber
        ),
        activeTurn: session.activeTurn,
      };
      registry.get(sessionId, player.playerId)?.send(JSON.stringify(message));
    }
  }

  function handleActionMessage(sessionId: SessionId, actingPlayer: PlayerId, msg: ActionMessage): void {
    const result = engine.handleAction(sessionId, actingPlayer, msg.action);
    if (result.accepted) {
      broadcastStateDelta(sessionId);
    } else {
      const rejection: RejectedActionMessage = {
        type: 'action-rejected',
        reason: result.reason ?? 'rejected',
      };
      registry.get(sessionId, actingPlayer)?.send(JSON.stringify(rejection));
    }
  }

  /** FS-101 §W7: no grace period — notify the still-connected player, hold the session open
   *  indefinitely awaiting their choice. No timer of any kind. */
  function handleDisconnect(sessionId: SessionId, disconnectedPlayerId: PlayerId): void {
    registry.markDisconnected(sessionId, disconnectedPlayerId);
    const session = store.getSession(sessionId);
    if (!session) return;
    const other = session.players.find((p) => p.playerId !== disconnectedPlayerId);
    if (other) {
      registry.get(sessionId, other.playerId)?.send(JSON.stringify({ type: 'disconnect-notification' }));
    }
    // No further action here — the session stays open indefinitely, per FS-101 §W7. Nothing
    // times out; the still-connected player's DisconnectResponse is the only thing that moves
    // this forward (handleDisconnectResponse below).
  }

  function handleDisconnectResponse(sessionId: SessionId, msg: DisconnectResponse): void {
    if (msg.choice === 'cancel') {
      const session = store.getSession(sessionId);
      if (session) {
        session.phase = 'ended'; // FR-7300: no winner recorded
        session.cancelled = true; // F2/BL-0045: distinguishes this from every other 'ended' outcome
      }
    }
    // 'wait': no state change — the session simply stays open for a future reconnect.
  }

  function handleConnection(
    sessionId: SessionId,
    playerId: PlayerId,
    conn: Connection
  ): void {
    registry.register(sessionId, playerId, conn);
    // Reconnect (or initial connect): push a full current state-delta immediately, the same
    // shape W1's initial render already knows how to consume — no special "resume" message.
    broadcastToOne(sessionId, playerId);

    conn.onMessage((raw) => {
      const msg = JSON.parse(raw) as ActionMessage | DisconnectResponse;
      if (msg.type === 'action') {
        handleActionMessage(sessionId, playerId, msg);
      } else if (msg.type === 'disconnect-response') {
        handleDisconnectResponse(sessionId, msg);
      }
    });

    conn.onClose(() => {
      handleDisconnect(sessionId, playerId);
    });
  }

  /** F1 (BL-0044/VR-7010): a reconnect presenting a sessionId that no longer exists must get an
   *  explicit rejection, never a silent drop (FS-107 §W4, NFR-7200). */
  function broadcastToOne(sessionId: SessionId, playerId: PlayerId): void {
    const session = store.getSession(sessionId);
    if (!session) {
      const rejection: RejectedActionMessage = {
        type: 'action-rejected',
        reason: 'session no longer exists',
      };
      registry.get(sessionId, playerId)?.send(JSON.stringify(rejection));
      return;
    }
    const player = session.players.find((p) => p.playerId === playerId);
    const opponent = session.players.find((p) => p.playerId !== playerId);
    if (!player || !opponent) return;
    const message: StateDeltaMessage = {
      type: 'state-delta',
      ownState: player,
      opponentView: beliefState.computeOpponentView(playerId, player, opponent, session.turnNumber),
      activeTurn: session.activeTurn,
    };
    registry.get(sessionId, playerId)?.send(JSON.stringify(message));
  }

  return { registry, handleConnection, handleActionMessage, handleDisconnect, handleDisconnectResponse, broadcastStateDelta };
}
