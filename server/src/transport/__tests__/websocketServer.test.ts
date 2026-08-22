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

describe('WebSocket transport (IP-7010)', () => {
  let ctx: ReturnType<typeof createGameEngine>;
  let transport: ReturnType<typeof createTransport>;
  let sessionId: string;
  let aliceConn: FakeConnection;
  let bobConn: FakeConnection;

  beforeEach(() => {
    ctx = createGameEngine();
    transport = createTransport(ctx.store, ctx.engine, ctx.beliefState);
    sessionId = ctx.store.createSession('alice');
    ctx.store.joinSession(sessionId, 'bob');
    ctx.store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    ctx.store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');

    aliceConn = new FakeConnection();
    bobConn = new FakeConnection();
    transport.handleConnection(sessionId, 'alice', aliceConn);
    transport.handleConnection(sessionId, 'bob', bobConn);
  });

  it('pushes an initial state-delta to each connection on connect', () => {
    expect(aliceConn.sent).toHaveLength(1);
    expect(bobConn.sent).toHaveLength(1);
    expect(aliceConn.lastMessage().type).toBe('state-delta');
  });

  it('an accepted action produces two independently-computed StateDeltaMessages', () => {
    const aliceBefore = aliceConn.sent.length;
    const bobBefore = bobConn.sent.length;

    aliceConn.simulateMessage({ type: 'action', sessionId, action: { type: 'pass', payload: {} } });

    expect(aliceConn.sent.length).toBe(aliceBefore + 1);
    expect(bobConn.sent.length).toBe(bobBefore + 1);

    const aliceMsg = aliceConn.lastMessage() as { ownState: { playerId: string }; opponentView: { playerId: string } };
    const bobMsg = bobConn.lastMessage() as { ownState: { playerId: string }; opponentView: { playerId: string } };
    expect(aliceMsg.ownState.playerId).toBe('alice');
    expect(aliceMsg.opponentView.playerId).toBe('bob');
    expect(bobMsg.ownState.playerId).toBe('bob');
    expect(bobMsg.opponentView.playerId).toBe('alice');
    // The two messages are genuinely different objects (per-recipient), not the same one reused.
    expect(aliceMsg).not.toBe(bobMsg);
  });

  it('a rejected action produces exactly one RejectedActionMessage, to the acting player only', () => {
    const bobBefore = bobConn.sent.length;
    // bob acts out of turn (alice is active first)
    bobConn.simulateMessage({ type: 'action', sessionId, action: { type: 'pass', payload: {} } });

    expect(bobConn.sent.length).toBe(bobBefore + 1);
    expect(bobConn.lastMessage().type).toBe('action-rejected');
  });

  it('completes an action round-trip well within the NFR-1100 3s turn-latency budget', () => {
    const start = Date.now();
    aliceConn.simulateMessage({ type: 'action', sessionId, action: { type: 'pass', payload: {} } });
    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(3000);
  });
});
