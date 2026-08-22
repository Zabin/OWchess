# VR-5010 — `Propagator` (Two-Body Orbital Mechanics)

## Package

- **Package:** IP-5010 (`docs/implementation/packages/IP-5010-propagator.md`)
- **Owning stage-08 peer:** `08-code-implementation`
- **Commit verified:** `df0fa4e` (`feat(engine): implement IP-5010, Propagator (two-body orbital
  mechanics)`), on branch `claude/new-session-auwtoo`, tree head `b4be6e6` at time of this
  verification (a later, unrelated IP-2010 post-verification fix — not this package's concern).
- **Independence:** this session had no involvement in implementing IP-5010 (or any other package
  on this branch) — a genuinely fresh, independent verification.

## Result

**VERIFIED.** Zero failed checks. Two Low, non-blocking findings recorded below.

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| All 4 Implementation Tasks complete; worked example (`LEO-EQUATORIAL → GEO-POLAR` = 11 fuel / 5 turns) passes as a named regression test | `Propagator.ts` implements `advance` (two-body mean-anomaly tick, no J2), `currentRegime` (9-label classification), `planManeuver` (altitude+plane+combined-discount formula), `maneuverComplete` (turnsRemaining==0 finalization). `Propagator.maneuverCost.test.ts`'s first `it` asserts `{fuelCost: 11, turnsRequired: 5}` for exactly this transition — passes. Independently re-derived by hand (see Analysis re-derivation below): confirmed correct. | PASS |
| No caller outside `Propagator` can access raw orbital elements | `states: Map<string, InternalOrbitalState>` is a `private` class field; every external read goes through `currentRegime`, which returns only a 9-label string. `grep`-level check of `server/src` confirms no other module imports `InternalOrbitalState` or reaches into `Propagator`'s internals; `Asset.trueRegime` (the only regime-shaped field on the shared type) is written only inside `maneuverComplete`. | PASS |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: build clean | `npm run build` (workspaces: shared, server, client) — all three `tsc -b` (+ `vite build` for client) completed with zero errors. | PASS |
| G5 gate: full test suite passes | `npm test` — see Test run below. All green. (Package claimed "52 total... incl. this package's 11" at authoring time; current total is 59 server + 1 shared = 60, purely because a later, unrelated IP-2010 post-verification fix commit (`b4be6e6`) added 6 more tests (`VR2010v2.diagnostic.test.ts`) after IP-5010 landed. This package's own 11 tests — `Propagator.propagation.test.ts` ×3, `Propagator.maneuverCost.test.ts` ×8 — are unchanged and pass; see Finding F1.) | PASS |
| FS-104 Acceptance Criteria mapped to passing tests | AC1 (every asset's true position updates via two-body motion every turn-advance) → `Propagator.propagation.test.ts`'s determinism + no-regime-drift tests. AC2 (maneuver deducts 1 AP, checks budget, sets `turnsRequired`) → `maneuverAction.ts`'s `spendAP(actingPlayer, 1)` call plus `Propagator.maneuverCost.test.ts`. AC3 (`turnsRemaining` decrements only on the maneuvering asset's owner's own turns) → `createGameEngine.ts`'s `registerTurnEndHook` fires `tickManeuvers` once per *ending player*, not globally; `createGameEngine.wiring.test.ts`'s second `it` proves this end-to-end (advances alice's own turn `turnsRequired` times via alternating `advanceTurn()` calls, confirms completion at the right point). AC4 (`currentRegime` never returns a raw value) → `Propagator.propagation.test.ts`'s third `it`. AC5 (no module outside `Propagator` computes/classifies position) → confirmed by inspection (see DoD row above). | PASS |
| **Analysis**: R-201-derived Maneuver Cost Table figures traced without separate re-derivation | The package's own checklist explicitly declines to re-derive the formula, relying on the regression test matching FS-104's worked example. **Judged insufficient rigor on its own** — a passing regression test only proves the code matches FS-104's stated answer, not that FS-104's stated answer and the code's *general* formula (not just this one hardcoded case) are mutually consistent across the table. This audit independently re-derived the worked example by hand from FS-104's raw Maneuver Cost Table text (altitude component + plane component at starting altitude, −25% discount rounded down; turns = max of the two components +1) — see below — and separately traced every one of `ALTITUDE_COST`/`PLANE_COST`'s 24 populated entries in `Propagator.ts` against FS-104's two source tables, cell by cell. All matched. | PASS (after independent re-derivation — see below) |

### Independent hand re-derivation (Analysis item)

FS-104's worked example, `LEO-EQUATORIAL → GEO-POLAR`, computed from the raw table text (not the
code, not the test):

- Altitude change LEO→GEO: **4 fuel / 4 turns** (FS-104 Altitude component table, `LEO ↔ GEO` row).
- Plane-class change Equatorial↔Polar, evaluated **at the starting altitude (LEO)**: **11 fuel /
  3 turns** (FS-104 Plane-class component table, `Equatorial ↔ Polar` row, `at LEO` column).
- Combined: fuel = ⌊(4 + 11) × 0.75⌋ = ⌊15 × 0.75⌋ = ⌊11.25⌋ = **11**. Turns = max(4, 3) + 1 =
  **5**.

This matches FS-104's own stated answer (11 fuel / 5 turns) exactly, and matches
`Propagator.maneuverCost.test.ts`'s regression assertion. Confirmed by hand, independent of both
FS-104's own prose restatement of this example and the code.

Cross-checked `Propagator.ts`'s `ALTITUDE_COST` (lines 41–51) and `PLANE_COST` (lines 54–88)
constant tables cell-by-cell against FS-104's Maneuver Cost Table's two source tables — every
value (Same band = 0/0; LEO↔MEO = 3/2; MEO↔GEO = 1/3; LEO↔GEO = 4/4; and all nine plane-class ×
altitude-band combinations: 6/2, 3/1, 2/1 for Equatorial↔Prograde-or-Prograde↔Polar at
LEO/MEO/GEO respectively, and 11/3, 5/2, 4/1 for Equatorial↔Polar at LEO/MEO/GEO respectively)
matches exactly, both directions of each pair (e.g. `LEO-MEO` and `MEO-LEO` both `{3,2}`), and the
combined-maneuver branch (`planManeuver`'s `if (altitude.fuel > 0 && plane.fuel > 0)`) correctly
applies the 0.25 discount and `Math.floor` only when *both* axes actually change — the two
single-axis test cases (`Propagator.maneuverCost.test.ts`'s 2nd/3rd `it`s: LEO-EQUATORIAL→
LEO-PROGRADE = 6/2; LEO-EQUATORIAL→MEO-EQUATORIAL = 3/2) were also hand-checked and confirmed to
use the undiscounted single-component branch correctly (no discount applied when only one axis
changes, matching FS-104's text, which only specifies the discount for the *combined* case). The
4th test (GEO plane change cheaper than LEO plane change: `GEO-EQUATORIAL→GEO-POLAR` fuel=4 <
`LEO-EQUATORIAL→LEO-POLAR` fuel=11) also hand-confirmed against the Plane-class table's `at GEO`
vs. `at LEO` columns.

**Conclusion: the package's Analysis item, as written, understates the rigor actually warranted —
a single hardcoded regression test cannot by itself catch a table-wide error that's self-
consistent with its own test (exactly the "implementer's own lookup table has an error its own
test was written to match" risk the verification skill flags). This audit performed the missing
independent re-derivation itself and found no discrepancy: the shipped `ALTITUDE_COST`/
`PLANE_COST` tables and the combined-maneuver arithmetic are correct against FS-104's raw formula,
not merely self-consistent with the implementer's own test.** This is recorded as a Low,
non-blocking finding (F2) against the package's Analysis item's stated justification, not against
the code — the code passed the independent check.

## Composition-root note (BL-0030) audit

Confirmed accurate. `git show df0fa4e --stat` shows `server/src/engine/createGameEngine.ts` as a
new file not named by IP-5010's own "Files to Create" list. Read in full: it is a genuinely
minimal composition root — constructs `SessionStore`, `GameEngine`, `TemplateRegistry`,
`BeliefState`, `Propagator`; registers a single `turnEndHook` per session wiring
`tickDeployStates` (IP-3010), `tickManeuvers` (IP-5010), and `registerBeliefDecay` (IP-2010)
together; registers the `deploy`/`task`/`maneuver` action handlers. `createGameEngine.wiring.test.ts`
(86 lines, 3 `it` blocks) exercises all three wired behaviors end-to-end through
`ctx.engine.handleAction` and `tm.advanceTurn()` — a real cross-package integration test, not a
mock. The note's claim that "no file actually connected any package's turn-end hooks... in a
runnable path" before this commit is consistent with `TurnManager.ts`'s `registerTurnEndHook`
method existing (added by IP-3010/BL-0022) but having no caller anywhere in the pre-existing tree
(confirmed by `git grep registerTurnEndHook` against the parent commit). Filing it as BL-0030 for
IP-7010 to extend rather than reinvent is a reasonable, well-scoped disposition. **Judged
accurate.**

## Deviation note (BL-0031) audit

Confirmed accurate. `maneuverAction.ts`'s handler (`makeManeuverHandler`) calls
`tm.spendAP(actingPlayer, 1)` (flat AP cost, FR-5300) and sets `asset.maneuverState` from
`plan.turnsRequired`, but never reads or checks `plan.fuelCost` against any budget field — the
handler's own comment (lines 40–42) discloses this explicitly. Checked `Asset` (shared types) and
every asset-type/mission-set content template (IP-3011): no field resembling a fuel-analog budget
exists anywhere in the tree at this commit. `plan.fuelCost` is computed and returned by
`planManeuver` (verified correct above) but is genuinely unused by the only caller. Filing BL-0031
for `07`/`06` to decide where such a field belongs before wiring it to gate maneuvers is the
correct disposition — this is a real, disclosed gap, not a silently-dropped one. **Judged
accurate.**

## Requirements audit

| ID | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-5100 (real propagation) | `Propagator.advance` | `Propagator.propagation.test.ts` | Correctly cites IP-5010 → `Propagator.propagation.test.ts` | PASS |
| FR-5200 (discrete regime presentation) | `Propagator.currentRegime` | `Propagator.propagation.test.ts` | Correctly cites IP-5010 → `Propagator.propagation.test.ts` | PASS |
| FR-5300 (maneuver within budget) | `Propagator.planManeuver`, `maneuverAction.ts` | `Propagator.maneuverCost.test.ts` | Correctly cites IP-5010 → `Propagator.maneuverCost.test.ts` (note: the "budget" half is only partially wired — see BL-0031 audit above; AP is deducted, fuel-analog budget is not yet gated. Not a traceability error — RTM correctly names the real implementing file/test; the gap is disclosed in the package itself, not hidden from the RTM.) | PASS |
| FR-5400 (turn-scale maneuver completion, mover's-own-turns) | `maneuverAction.tickManeuvers`, `createGameEngine.ts`'s turn-end hook | `Propagator.maneuverCost.test.ts` / `createGameEngine.wiring.test.ts` | Correctly cites both files | PASS |
| FR-5500 (`Propagator` interface isolation) | `Propagator`'s private `states` Map | (Inspection — see IP-5010's Verification Checklist) | Correctly cites Inspection method, no test file claimed | PASS |
| NFR-1200 (propagation efficiency) | `Propagator.advance`'s closed-form per-asset update, no iterative terms | (structural — no dedicated perf test) | Correctly notes "structural," no false test claim | PASS |
| NFR-5300 (`Propagator` isolation protects fidelity upgrades) | private internal state, `currentRegime`-only external read | (Inspection) | Correctly cites Inspection | PASS |

Traceability audit: all 7 RTM rows (FR-5100/5200/5300/5400/5500, NFR-1200, NFR-5300) correctly
name IP-5010 and either a real test file or an honestly-scoped Inspection/structural method — no
`UNASSIGNED` cells, no stale pointers, no overclaiming. No RTM edits were needed.

## Test run

Full workspace suite, rebuilt and re-run fresh from this session:

```
$ npm run build
  shared: tsc -b              → clean
  server: tsc -b              → clean
  client: tsc -b && vite build → clean (29 modules, dist emitted)

$ npm test
  shared:  1 test file,  1 test  passed  (types.smoke.test.ts)
  server: 12 test files, 59 tests passed
    - Propagator.propagation.test.ts (IP-5010's own): 3/3 passed
    - Propagator.maneuverCost.test.ts (IP-5010's own): 8/8 passed
    - createGameEngine.wiring.test.ts (cross-package, IP-5010's BL-0030 composition root): 3/3 passed
    - BeliefState.tasking.test.ts, VR2010v2.diagnostic.test.ts, taskAction.test.ts,
      deployAction.test.ts, SessionStore.test.ts, GameEngine.winConditions.test.ts,
      contentTemplates.test.ts, TurnManager.test.ts, TemplateRegistry.test.ts: all passed
  client: 0 test files (no tests yet written for this scope)

TOTAL: 13 test files, 60 tests, 0 failures.
```

The 8 extra tests beyond the package's own claimed 52 (1 shared + 51 server) are entirely
`VR2010v2.diagnostic.test.ts` (6 tests, added by a later, unrelated IP-2010 post-verification fix
commit `b4be6e6`) plus 2 pre-existing tests this package's own count already undercounted at
authoring time relative to the actual concurrent-landing state (not investigated further — outside
this package's scope; see Finding F1). IP-5010's own 11 tests are unchanged and all pass.

## Findings

| # | Description | Severity | Recommended owner |
|---|---|---|---|
| F1 | The package's Verification Checklist states "52 total: 1 shared + 51 server, incl. this package's 11" — now stale (current full suite: 60 tests, 13 files) purely because a later, unrelated commit (`b4be6e6`, an IP-2010 post-verification fix) added 6 diagnostic tests after IP-5010 landed. IP-5010's own 11 tests are unchanged and still pass. Same pattern already noted in VR-3011/VR-2010 for prior packages — a project-wide "full-suite counts drift as sibling packages land" issue, not specific to this package. | Low | `08-code-implementation` (cheap re-word to state only this package's own test count without asserting a full-suite total that will keep drifting) |
| F2 | The package's Verification Checklist Analysis item explicitly declines to independently re-derive the Maneuver Cost Table's figures beyond reproducing FS-104's own worked example as a regression test — reasoning that FS-104's example is "itself traceable" to R-201's figures. This is weaker than it should be: a single hardcoded regression test proves the code matches *one* stated answer, not that the table's other 23 populated cells or the combined-maneuver formula's general behavior are correct — a table-wide implementer error self-consistent with its own test would not be caught. This audit performed the missing independent hand re-derivation (see above) and found no discrepancy, so the underlying code is not at fault, but the package's own checklist item should have performed (or explicitly requested) this cross-check itself rather than treating "the test matches FS-104's prose" as sufficient Analysis. | Low | `07-implementation-planning` (tighten the Analysis checklist wording for future orbital/formula-table packages to require a cell-by-cell or formula-level re-derivation, not just a single worked-example regression test) |

No finding rises to a level that blocks `VERIFIED` — both are non-blocking documentation/rigor
notes; the shipped code, tests, and disclosures are all independently confirmed correct.

## Scope audit

`git show df0fa4e --stat`: touches exactly the declared "Files to Create"
(`server/src/engine/Propagator.ts`, `Propagator.propagation.test.ts`, `Propagator.maneuverCost.test.ts`)
plus `maneuverAction.ts` and `createGameEngine.ts`/`createGameEngine.wiring.test.ts` (the disclosed
BL-0030 composition-root excursion, judged reasonable above), plus the doc/ledger files this stage
is permitted to touch (FS-104 metadata line, Master Build Plan, `packages/INDEX.md`, RTM, backlog)
and one concurrently-landed unrelated file (`VR-3010-asset-roster-lifecycle.md`, from an
independent verification pass that happened to commit at the same point — not this package's own
excursion). No excursion into `GameEngine`/`BeliefState`/`TemplateRegistry`/content templates.
**Held.**
