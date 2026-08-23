import { beforeEach, describe, expect, it } from 'vitest';
import { createGameEngine } from '../../engine/createGameEngine.js';
import { createTransport } from '../websocketServer.js';
import type { Connection } from '../connectionRegistry.js';

class FakeConnection implements Connection {
  sent: string[] = [];
  private messageCb: ((data: string) => void) | null = null;
  private closeCb: (() => void) | null = null;

  send(data: string): void {
    this.sent.push(data);
  }
  onMessage(cb: (data: string) => void): void {
    this.messageCb = cb;
  }
  onClose(cb: () => void): void {
    this.closeCb = cb;
  }
  simulateMessage(msg: unknown): void {
    this.messageCb?.(JSON.stringify(msg));
  }
  simulateClose(): void {
    this.closeCb?.();
  }
  lastMessage(): Record<string, unknown> {
    return JSON.parse(this.sent[this.sent.length - 1]);
  }
}

describe('Disconnect / reconnect flow (IP-7010, FS-101 §W7)', () => {
  let ctx: ReturnType<typeof createGameEngine>;
  let transport: ReturnType<typeof createTransport>;
  let sessionId: string;
  let aliceConn: FakeConnection;
  let bobConn: FakeConnection;

  beforeEach(() => {
    ctx = createGameEngine();
    transport = createTransport(ctx.store, ctx.engine, ctx.beliefState, ctx.registry);
    sessionId = ctx.store.createSession('alice');
    ctx.store.joinSession(sessionId, 'bob');
    ctx.store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    ctx.store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');

    aliceConn = new FakeConnection();
    bobConn = new FakeConnection();
    transport.handleConnection(sessionId, 'alice', aliceConn);
    transport.handleConnection(sessionId, 'bob', bobConn);
  });

  it('notifies the still-connected player when the other disconnects', () => {
    aliceConn.simulateClose();
    expect(bobConn.lastMessage().type).toBe('disconnect-notification');
  });

  it('holds the session open indefinitely on disconnect — no timeout ever fires', () => {
    aliceConn.simulateClose();
    const session = ctx.store.getSession(sessionId)!;
    expect(session.phase).toBe('active'); // unchanged — no automatic forfeit/timeout
    expect(transport.registry.isPendingDisconnect(sessionId)).toBe(true);
  });

  it('"cancel" ends the session with no winner recorded (FR-7300)', () => {
    aliceConn.simulateClose();
    bobConn.simulateMessage({ type: 'disconnect-response', choice: 'cancel' });
    const session = ctx.store.getSession(sessionId)!;
    expect(session.phase).toBe('ended');
    // No win-condition result should report a winner from this path.
    const result = ctx.engine.checkWinConditions(sessionId);
    expect(result?.winner ?? null).toBeNull();
  });

  it('F2/BL-0045: "cancel" is distinguishable as its own outcome, not a timeout-tiebreak (VR-7010\'s past-timeout-cap scenario)', () => {
    // Push turnNumber past the 60-turn timeout cap before cancelling — VR-7010's exact
    // hand-reproduced consequence: without a distinct cancellation marker, checkWinConditions
    // falls through to the timeout/tiebreak branch instead.
    const session = ctx.store.getSession(sessionId)!;
    session.turnNumber = 61;

    aliceConn.simulateClose();
    bobConn.simulateMessage({ type: 'disconnect-response', choice: 'cancel' });

    expect(session.phase).toBe('ended');
    expect(session.cancelled).toBe(true);
    const result = ctx.engine.checkWinConditions(sessionId);
    expect(result).toEqual({ winner: null, reason: 'cancelled' });
  });

  it('"wait" keeps the session open with no state change', () => {
    aliceConn.simulateClose();
    bobConn.simulateMessage({ type: 'disconnect-response', choice: 'wait' });
    const session = ctx.store.getSession(sessionId)!;
    expect(session.phase).toBe('active');
  });

  it('reconnect re-associates the socket and delivers a full state-delta', () => {
    aliceConn.simulateClose();
    const newAliceConn = new FakeConnection();
    transport.handleConnection(sessionId, 'alice', newAliceConn);

    // BL-0048: every connection (including a reconnect) also gets the static template catalog.
    expect(newAliceConn.sent).toHaveLength(2);
    expect(newAliceConn.lastMessage().type).toBe('state-delta');
    expect(transport.registry.isPendingDisconnect(sessionId)).toBe(false);
  });
});
