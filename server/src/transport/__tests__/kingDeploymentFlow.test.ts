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
  lastMessage(): Record<string, unknown> {
    return JSON.parse(this.sent[this.sent.length - 1]);
  }
  messagesOfType(type: string): Record<string, unknown>[] {
    return this.sent.map((s) => JSON.parse(s)).filter((m) => m.type === type);
  }
}

describe('King-deployment wire flow (IP-9056, closes BL-0056)', () => {
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

    aliceConn = new FakeConnection();
    bobConn = new FakeConnection();
    transport.handleConnection(sessionId, 'alice', aliceConn);
    transport.handleConnection(sessionId, 'bob', bobConn);
  });

  it('connecting to a joined-but-undeployed session receives deployment-status, never a rejection', () => {
    expect(aliceConn.lastMessage().type).toBe('deployment-status');
    expect(aliceConn.lastMessage()).toMatchObject({ phase: 'deploying', ownDeployed: false, opponentDeployed: false });
    expect(aliceConn.messagesOfType('action-rejected')).toHaveLength(0);
  });

  it('one player deploying updates both players\' status without leaking the selection', () => {
    aliceConn.simulateMessage({ type: 'deploy-king', sessionId, missionSetId: 'satcom', regime: 'GEO-EQUATORIAL' });

    expect(aliceConn.lastMessage()).toMatchObject({ type: 'deployment-status', phase: 'deploying', ownDeployed: true, opponentDeployed: false });
    expect(bobConn.lastMessage()).toMatchObject({ type: 'deployment-status', phase: 'deploying', ownDeployed: false, opponentDeployed: true });
    // Never reveals what alice picked — check specifically the deployment-status messages (the
    // template-catalog message legitimately mentions "missionSetId" as part of the public,
    // both-players-identical mission-set catalog, which is not a leak of alice's own selection).
    for (const status of [...aliceConn.messagesOfType('deployment-status'), ...bobConn.messagesOfType('deployment-status')]) {
      expect(JSON.stringify(status)).not.toContain('missionSetId');
      expect(JSON.stringify(status)).not.toContain('regime');
    }
  });

  it('the second player deploying transitions both to a real state-delta', () => {
    aliceConn.simulateMessage({ type: 'deploy-king', sessionId, missionSetId: 'satcom', regime: 'GEO-EQUATORIAL' });
    bobConn.simulateMessage({ type: 'deploy-king', sessionId, missionSetId: 'isr', regime: 'LEO-POLAR' });

    expect(aliceConn.lastMessage().type).toBe('state-delta');
    expect(bobConn.lastMessage().type).toBe('state-delta');
    expect(ctx.store.getSession(sessionId)?.phase).toBe('active');
  });

  it('deploying twice as the same player is rejected (FR-1230, King immutability)', () => {
    aliceConn.simulateMessage({ type: 'deploy-king', sessionId, missionSetId: 'satcom', regime: 'GEO-EQUATORIAL' });
    bobConn.simulateMessage({ type: 'deploy-king', sessionId, missionSetId: 'isr', regime: 'LEO-POLAR' });
    aliceConn.simulateMessage({ type: 'deploy-king', sessionId, missionSetId: 'pnt-lite', regime: 'MEO-EQUATORIAL' });

    expect(aliceConn.lastMessage().type).toBe('action-rejected');
    expect(aliceConn.lastMessage().reason).toBe('King already deployed (FR-1230)');
  });
});
