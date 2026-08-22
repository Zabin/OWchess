# IP-8010 — Presentation / UI

- **Package ID:** IP-8010 · **Status:** BLOCKED (on every other package in this plan) ·
  **Owning stage-08 peer:** `08-code-implementation`
- **Source:** FS-108 (`docs/features/FS-108-presentation-ui.md`), FEAT-8000
- **Authorization (G3):** Covered by the release plan.

## Objective

Implement the React client: all six GDS-08 panels (orbital board, action menu, asset tray,
mission/King status, intel panel, event log), the client-side legality pre-filter (resolving
BL-0004), and `ActionMessage` submission — grounded visually in the confirmed ZabOW reference
(MSTR-001 §4).

## Requirements Covered

FR-8100, FR-8200, FR-8300, FR-8400, FR-8500, NFR-4100, NFR-4200, NFR-7100.

## Architecture Components

Client UI (`client/src/`) — the sole consumer of every other module's already-defined output; it
computes nothing about game truth or belief-state itself (GDS-02's client-architecture
constraint).

## Interfaces

Consumes `StateDeltaMessage`/`RejectedActionMessage`/`DisconnectNotification` (IP-7010); submits
`ActionMessage`/`DisconnectResponse`. Uses the bounded, read-only legality-rule copy generated from
`shared/` (IP-0010) for the pre-filter — never redefines the rules independently.

## Files to Create

- `client/src/components/OrbitalBoard.tsx`, `ActionMenu.tsx`, `AssetTray.tsx`,
  `MissionKingStatus.tsx`, `IntelPanel.tsx`, `EventLog.tsx`
- `client/src/legality/legalityPreFilter.ts` (the bounded rule copy, generated from `shared/`'s
  types — a pure function, not duplicated hand-written rules)
- `client/src/state/gameClient.ts` (WebSocket connection, `StateDeltaMessage` handling, client-
  local UI state per FS-108 §State Changes)
- `client/src/__tests__/legalityPreFilter.test.ts`, `client/src/__tests__/OrbitalBoard.test.tsx`,
  `client/src/__tests__/fogOfWarBoundary.test.tsx`

## Implementation Tasks

1. `gameClient.ts`: WebSocket connection, dispatch `StateDeltaMessage` into component state,
   handle `DisconnectNotification` (render connectivity-lost UI + wait/cancel choice, per FS-108
   §Error Handling) and `RejectedActionMessage` (shown distinctly from a pre-filtered "not
   available" case).
2. `legalityPreFilter.ts`: given the client's own `PlayerState` + `activeTurn`, compute which
   actions are currently legal (AP/precision/online-state preconditions), matching the server's
   own legality computation as of the last received state (NFR-4200's one permitted race
   exception).
3. Six panel components, each rendering only from `ownState`/`opponentView` (never independently
   inferring opponent truth) — `OrbitalBoard` distinguishes own/known-opponent/unknown contacts
   per GDS-08's palette; `AssetTray` shows cost/time-to-online, disabled-with-reason for
   unaffordable templates (not hidden); `EventLog` appends `EventRecord`s in order.
4. Initial render (W1) and reconnect use the same code path (a full `StateDeltaMessage` in both
   cases) — no separate "resume" render logic.

## Tests to Add

`legalityPreFilter.test.ts`: pre-filter output matches a set of known server-legality fixtures
(Test, per FS-108's Verification Plan split).
`fogOfWarBoundary.test.tsx`: a type-level/structural test asserting no component ever accepts a
`PlayerState`-shaped prop where `OpponentView` is expected (the specific property FS-108's
Verification Plan calls out).
`OrbitalBoard.test.tsx`: own/known/unknown markers render with visually distinct classes/props
(Demonstration is primary per FS-108, but this smoke-level render test still guards against a
regression removing the distinction entirely).

## Documentation Updates

FS-108 metadata: `**Implemented by:** IP-8010`.

## Definition of Done

- [ ] All six panels render from a `StateDeltaMessage` fixture, initial-render and reconnect paths
      identical.
- [ ] Pre-filter matches server legality on the fixture set; fog-of-war boundary test passes.
- [ ] Manual demonstration pass against the ZabOW reference's visual/UX bar (Demonstration, per
      FS-108's Verification Plan — this is a human-judgment check this package's own automated
      tests don't and can't substitute for).

## Verification Checklist

- [ ] **G5 gate:** build clean. **G5 gate:** full test suite passes.
- [ ] FS-108 Acceptance Criteria mapped to passing tests/demonstration, split Test vs. Demonstration
      exactly as FS-108's Verification Plan specifies (resolving BL-0008).
- [ ] No component holds or logs a raw `PlayerState` for the opponent (Inspection).

## Dependencies

Every other package in this plan (IP-0010, 1010, 2010, 3010, 3011, 4010, 4011, 5010, 6010, 7010 —
all `VERIFIED`), matching FS-108's own stated Dependencies field exactly ("every other Feature").

## Risks

Low-Medium (per the catalog) — mostly implementation volume (six panels, many states), not open
design uncertainty; substantially de-risked by the confirmed ZabOW visual reference. The largest
package in the plan by dependency count, making it the natural place a late-discovered upstream gap
would surface first (all upstream `VERIFIED` gates funnel here).

## Rollback Considerations

No persisted client state beyond browser-local UI conveniences; a bad render is fixed forward with
no migration concern.
