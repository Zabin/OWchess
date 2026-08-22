# IP-1010 — Session & Turn Lifecycle

- **Package ID:** IP-1010 · **Status:** COMPLETE (2026-08-22) · **Owning stage-08 peer:**
  `08-code-implementation`
- **Source:** FS-101 (`docs/features/FS-101-session-turn-lifecycle.md`), FEAT-1000
- **Authorization (G3):** Covered by the release plan — FEAT-1000 is MVP-bucketed in the shape
  FS-101 describes.

## Objective

Implement `TurnManager` and the session-lifecycle portion of `GameEngine`: session create/join,
secret simultaneous King deployment, the AP turn loop (grant/spend/pass/exhaust), and
`checkWinConditions` covering all four win paths (destruction, denial, resignation, timeout/
tiebreak) with BL-0012's ordering default folded in.

## Requirements Covered

FR-1110, FR-1120, FR-1121, FR-1130, FR-1210, FR-1220, FR-1230, FR-1310, FR-1320, FR-1330, FR-1340,
FR-1350, FR-1405, FR-1410, FR-1420, NFR-2100, NFR-2200, NFR-3200, NFR-6100.

## Architecture Components

`TurnManager`, `GameEngine` (session/turn-loop/win-check portion only — action dispatch bodies for
maneuver/tasking/engage/deploy belong to their own packages, consumed here only via the interface).

## Interfaces

Implements `TurnManager` and `GameEngine.checkWinConditions` (GDS-09, `shared/src/interfaces.ts`
from IP-0010) in full; implements `GameEngine.handleAction`'s dispatch *shell* (routes to
`TurnManager.submitAction` for turn/AP legality, then to the action-specific module — the module
bodies it calls are `NOT STARTED`/stubbed until IP-2010/3010/4010/5010 land, per this plan's
sequencing) rather than the action bodies themselves.

## Files to Create

- `server/src/engine/TurnManager.ts`, `server/src/engine/GameEngine.ts`,
  `server/src/engine/SessionStore.ts` (in-memory `SessionState`/`PlayerState` storage — no
  database in v1, per NFR-6100's server-authoritative-in-process model)
- `server/src/engine/__tests__/TurnManager.test.ts`,
  `server/src/engine/__tests__/GameEngine.winConditions.test.ts`

## Implementation Tasks

1. `SessionStore`: create/join session, generate `SessionId`, hold two `PlayerState`s.
2. Secret King deployment: both players submit their King's initial regime/mission-set
   simultaneously (neither sees the other's choice until both have submitted — FR-1120/1121).
3. `TurnManager`: `activePlayer()`, `apRemaining()`, `submitAction` (rejects any
   `actingPlayer !== activePlayer()`, per FR-1009/FR-1310), `advanceTurn()` (on pass or AP
   exhaustion, per FR-1320/1330).
4. `GameEngine.checkWinConditions`: destruction (King asset removed, FR-1405), denial (consecutive
   denial-streak ≥ 6 turns, reading `EffectResolver`'s tracker, FR-1420), resignation (FR-1410),
   timeout/tiebreak (60-turn cap, FR-1350). **BL-0012's default**: when destruction and the
   60-turn timeout/tiebreak could both fire in the same check, destruction takes precedence —
   implement the check in that literal order (destruction checked and returned first).
5. `GameEngine.handleAction` dispatch shell: turn/AP legality via `TurnManager`, then a
   `switch (action.type)` routing to the still-stubbed module calls (`Propagator`/`BeliefState`/
   `EffectResolver` bodies arrive with their own packages; this package's own tests stub them).

## Tests to Add

`TurnManager.test.ts`: turn alternation, AP grant/spend/pass/exhaust, out-of-turn rejection.
`GameEngine.winConditions.test.ts`: each of the four win paths independently, plus the
destruction-vs-timeout simultaneity case (BL-0012) asserting destruction wins.

## Documentation Updates

FS-101's metadata: add `**Implemented by:** IP-1010`. Traceability matrix: mark FR-1xxx rows
`IN PIPELINE` pending IP-1010's `VERIFIED` status.

## Definition of Done

- [x] All 5 Implementation Tasks complete; all 4 win-condition paths independently testable and
      passing, including the BL-0012 ordering case (`GameEngine.winConditions.test.ts`).
- [x] `handleAction`'s dispatch shell compiles and routes correctly to stubs — `registerHandler`
      accepts injected `deploy`/`maneuver`/`task`/`engage` handlers (none registered yet; an
      unregistered type is rejected with a clear reason, not silently ignored).

## Verification Checklist

- [x] **G5 gate:** `npm run build` clean.
- [x] **G5 gate:** `npm test` full suite passes (16 tests: 1 shared smoke + 15 server —
      `SessionStore.test.ts` ×4, `TurnManager.test.ts` ×4, `GameEngine.winConditions.test.ts` ×7).
- [x] Acceptance Criteria 1–5 of FS-101 (§Acceptance Criteria) each map to a passing test.
- [x] No module outside `TurnManager` performs turn/AP legality checks (Inspection — `GameEngine`
      delegates every turn check to `tm.submitAction`, never checks `activeTurn` itself).

## Deviation note

Implementing win-condition checks (FR-1420's tiebreak specifically) surfaced that GDS-07's
`Asset` shape had no field for *cumulative* denial-turns, distinct from `consecutiveDenialTurns`
(BL-0015's stored streak, which resets on a clean turn). Added `totalDenialTurns: number` and
`destroyed: boolean` to `shared/src/types.ts` (the latter needed since GDS-07 leaves Destroy's
exact mechanism — removal vs. flag — as an implementation choice, and a flag fits this session's
single-King-field `PlayerState.king` shape better than array removal). Filed as BL-0021 for
`07-implementation-planning`/GDS-07 to formally record the schema addition.

## Dependencies

IP-0010 (`VERIFIED` required before this is `READY`).

## Risks

Medium — the highest-traffic module in the engine (every action passes through
`handleAction`/`TurnManager`); the King-deployment simultaneity (§Implementation Task 2) is the
one genuinely tricky ordering detail, since it requires holding both players' submissions until
both arrive rather than processing them independently.

## Rollback Considerations

No persisted state in v1 (in-memory `SessionStore`) — a defect here is fixed forward with no data
migration; a live session mid-rollback simply restarts (acceptable pre-release).
