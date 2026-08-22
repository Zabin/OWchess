# IP-2010 — Sensing & the F2T2E Chain

- **Package ID:** IP-2010 · **Status:** BLOCKED (on IP-0010, IP-1010, IP-3010, IP-3011) ·
  **Owning stage-08 peer:** `08-code-implementation`
- **Source:** FS-103 (`docs/features/FS-103-sensing-f2t2e-chain.md`), FEAT-2000
- **Authorization (G3):** Covered by the release plan.

## Objective

Implement the *content*-producing half of `BeliefState`: sensor tasking (`applyTasking`),
capability-gated precision advancement along find→fix→track→target, and the 5-turn staleness
decay (`decayStaleEntries`) resolved via BL-0009 — `'find'`-level entries removed entirely, not
floored, when stale. (`computeOpponentView`, the *enforcement* half, is IP-6010's separate
package, per FS-106's own scope split.)

## Requirements Covered

FR-2100, FR-2200, FR-2300, FR-2400.

## Architecture Components

`BeliefState` (tasking/decay methods only — `computeOpponentView` excluded, IP-6010's scope).

## Interfaces

Implements `BeliefState.applyTasking`, `BeliefState.decayStaleEntries` (GDS-09). Consumes IP-3010's
`assertOnline` (sensor must be online) and IP-3011's per-template `chainRoles` capability ceiling.

## Files to Create

- `server/src/engine/BeliefState.ts` (tasking/decay methods; `computeOpponentView` added later by
  IP-6010 to this same file, or a sibling file — IP-6010's package states this explicitly at that
  time), `server/src/engine/__tests__/BeliefState.tasking.test.ts`

## Implementation Tasks

1. `applyTasking(observer, sourceAsset, targetRegime, turnNumber)`: advance the `BeliefStateEntry`
   for `targetRegime` one precision level (find→fix→track→target), capped at the tasking sensor's
   `chainRoles` ceiling (FR-3003) — a sensor whose ceiling is `'fix'` can never push an entry past
   `'fix'` regardless of repeated tasking.
2. `decayStaleEntries(observer, currentTurn)`: for every `BeliefStateEntry` not refreshed in the
   last 5 turns (BL-0009's resolved window), downgrade one precision level; if already at `'find'`,
   remove the entry entirely (reverts to fully unknown — BL-0009's second resolved point), not
   floored at `'find'`.
3. Wire `applyTasking` into IP-1010's `handleAction` switch (replacing the `task`-type stub).
4. Wire `decayStaleEntries` into the turn-advance loop (called once per turn-advance, alongside
   `Propagator.advance`, per GDS-09).

## Tests to Add

`BeliefState.tasking.test.ts`: precision advances correctly per tasking action; capability
ceiling enforced (a `'fix'`-ceiling sensor cannot produce a `'track'`/`'target'` entry); 5-turn
decay downgrades one level; a stale `'find'`-level entry is removed, not floored.

## Documentation Updates

FS-103 metadata: `**Implemented by:** IP-2010`.

## Definition of Done

- [ ] All 4 Implementation Tasks complete; BL-0009's exact resolved behavior (5-turn window,
      `'find'`-removal) passes as a named test case, not just an incidental one.

## Verification Checklist

- [ ] **G5 gate:** build clean. **G5 gate:** full test suite passes.
- [ ] FS-103 Acceptance Criteria mapped to passing tests.
- [ ] Capability-ceiling enforcement verified for at least one sensor at each of the 3 non-`target`
      ceilings (find/fix/track), not only the full-chain case.

## Dependencies

IP-0010, IP-1010, IP-3010, IP-3011 (all `VERIFIED` required — needs online assets with real
`chainRoles` values to task against).

## Risks

Low — the decay/precision logic is a straightforward state machine; the only subtlety (already
resolved by the owner, BL-0009) was the exact numeric window and floor-vs-remove behavior.

## Rollback Considerations

No persisted state; safe to fix forward.
