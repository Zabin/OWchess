# GDS-09 — Interface Specification

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-10, `07-implementation-planning`

Concrete module contracts, in TypeScript-shaped pseudocode (ADR-0001) — real enough for
`07-implementation-planning` to plan against, without being production code (G1's write-scope
rule: this level specifies, `08-*` implements).

## `Propagator` (GDS-03's boundary)

```ts
interface Propagator {
  // Advances every tracked asset's true orbital state by one turn-tick.
  // Called once per turn-advance by GameEngine/TurnManager (GDS-01's turn loop).
  advance(assets: Asset[]): void;

  // Discrete presentation (FR-5002) — never exposes raw elements past this call's return.
  currentRegime(asset: Asset): OrbitalRegimeLabel; // one of R-203's 9 values

  // Begins a maneuver; returns the turn-count (per OQ-11: counted in the asset owner's own
  // turns) until it completes. Does not itself deduct fuel-analog cost — that's EffectResolver/
  // GameEngine's job, reading the asset template's cost (FR-2xxx), keeping Propagator's one job
  // to physics/regime-classification only.
  planManeuver(asset: Asset, targetRegime: OrbitalRegimeLabel): { turnsRequired: number };

  // True if an in-progress maneuver (Asset.maneuverState) has completed this owner-turn-advance.
  maneuverComplete(asset: Asset): boolean;
}
```

No caller (`GameEngine`, `BeliefState`, the client) may hold a reference to this interface's
internal state or call any method not listed here — this is the entire surface FR-5005's
"swappable implementation" promise rests on (NFR-5003).

## `BeliefState` (the fog-of-war boundary, GDS-06's security NFR)

```ts
interface BeliefState {
  // The ONLY function permitted to construct client-bound opponent data (GDS-07/08).
  // Reads GameEngine's true PlayerState + this player's own tasking history; never
  // independently stored (GDS-04).
  computeOpponentView(observer: PlayerId, trueOpponentState: PlayerState, turnNumber: number): OpponentView;

  // Called when a tasking action (SOR §7.5) resolves — advances precision per the F2T2E
  // chain (find/fix/track/target), per asset capability (FR-3003).
  applyTasking(observer: PlayerId, sourceAsset: Asset, targetRegime: OrbitalRegimeLabel, turnNumber: number): void;

  // Called once per turn-advance — degrades stale entries (FR-3004); exact decay rate: 04/06.
  decayStaleEntries(observer: PlayerId, currentTurn: number): void;

  // Records a Deceive effect's corruption of a specific belief entry (GDS-04/07).
  applyDeception(observer: PlayerId, subject: AssetId, falseRegime: OrbitalRegimeLabel): void;
}
```

`GameEngine` calls `computeOpponentView` exactly once per outbound state-delta, per client — never
constructs an opponent-facing message itself (GDS-06's central invariant, restated here as an
interface-level rule, not just a design intent).

## `EffectResolver`

```ts
interface EffectResolver {
  // Requires targeting-quality data (FR-4002) — throws/rejects if BeliefState's precision for
  // the target isn't at least 'target'. Applies the Five D's effect (FR-4003); Destroy removes
  // the asset (GDS-07); Deceive calls BeliefState.applyDeception instead of mutating the target's
  // own true state (GDS-04's qualitative distinction, enforced here structurally).
  resolveEngagement(effector: Asset, target: Asset, effect: FiveDsEffect, beliefState: BeliefState): EngagementResult;

  // Applied once per turn-advance, tracks consecutive-turn duration for the mission-denial win
  // path (FR-4005); handles Degrade's stacking (FR-4004).
  tickActiveEffects(asset: Asset, currentTurn: number): void;
}
```

## `TurnManager`

```ts
interface TurnManager {
  activePlayer(): PlayerId;
  apRemaining(): number;
  // Rejects (returns false) any call where actingPlayer !== activePlayer() (FR-1009) — the
  // ONLY place out-of-turn rejection happens.
  submitAction(actingPlayer: PlayerId, action: Action): { accepted: boolean; reason?: string };
  advanceTurn(): void; // called on pass or AP exhaustion (GDS-01)
}
```

## `GameEngine` (orchestration, not domain logic)

```ts
interface GameEngine {
  // The single entry point for "an action arrived." Dispatches to Propagator (maneuver),
  // EffectResolver (engage), BeliefState (task), or TurnManager (pass) — never computes
  // maneuver/effect/belief outcomes itself (GDS-03's one-job-per-module rule).
  handleAction(sessionId: SessionId, actingPlayer: PlayerId, action: Action): ActionResult;

  // Runs after every resolved action (GDS-01 step 4). Reads SessionState only — does not itself
  // decide effect application (that already happened via EffectResolver/Propagator).
  checkWinConditions(sessionId: SessionId): WinResult | null;
}
```

## WebSocket message schema (GDS-02's two channels, concretely)

```ts
// client -> server
type ActionMessage = { type: 'action'; sessionId: SessionId; action: Action };

// server -> client (GDS-02's push channel; always filtered through BeliefState per-recipient)
type StateDeltaMessage = {
  type: 'state-delta';
  ownState: PlayerState;        // the recipient's own full true state
  opponentView: OpponentView;   // BeliefState.computeOpponentView output — never raw PlayerState
  activeTurn: PlayerId;
  eventLogEntry?: EventRecord;  // the just-resolved action, human-readable
};

type RejectedActionMessage = { type: 'action-rejected'; reason: string };

// Added 2026-08-22 by FS-107, specifying FS-101 §W7's disconnect policy (no grace period;
// notify the still-connected player and let them choose to wait or cancel).
type DisconnectNotification = { type: 'disconnect-notification' };
type DisconnectResponse = { type: 'disconnect-response'; choice: 'wait' | 'cancel' };
```

No other message type exists in v1 beyond these — GDS-02's "exactly two channels" (action
submission, state-delta push) is preserved at the conceptual level; `DisconnectNotification`/
`DisconnectResponse` are a small, fully-specified extension of the state-delta-push channel's own
purpose (informing a client of session-relevant state), not a new channel — still no chat,
spectator feed, or replay-export message.

## Merge gate

- [x] Every GDS-03 module (`Propagator`, `BeliefState`, `EffectResolver`, `TurnManager`,
      `GameEngine`) has a concrete method-level contract.
- [x] `BeliefState.computeOpponentView` named as the sole constructor of client-bound opponent
      data, closing the loop from GDS-06 (security NFR) through GDS-07 (type distinction) to here
      (the one function that produces that type).
- [x] `Deceive`/`Destroy`'s structural distinction (GDS-04/07) is enforced at the interface level
      (`applyDeception` vs. asset removal), not left as prose.
- [x] WebSocket schema has exactly the two message shapes GDS-02 established, no more.
- [x] No literal production code — interfaces/types only, no method bodies.

**Merge decision:** GDS-03/07/08 remain authoritative for module/data/presentation concepts; this
document is authoritative for their literal call contracts, feeding `07-implementation-planning`
directly (candidate module list for the Technical Work Breakdown).

**Gate:** closed 2026-08-21. No new Open Questions. Next: GDS-10 (Requirements Traceability
Matrix level) — the final ladder level.
