/**
 * TurnManager (IP-1010) — implements GDS-09's TurnManager contract, one instance per session.
 * The ONLY place out-of-turn rejection happens (FR-1009/FR-1330).
 */
import type { Action, PlayerId, SessionId, TurnManager as ITurnManager } from '@owchess/shared';
import type { SessionStore } from './SessionStore.js';

const STARTING_AP = 5;

export class TurnManager implements ITurnManager {
  constructor(
    private readonly store: SessionStore,
    private readonly sessionId: SessionId
  ) {}

  activePlayer(): PlayerId {
    const session = this.mustGetSession();
    return session.activeTurn;
  }

  apRemaining(): number {
    const session = this.mustGetSession();
    const active = session.players.find((p) => p.playerId === session.activeTurn)!;
    return active.apRemaining;
  }

  /** FR-1330: rejects any call where actingPlayer !== activePlayer(). */
  submitAction(actingPlayer: PlayerId, _action: Action): { accepted: boolean; reason?: string } {
    const session = this.mustGetSession();
    if (actingPlayer !== session.activeTurn) {
      return { accepted: false, reason: 'not your turn (FR-1330)' };
    }
    return { accepted: true };
  }

  /** Deducts AP for an accepted action; auto-advances the turn at exhaustion (FR-1350). */
  spendAP(actingPlayer: PlayerId, cost: number): { accepted: boolean; reason?: string } {
    const session = this.mustGetSession();
    const player = session.players.find((p) => p.playerId === actingPlayer)!;
    if (player.apRemaining < cost) {
      return { accepted: false, reason: 'insufficient AP' };
    }
    player.apRemaining -= cost;
    if (player.apRemaining === 0) {
      this.advanceTurn();
    }
    return { accepted: true };
  }

  /** FR-1340/FR-1310: advances the turn; the new active player gets a fresh 5 AP, no carryover. */
  advanceTurn(): void {
    const session = this.mustGetSession();
    const [a, b] = session.players;
    const next = session.activeTurn === a.playerId ? b : a;
    next.apRemaining = STARTING_AP;
    session.activeTurn = next.playerId;
    session.turnNumber += 1;
  }

  private mustGetSession() {
    const session = this.store.getSession(this.sessionId);
    if (!session) throw new Error(`no active session ${this.sessionId}`);
    return session;
  }
}
