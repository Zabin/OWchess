import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '../SessionStore.js';
import { TurnManager } from '../TurnManager.js';

describe('TurnManager', () => {
  let store: SessionStore;
  let sessionId: string;

  beforeEach(() => {
    store = new SessionStore();
    sessionId = store.createSession('alice');
    store.joinSession(sessionId, 'bob');
    store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');
  });

  it('grants the active player exactly 5 AP with no carryover (FR-1310)', () => {
    const tm = new TurnManager(store, sessionId);
    expect(tm.activePlayer()).toBe('alice');
    expect(tm.apRemaining()).toBe(5);
    tm.spendAP('alice', 3);
    expect(tm.apRemaining()).toBe(2);
    tm.advanceTurn();
    expect(tm.activePlayer()).toBe('bob');
    expect(tm.apRemaining()).toBe(5); // fresh grant, no carryover from alice's spend
  });

  it('rejects an out-of-turn action (FR-1330)', () => {
    const tm = new TurnManager(store, sessionId);
    const result = tm.submitAction('bob', { type: 'pass', payload: {} });
    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/not your turn/);
  });

  it('auto-advances the turn on AP exhaustion (FR-1350)', () => {
    const tm = new TurnManager(store, sessionId);
    tm.spendAP('alice', 5);
    expect(tm.activePlayer()).toBe('bob');
  });

  it('alternates turns and increments turnNumber on pass (FR-1340)', () => {
    const tm = new TurnManager(store, sessionId);
    tm.advanceTurn();
    expect(tm.activePlayer()).toBe('bob');
    tm.advanceTurn();
    expect(tm.activePlayer()).toBe('alice');
    const session = store.getSession(sessionId)!;
    expect(session.turnNumber).toBe(3);
  });
});
