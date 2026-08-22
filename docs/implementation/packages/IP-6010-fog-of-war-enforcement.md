# IP-6010 — Fog-of-War Enforcement

- **Package ID:** IP-6010 · **Status:** BLOCKED (on IP-0010, IP-2010) · **Owning stage-08 peer:**
  `08-code-implementation`
- **Source:** FS-106 (`docs/features/FS-106-fog-of-war-enforcement.md`), FEAT-6000
- **Authorization (G3):** Covered by the release plan.

## Objective

Implement `BeliefState.computeOpponentView` as the single, sole construction point for every
client-bound opponent-facing message, plus `BeliefState.applyDeception` (assigned to this package
during this planning pass — see the Technical Work Breakdown's sequencing note — since it already
owns `BeliefState`'s belief-mutation surface for this enforcement boundary). This is the project's
highest-priority security test surface (NFR-3100/GDS-06).

## Requirements Covered

FR-6100, FR-6200, NFR-3100.

## Architecture Components

`BeliefState` (enforcement methods, added to the same module IP-2010 began).

## Interfaces

Implements `BeliefState.computeOpponentView`, `BeliefState.applyDeception` (GDS-09). Consumed by
IP-7010 (every `StateDeltaMessage`'s `opponentView` field must come from this call, never a raw
`PlayerState`).

## Files to Create/Modify

- Modify `server/src/engine/BeliefState.ts` (adds `computeOpponentView`/`applyDeception` to the
  file IP-2010 created; no other module edited)
- `server/src/engine/__tests__/BeliefState.fogOfWar.test.ts`

## Implementation Tasks

1. `computeOpponentView(observer, trueOpponentState, turnNumber)`: builds an `OpponentView`
   (GDS-07's structurally distinct type — never `PlayerState`) containing only what `observer`'s
   own belief-state entries justify; reads no other source of opponent truth.
2. `applyDeception(observer, subject, falseRegime)`: writes a corrupted `BeliefStateEntry` for
   `subject` under `observer`'s belief state — never touches `subject`'s own true `Asset` record
   (the structural Deceive/Destroy distinction GDS-04/07 require, now enforced at the
   implementation level, not just the interface-contract level).
3. **Supersession sweep** (mandatory per this skill's own rule, since this package's method sits
   inside a file IP-2010 already created): search `server/src/engine/BeliefState.ts` and every
   caller for any other place opponent-facing data might be assembled outside this one function —
   confirm `GameEngine`/IP-7010's transport layer hold no independent opponent-data-construction
   logic. Record the result explicitly (expected: "found nothing else, confirmed clean," since
   this is the project's first pass and IP-1010/2010 were built without ever touching opponent-
   facing serialization).

## Tests to Add

`BeliefState.fogOfWar.test.ts`: `computeOpponentView`'s output contains only fields the observer's
belief-state entries justify (a type-level assertion: the return value is never structurally a
`PlayerState`); `applyDeception` leaves the subject's true `Asset.trueRegime` unchanged while the
observer's `BeliefStateEntry` for it is corrupted.

## Documentation Updates

FS-106 metadata: `**Implemented by:** IP-6010`. FS-105 metadata: note `applyDeception`'s actual
home is IP-6010 (cross-reference, since FS-105 consumes it).

## Definition of Done

- [ ] `computeOpponentView` is the only function in the codebase constructing opponent-facing data
      (supersession sweep passed).
- [ ] `applyDeception` never mutates true state (test-verified).

## Verification Checklist

- [ ] **G5 gate:** build clean. **G5 gate:** full test suite passes.
- [ ] FS-106 Acceptance Criteria mapped to passing tests.
- [ ] **Centrally-run test suite** (per FS-106's own Verification Plan) — this package's tests are
      the canonical fog-of-war regression suite `10-integration-review` re-checks whenever any
      later package touches `BeliefState`/transport.

## Dependencies

IP-0010, IP-2010 (both `VERIFIED`).

## Risks

Low — deliberately thin by design (FS-106's own stated rationale); the supersession-sweep result
is the one thing worth double-checking carefully, since a missed second construction site would be
a security defect, not a cosmetic one.

## Rollback Considerations

No persisted state; a defect here is Critical-severity (fog-of-war leak) and would be fixed
forward immediately, blocking any subsequent package's `VERIFIED` status until resolved.
