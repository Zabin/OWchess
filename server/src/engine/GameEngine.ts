/**
 * GameEngine (IP-1010) — session lifecycle, turn-loop orchestration, and win-condition checks.
 * The action-body dispatch for deploy/maneuver/task/engage is stubbed here (optional, injected
 * handlers) until IP-3010/2010/4010/5010 land — this package owns the shell, not those bodies.
 */
import type {
  Action,
  ActionResult,
  GameEngine as IGameEngine,
  PlayerId,
  SessionId,
  WinResult,
} from '@owchess/shared';
import type { SessionStore } from './SessionStore.js';
import { TurnManager } from './TurnManager.js';

const TIMEOUT_TURN_CAP = 60;
const DENIAL_STREAK_THRESHOLD = 6;

export type ActionHandler = (
  sessionId: SessionId,
  actingPlayer: PlayerId,
  action: Action
) => ActionResult;

export class GameEngine implements IGameEngine {
  private turnManagers = new Map<SessionId, TurnManager>();
  /** Injected by later packages (IP-3010/2010/4010/5010) once their modules exist. */
  private handlers = new Map<'deploy' | 'maneuver' | 'task' | 'engage', ActionHandler>();
  /** FR-1410: which player resigned, per session — resignation is immediate/terminal. */
  private resignedBy = new Map<SessionId, PlayerId>();

  constructor(private readonly store: SessionStore) {}

  registerHandler(type: 'deploy' | 'maneuver' | 'task' | 'engage', handler: ActionHandler): void {
    this.handlers.set(type, handler);
  }

  private turnManagerFor(sessionId: SessionId): TurnManager {
    let tm = this.turnManagers.get(sessionId);
    if (!tm) {
      tm = new TurnManager(this.store, sessionId);
      this.turnManagers.set(sessionId, tm);
    }
    return tm;
  }

  handleAction(sessionId: SessionId, actingPlayer: PlayerId, action: Action): ActionResult {
    const session = this.store.getSession(sessionId);
    if (!session) return { accepted: false, reason: 'no such active session' };
    if (session.phase !== 'active') {
      return { accepted: false, reason: `session is ${session.phase}, not active` };
    }

    const tm = this.turnManagerFor(sessionId);

    // Resign is the one action type legal regardless of turn (FR-1410).
    if (action.type === 'resign') {
      session.phase = 'ended';
      this.resignedBy.set(sessionId, actingPlayer);
      return { accepted: true };
    }

    const turnCheck = tm.submitAction(actingPlayer, action);
    if (!turnCheck.accepted) return turnCheck;

    if (action.type === 'pass') {
      tm.advanceTurn();
      return { accepted: true };
    }

    const handler = this.handlers.get(action.type as 'deploy' | 'maneuver' | 'task' | 'engage');
    if (!handler) {
      return { accepted: false, reason: `no handler registered for action type '${action.type}'` };
    }
    return handler(sessionId, actingPlayer, action);
  }

  /**
   * BL-0012: destruction is checked (and returned) before timeout/tiebreak, when both could fire
   * in the same check.
   */
  checkWinConditions(sessionId: SessionId): WinResult | null {
    const session = this.store.getSession(sessionId);
    if (!session) return null;
    const [a, b] = session.players;

    // -1. Cancellation (F2/BL-0045, FS-101 §W7) — terminal and unconditional; a cancelled session
    //     must never be re-derived as a resignation/destruction/denial/timeout result.
    if (session.cancelled) {
      return { winner: null, reason: 'cancelled' };
    }

    // 0. Resignation (FR-1410) — immediate/terminal, takes precedence over everything else.
    const resigner = this.resignedBy.get(sessionId);
    if (resigner) {
      const winner = resigner === a.playerId ? b.playerId : a.playerId;
      return { winner, reason: 'resignation' };
    }

    // 1. Destruction (FR-1405) — checked first among the remaining conditions (BL-0012).
    if (a.king.destroyed) return { winner: b.playerId, reason: 'destruction' };
    if (b.king.destroyed) return { winner: a.playerId, reason: 'destruction' };

    // 2. Mission denial (FR-4005/FR-1420's tuning table: 6 consecutive turns).
    if (a.king.consecutiveDenialTurns >= DENIAL_STREAK_THRESHOLD) {
      return { winner: b.playerId, reason: 'denial' };
    }
    if (b.king.consecutiveDenialTurns >= DENIAL_STREAK_THRESHOLD) {
      return { winner: a.playerId, reason: 'denial' };
    }

    // 3. Resignation is handled directly in handleAction (phase flips to 'ended' immediately);
    //    not re-derived here.

    // 4. Timeout/tiebreak (FR-1420): 60 total elapsed turns, tiebreak by cumulative denial-turns.
    if (session.turnNumber > TIMEOUT_TURN_CAP) {
      if (a.king.totalDenialTurns > b.king.totalDenialTurns) {
        return { winner: b.playerId, reason: 'timeout-tiebreak' };
      }
      if (b.king.totalDenialTurns > a.king.totalDenialTurns) {
        return { winner: a.playerId, reason: 'timeout-tiebreak' };
      }
      return { winner: null, reason: 'timeout-tiebreak' };
    }

    return null;
  }
}
