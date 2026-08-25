/**
 * Session HTTP API (IP-9038) — the previously-unowned "produce a shareable join link" surface
 * FS-101 W1 assumed but no package ever built (BL-0055). Pure functions over a SessionStore,
 * testable without a real http.Server.
 */
import { randomBytes } from 'node:crypto';
import type { PlayerId } from '@owchess/shared';
import type { SessionStore } from '../engine/SessionStore.js';

export interface HttpResult {
  status: number;
  body: Record<string, unknown>;
}

/** Not a security boundary (unlike SessionStore's own NFR-3200 session-ID entropy) — just enough
 *  randomness that two browser tabs/players never collide. */
function generatePlayerId(): PlayerId {
  return `player-${randomBytes(8).toString('base64url')}`;
}

export function handleCreateSession(store: SessionStore): HttpResult {
  const playerId = generatePlayerId();
  const sessionId = store.createSession(playerId);
  return { status: 201, body: { sessionId, playerId } };
}

export function handleJoinSession(store: SessionStore, sessionId: string): HttpResult {
  const playerId = generatePlayerId();
  const result = store.joinSession(sessionId, playerId);
  if (!result.accepted) {
    const status = result.reason === 'no such session' ? 404 : 409;
    return { status, body: { reason: result.reason } };
  }
  return { status: 200, body: { playerId } };
}
