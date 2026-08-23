import { describe, expect, it } from 'vitest';
import { SessionStore } from '../../engine/SessionStore.js';
import { handleCreateSession, handleJoinSession } from '../sessionApi.js';

describe('Session HTTP API (IP-9038, closes BL-0055)', () => {
  it('create returns a valid sessionId and playerId', () => {
    const store = new SessionStore();
    const result = handleCreateSession(store);
    expect(result.status).toBe(201);
    expect(typeof result.body.sessionId).toBe('string');
    expect(typeof result.body.playerId).toBe('string');
  });

  it('join succeeds for a fresh session with an open slot', () => {
    const store = new SessionStore();
    const { body: created } = handleCreateSession(store);
    const result = handleJoinSession(store, created.sessionId as string);
    expect(result.status).toBe(200);
    expect(typeof result.body.playerId).toBe('string');
    expect(result.body.playerId).not.toBe(created.playerId);
  });

  it('join fails with 404 for a nonexistent session', () => {
    const store = new SessionStore();
    const result = handleJoinSession(store, 'no-such-session');
    expect(result.status).toBe(404);
    expect(result.body.reason).toBe('no such session');
  });

  it('join fails with 409 once both slots are filled', () => {
    const store = new SessionStore();
    const { body: created } = handleCreateSession(store);
    handleJoinSession(store, created.sessionId as string);
    const result = handleJoinSession(store, created.sessionId as string);
    expect(result.status).toBe(409);
    expect(result.body.reason).toBe('session already has two players');
  });
});
