import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '../SessionStore.js';
import { GameEngine } from '../GameEngine.js';

describe('GameEngine.checkWinConditions', () => {
  let store: SessionStore;
  let engine: GameEngine;
  let sessionId: string;

  beforeEach(() => {
    store = new SessionStore();
    engine = new GameEngine(store);
    sessionId = store.createSession('alice');
    store.joinSession(sessionId, 'bob');
    store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');
  });

  it('declares the opponent winner on King destruction (FR-1405)', () => {
    const session = store.getSession(sessionId)!;
    session.players[0].king.destroyed = true; // alice's King destroyed
    const result = engine.checkWinConditions(sessionId);
    expect(result).toEqual({ winner: 'bob', reason: 'destruction' });
  });

  it('declares the opponent winner on a 6-turn denial streak (FR-4005)', () => {
    const session = store.getSession(sessionId)!;
    session.players[1].king.consecutiveDenialTurns = 6; // bob's King denied
    const result = engine.checkWinConditions(sessionId);
    expect(result).toEqual({ winner: 'alice', reason: 'denial' });
  });

  it('declares the resigning player\'s opponent winner (FR-1410)', () => {
    engine.handleAction(sessionId, 'alice', { type: 'resign', payload: {} });
    const result = engine.checkWinConditions(sessionId);
    expect(result).toEqual({ winner: 'bob', reason: 'resignation' });
  });

  it('resolves timeout via the denial-turns tiebreak at turn 61 (FR-1420)', () => {
    const session = store.getSession(sessionId)!;
    session.turnNumber = 61;
    session.players[0].king.totalDenialTurns = 10; // alice's King denied more -> bob wins
    const result = engine.checkWinConditions(sessionId);
    expect(result).toEqual({ winner: 'bob', reason: 'timeout-tiebreak' });
  });

  it('resolves an exact-equal timeout as a draw (FR-1420)', () => {
    const session = store.getSession(sessionId)!;
    session.turnNumber = 61;
    const result = engine.checkWinConditions(sessionId);
    expect(result).toEqual({ winner: null, reason: 'timeout-tiebreak' });
  });

  it('BL-0012: destruction takes precedence when both destruction and timeout could fire', () => {
    const session = store.getSession(sessionId)!;
    session.turnNumber = 61;
    session.players[0].king.destroyed = true;
    const result = engine.checkWinConditions(sessionId);
    expect(result).toEqual({ winner: 'bob', reason: 'destruction' });
  });

  it('returns null before any win condition fires', () => {
    expect(engine.checkWinConditions(sessionId)).toBeNull();
  });
});
