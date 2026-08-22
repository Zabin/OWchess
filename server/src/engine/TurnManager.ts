/**
 * TurnManager (IP-1010) — implements GDS-09's TurnManager contract, one instance per session.
 * The ONLY place out-of-turn rejection happens (FR-1009/FR-1330).
 */
import type { Action, PlayerId, PlayerState, SessionId, TurnManager as ITurnManager } from '@owchess/shared';
import type { SessionStore } from './SessionStore.js';

const STARTING_AP = 5;

/** A hook run against the ending player's state, once per turn-advance, before the switch. */
export type TurnEndHook = (endingPlayer: PlayerState) => void;

export class TurnManager implements ITurnManager {
  private turnEndHooks: TurnEndHook[] = [];

  constructor(
    private readonly store: SessionStore,
    private readonly sessionId: SessionId
  ) {}

  /**
   * IP-3010 registers deploy-state ticking here (mirrors OQ-11's "owner's own turns" convention);
   * later packages (Propagator maneuver ticks, BeliefState decay, EffectResolver ticks) register
   * their own turn-scoped work the same way rather than TurnManager importing their modules.
   */
  registerTurnEndHook(hook: TurnEndHook): void {
    this.turnEndHooks.push(hook);
  }

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
    const ending = session.activeTurn === a.playerId ? a : b;
    const next = ending === a ? b : a;
    for (const hook of this.turnEndHooks) hook(ending);
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
