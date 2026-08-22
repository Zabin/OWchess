/**
 * ConnectionRegistry (IP-7010) — maps PlayerId <-> live connection per session, tracks
 * disconnect/pending-decision state. Abstracted over `Connection` so the game logic in
 * websocketServer.ts is testable without a real socket (a real `ws` WebSocket satisfies this
 * interface trivially: send -> ws.send, onClose -> ws.on('close', ...), onMessage -> ws.on('message', ...)).
 */
export interface Connection {
  send(data: string): void;
  onMessage(cb: (data: string) => void): void;
  onClose(cb: () => void): void;
}

interface SessionConnections {
  connections: Map<string, Connection>; // playerId -> Connection
  /** Set while one player is disconnected and the other hasn't yet chosen wait/cancel. */
  pendingDisconnect: { disconnectedPlayerId: string } | null;
}

export class ConnectionRegistry {
  private sessions = new Map<string, SessionConnections>();

  private sessionFor(sessionId: string): SessionConnections {
    let s = this.sessions.get(sessionId);
    if (!s) {
      s = { connections: new Map(), pendingDisconnect: null };
      this.sessions.set(sessionId, s);
    }
    return s;
  }

  register(sessionId: string, playerId: string, conn: Connection): void {
    const s = this.sessionFor(sessionId);
    s.connections.set(playerId, conn);
    // A reconnect resolves any pending disconnect for this player.
    if (s.pendingDisconnect?.disconnectedPlayerId === playerId) {
      s.pendingDisconnect = null;
    }
  }

  get(sessionId: string, playerId: string): Connection | undefined {
    return this.sessions.get(sessionId)?.connections.get(playerId);
  }

  markDisconnected(sessionId: string, playerId: string): void {
    const s = this.sessionFor(sessionId);
    s.connections.delete(playerId);
    s.pendingDisconnect = { disconnectedPlayerId: playerId };
  }

  isPendingDisconnect(sessionId: string): boolean {
    return this.sessions.get(sessionId)?.pendingDisconnect != null;
  }
}
