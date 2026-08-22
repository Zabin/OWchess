import { describe, expect, it } from 'vitest';
import { SessionStore } from '../SessionStore.js';

describe('SessionStore', () => {
  it('rejects a third join attempt once both slots are filled (FR-1121)', () => {
    const store = new SessionStore();
    const sessionId = store.createSession('alice');
    store.joinSession(sessionId, 'bob');
    const result = store.joinSession(sessionId, 'carol');
    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/two players/);
  });

  it('withholds King deployment until both slots are filled (FR-1130)', () => {
    const store = new SessionStore();
    const sessionId = store.createSession('alice');
    const result = store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/not yet full/);
    expect(store.getSession(sessionId)).toBeUndefined(); // still in 'deploying', no session object yet
  });

  it('rejects re-deployment once a King is already placed (FR-1230)', () => {
    const store = new SessionStore();
    const sessionId = store.createSession('alice');
    store.joinSession(sessionId, 'bob');
    store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');
    const result = store.submitKingDeployment(sessionId, 'alice', 'pnt-lite', 'MEO-EQUATORIAL');
    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/already deployed/);
  });

  it('resolves both Kings simultaneously with no observable gap (FR-1220)', () => {
    const store = new SessionStore();
    const sessionId = store.createSession('alice');
    store.joinSession(sessionId, 'bob');
    store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    expect(store.getSession(sessionId)).toBeUndefined(); // only one submitted so far
    store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');
    const session = store.getSession(sessionId)!;
    expect(session.phase).toBe('active');
    expect(session.players[0].king).toBeDefined();
    expect(session.players[1].king).toBeDefined();
  });
});
