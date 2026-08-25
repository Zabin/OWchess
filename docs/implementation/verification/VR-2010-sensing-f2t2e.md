# VR-2010 — Sensing & the F2T2E Chain

- **Owned by:** `09-package-verification` · **Date:** 2026-08-22

## Package

- **ID:** IP-2010 · **Title:** Sensing & the F2T2E Chain · **Source:** FS-103
- **Commit verified:** `465a6cb` ("feat(engine): implement IP-2010, sensing & the F2T2E chain").
  Dependencies IP-0010, IP-1010, IP-3010, IP-3011 are all `VERIFIED` (VR-0010; VR-1010-v2
  supersedes the original RETURNED VR-1010 for status purposes; VR-3010; VR-3011). Also present in
  the tree at verification time: a `feat(engine): implement IP-5010` commit and its own
  `createGameEngine.ts`/`createGameEngine.wiring.test.ts` (COMPLETE, not yet `VERIFIED` — this is
  the concurrent IP-5010 verification the tasking session was warned about; its
  `createGameEngine.wiring.test.ts` genuinely exercises IP-2010's own decay logic, checked below).
- **Independence:** this session performed no implementation or fix work on IP-2010 — commit
  `465a6cb` predates this session entirely; this session's only actions were read-only inspection,
  one throwaway diagnostic test file (written, run, and deleted before any commit — never part of
  the tree at commit time), and the ledger/report writes this skill is authorized to make.
  Independence is clean, no caveat needed.

## Result

**RETURNED** — one Critical-severity defect found by direct, live exercise of a case none of the
package's own fixtures cover: tasking an asset with **no relevant `chainRoles` at all** (e.g. an
effector) is not rejected. It silently succeeds, deducts 1 AP, and produces zero belief effect,
with no distinguishable rejection reason returned to the caller — a direct violation of FS-103's
own Acceptance Criterion 4 and Error Handling section, which the package's Verification Checklist
explicitly (and, on this evidence, incorrectly) marks as satisfied. Both of the package's other two
Definition-of-Done/Checklist items hold up under independent audit, the disclosed BL-0028
deviation is reasonable and accurately described, and the shared build/test gates are green. This
one defect is sufficient by itself to send the package back to `08-code-implementation`.

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| All 4 Implementation Tasks complete; BL-0009's exact resolved behavior (5-turn window, `'find'`-removal) passes as named test cases | Read `BeliefState.ts` in full. Task 1 (`applyTasking` capped at `chainRoles` ceiling): `BeliefState.ts:48,58` (`capabilityCeiling`, `Math.min(currentIdx + 1, ceiling, ...)`) — confirmed by 3 `BeliefState.tasking.test.ts` cases (find-only, fix-ceiling, track-ceiling), all passing. Task 2 (`decayStaleEntries`, 5-turn window, `'find'`-removal): `BeliefState.ts:78-91` — `STALENESS_WINDOW = 5`, `idx <= 0` deletes rather than floors; `BeliefState.tasking.test.ts` "downgrades a stale entry", "removes (not floors) a stale find-level entry", "does not decay an entry refreshed within the staleness window" — all 3 passing, named exactly per BL-0009. Task 3 (wired into `handleAction`): `taskAction.ts`'s `makeTaskHandler` registered via `engine.registerHandler('task', ...)` in both `taskAction.test.ts` and, end-to-end, `createGameEngine.ts`. Task 4 (decay wired into turn-advance): `registerBeliefDecay` (`taskAction.ts:55-69`) calls `tm.registerTurnEndHook(...)`, exercised end-to-end by `createGameEngine.wiring.test.ts`'s third case. | **Pass** — all 4 tasks genuinely implemented and tested as claimed. |
| — (implicit, per FS-103 Error Handling / AC4, which the Verification Checklist below explicitly claims is covered) — tasking a sensor with no relevant `chainRoles` at all is rejected with a distinguishable reason | Read `taskAction.ts` in full: `makeTaskHandler` checks `assertOnline` (online state) and `tm.spendAP` (AP), then unconditionally calls `beliefState.applyTasking(...)` and returns `{ accepted: true }`. `applyTasking` (`BeliefState.ts:48-49`): `if (ceiling < 0) return;` — a silent no-op with **no reason surfaced to the caller**, for an asset whose `chainRoles` contain nothing on the F2T2E ladder (e.g. an effector). I wrote and ran a throwaway diagnostic test tasking an asset with `chainRoles: []` through the real `GameEngine.handleAction('task', ...)` path (not `BeliefState` directly): result was `{"accepted":true}`, AP debited from 5→4, zero belief entries created — confirmed live, then deleted the diagnostic file before any commit. | **Fail** — FS-103 AC4 / Error Handling explicitly requires this case be "rejected with a distinguishable reason from a legitimate ceiling-reached no-op." It is not rejected at all; AP is silently spent for a no-op action. |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: build clean | Ran myself from repo root: `npm run build` → `tsc -b` clean in `shared`, `server`; `tsc -b && vite build` clean in `client` (29 modules, 884ms). No errors. | Pass |
| G5 gate: full test suite passes (package's own claim: "38 total: 1 shared + 37 server, incl. this package's 9") | Ran myself: `npm test` → shared **1/1**; server **11 files, 51/51** (`BeliefState.tasking.test.ts` 7, `deployAction.test.ts` 4, `createGameEngine.wiring.test.ts` 3, `Propagator.maneuverCost.test.ts` 8, `SessionStore.test.ts` 5, `GameEngine.winConditions.test.ts` 7, `taskAction.test.ts` 2, `contentTemplates.test.ts` 4, `TurnManager.test.ts` 4, `Propagator.propagation.test.ts` 3, `TemplateRegistry.test.ts` 4); client 0 test files (expected). **Full-suite total: 52** (1 shared + 51 server) — up from the package's claimed 38 purely because IP-5010 (`Propagator.*.test.ts`, 11 tests) and the cross-package `createGameEngine.wiring.test.ts` (3 tests) landed on the branch concurrently/after IP-2010 was authored; IP-2010's own 9 tests (`BeliefState.tasking.test.ts` 7 + `taskAction.test.ts` 2) are unchanged and unaffected — expected drift, consistent with how VR-1010-v2/VR-3010/VR-3011 each treated the same kind of growth. | Pass (as a green-suite claim) — but see below: a green suite does not by itself validate the untested chainRoles-rejection path, which the live diagnostic exposed as broken. |
| FS-103 Acceptance Criteria mapped to passing tests | AC1 (1 AP + record/update) → `taskAction.test.ts` "creates a belief entry, deducting 1 AP" — passing. AC2 (ceiling never exceeded) → `BeliefState.tasking.test.ts`'s 3 ceiling cases — passing. AC3 (5-turn decay, `'find'`-removal) → `BeliefState.tasking.test.ts`'s 3 decay cases — passing. **AC4 (offline sensor OR no-relevant-`chainRoles` sensor rejected, with distinguishable reasons)**: the offline half is covered structurally (the same `assertOnline` helper IP-3010 already tests, called before AP is spent in `taskAction.ts:35-36`) but the **no-relevant-`chainRoles` half has no test anywhere in the tree**, and — per the Definition of Done row above — is not actually implemented as a rejection at all. | **Fail** — this checklist item is checked `[x]` in the package but is false as stated: AC4 is only half-mapped, and the untested half is also unimplemented. |
| Capability-ceiling enforcement verified for a `find`-only, a `fix`-ceiling, and a `track`-ceiling sensor | `BeliefState.tasking.test.ts`: "advances precision one level per tasking action, capped at the sensor ceiling" (find-only), "a fix-ceiling sensor advances find -> fix but no further", "a track-ceiling sensor advances up to track but not target" — all 3 read and confirmed passing. | Pass |

## Requirements audit (Requirements Covered)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-2100 (task a sensor, 1 AP) | `taskAction.ts` (`makeTaskHandler`) | `taskAction.test.ts` | RTM row: FS-103, IP-2010, `BeliefState.tasking.test.ts` / `taskAction.test.ts` — filled, accurate | Pass |
| FR-2200 (precision gated by capability) | `BeliefState.ts` (`capabilityCeiling`, `applyTasking`) | `BeliefState.tasking.test.ts` (3 ceiling cases) | RTM row filled, accurate | Pass |
| FR-2300 (staleness/decay) | `BeliefState.ts` (`decayStaleEntries`) | `BeliefState.tasking.test.ts` (3 decay cases) + `createGameEngine.wiring.test.ts`'s end-to-end decay case | RTM row filled, accurate | Pass |
| FR-2400 (reflect precision/staleness to UI) | Not this package's scope — RTM row correctly reads `IP-8010 (pending)`, `UNASSIGNED` | — | RTM row correctly attributes this to the future UI package, not IP-2010 | Pass (correctly out of scope) |

FR-2100's own acceptance criteria (in `01-functional-requirements.md`) do not themselves spell out
the no-relevant-`chainRoles` rejection in FR wording — that specific criterion lives at the FS-103
spec level (AC4) and in FS-103's Error Handling section, both of which this package cites as
in-scope in its own Verification Checklist. The RTM's FR-2100 cell is not wrong (it correctly names
the files/tests that do exist), so no RTM cell required correction; the gap is in the package's
own DoD/Checklist self-certification, not in the traceability matrix.

## Test run

Exact commands run by this verification session, from repo root, on the container's installed
Node/npm (`node_modules` already present, `npm install` not needed):

```
npm run build
```
→ `tsc -b` clean in `shared`; `tsc -b` clean in `server`; `tsc -b && vite build` clean in `client`
(29 modules transformed, built in 884ms). No errors, no warnings.

```
npm test
```
→ shared: **1 passed (1)**. server: **11 files, 51 passed (51)** — `BeliefState.tasking.test.ts` 7,
`deployAction.test.ts` 4, `createGameEngine.wiring.test.ts` 3, `Propagator.maneuverCost.test.ts` 8,
`SessionStore.test.ts` 5, `GameEngine.winConditions.test.ts` 7, `taskAction.test.ts` 2,
`contentTemplates.test.ts` 4, `TurnManager.test.ts` 4, `Propagator.propagation.test.ts` 3,
`TemplateRegistry.test.ts` 4. client: 0 test files, exits 0 (expected).

**Full-suite total: 52** (1 shared + 51 server). IP-2010's own 9 tests unaffected by the concurrent
IP-5010/`createGameEngine.wiring.test.ts` growth.

**Tunable/scenario-dependent parameter check (the skill's mandatory gotcha):** this package's DoD
turns on a capability-ceiling parameter (`chainRoles`) whose *fixtures* only ever exercise
non-empty role sets (`['find']`, `['find','fix']`, `['find','fix','track']`). No suite anywhere in
the tree exercises the **zero-relevant-roles** case live through the real action-handling path. Per
the skill's explicit instruction, I exercised this non-default value myself: I wrote a throwaway
test tasking a `chainRoles: []` asset through `GameEngine.handleAction('task', ...)` (the real
dispatch path, not a direct `BeliefState` call) and observed live: `{"accepted": true}`, AP debited
5→4, zero belief entries. This is exactly the kind of silent, fixture-masked defect the skill's
gotcha describes — a full green suite (52/52) was not sufficient evidence on its own. The
diagnostic file was deleted before this report was written; it is not part of any commit.

## Scope audit

`git show --stat 465a6cb` (the implementing commit) touched exactly: `BeliefState.ts`,
`taskAction.ts`, `BeliefState.tasking.test.ts`, `taskAction.test.ts` (the package's declared "Files
to Create"), plus documentation files (FS-103's `Implemented-by` line, Master Build Plan,
`packages/INDEX.md`, backlog, RTM, and — as a disclosed side-fix — IP-1010's own Deviation note,
addressing VR-1010-v2's F5 finding). No other production file touched; no excursion into
`GameEngine.ts`, `TurnManager.ts`, or any IP-3010/IP-3011-owned file beyond read-only consumption
of `assertOnline`/`chainRoles`. Matches the package's declared file set precisely.

Separately, `createGameEngine.ts` (IP-5010's later composition root) wires IP-2010's
`registerBeliefDecay` into a real, runnable turn-advance loop, and `createGameEngine.wiring.test.ts`
exercises it end-to-end. I read both files and traced the third wiring-test case by hand: an
`alice-sensor` with `chainRoles: ['fix','track']` tasks `bob-king` once (creating a `'find'`-level
entry — `currentIdx` starts at `-1`, `nextIdx = min(0, ceiling=2, 3) = 0` → `'find'`, correct per
`applyTasking`'s no-existing-entry path), then 6 real `tm.advanceTurn()` calls elapse (turn 1 → 7).
`decayStaleEntries` runs on every turn-end for both players (`registerBeliefDecay`'s hook iterates
`session.players`); at `currentTurn = 7`, `7 - 1 = 6 >= 5`, and since the entry is already at
`'find'` (`idx <= 0`), it is deleted outright on the very next hook firing — matching the test's
assertion that `beliefOfOpponent.has('bob-king')` is `false` afterward. This is a genuine,
correctly-reasoned exercise of IP-2010's own decay logic through the real production wiring, not a
superficial pass or a re-statement of the unit test.

## Deviation note judgment (BL-0028, judged against VR-1010's BL-0021 / VR-3010's BL-0022 model)

Read GDS-09 directly (`docs/architecture/09-interface-specification.md:47`):
`applyTasking(observer: PlayerId, sourceAsset: Asset, targetRegime: OrbitalRegimeLabel, turnNumber:
number): void` — confirmed byte-for-byte as the package's Deviation note describes it (4
parameters). The shipped signature adds exactly two (`observerState: PlayerState`,
`opponentTrueState: PlayerState`) — confirmed by reading `BeliefState.ts:40-47` directly, matching
the note's count precisely; no unstated third parameter, no silent removal of any GDS-09 parameter.

**Is it a real problem?** Yes: `applyTasking` must know (a) which of the observer's own
`BeliefStateEntry` records to read/update, and (b) which of the opponent's assets are actually
present in `targetRegime` to advance a belief about. GDS-09's 4-parameter signature supplies
neither — `observer: PlayerId` is only an identifier, not a handle to either player's `PlayerState`.
Confirmed by inspection: there is no session-store singleton or module-level state anywhere in
`BeliefState.ts` the method could have reached for internally instead.

**Is the alternative worse?** The note's own reasoning — that `BeliefState` reaching into a session
store itself "would blur its module boundary" — holds up: `BeliefState.ts`'s only imports are
`@owchess/shared` types; it holds no reference to `SessionStore` anywhere, keeping it a pure,
independently-testable function module (exactly how `BeliefState.tasking.test.ts` constructs
fixtures directly, with no `SessionStore` in sight). Threading the two states in as parameters
(what `taskAction.ts:42-49` does, having already fetched both via `store.getPlayerState`/
`store.getOpponentState`) is the additive, lowest-footprint option — same shape of tradeoff VR-3010
credited BL-0022 for (a generic hook parameter rather than a reverse-layering import).

**Is it additive-only, and does it corrupt anything already verified?** Yes and no, respectively:
GDS-09's 4 original parameters are all still present, in the same order, with the same types; the
2 new parameters are appended positionally in `applyTasking`'s middle/end rather than replacing
anything. `taskAction.ts` is IP-2010's own file (not a modification of any already-`VERIFIED`
package's file), and no `VERIFIED` package's test suite references `applyTasking`'s signature.

**Is disclosure accurate?** Yes — the note's own text matches what `git show 465a6cb` and the
current GDS-09 text both independently confirm; filed as BL-0028 for
`07-implementation-planning`/GDS-09 to reconcile, the same disposition pattern VR-1010 endorsed for
BL-0021 and VR-3010 endorsed for BL-0022.

**Judgment: reasonable, properly-disclosed, additive-only deviation** — meets the bar set by
VR-1010's BL-0021 and VR-3010's BL-0022 (genuine problem, accurately disclosed, minimal-footprint,
no corruption of already-verified work). This deviation is not why this package is returned.

## Findings

| # | Description | Severity | Owner |
|---|---|---|---|
| F1 | Tasking a sensor whose `chainRoles` contain no F2T2E precision role at all (e.g. an effector-type asset with `chainRoles: []` or a non-precision role only) is not rejected. `BeliefState.applyTasking`'s `ceiling < 0` branch returns silently with no reason; `taskAction.ts`'s `makeTaskHandler` has already spent the sensor's 1 AP before calling `applyTasking`, and unconditionally returns `{ accepted: true }` regardless of `applyTasking`'s outcome. Confirmed live: a `chainRoles: []` asset tasked through the real `GameEngine.handleAction('task', ...)` path returns `{"accepted":true}`, debits 1 AP, and creates zero belief entries. This directly violates FS-103 Acceptance Criterion 4 and its Error Handling section ("Tasking a sensor whose `chainRoles` don't cover the requested chain step at all... rejected — a distinct rejection reason from 'capability ceiling reached'"), which the package's own Verification Checklist marks `[x]` as satisfied. No test in `BeliefState.tasking.test.ts` or `taskAction.test.ts` exercises this case (the closest existing case, "produces no entry when the targeted regime is empty," is a different scenario — a *capable* sensor tasking an *empty* regime, not an *incapable* sensor). | **Critical** | `08-code-implementation` — add an explicit check in `makeTaskHandler` (or a return value from `applyTasking`/a new pure helper) that rejects *before* `tm.spendAP` is called when the sourcing asset's `chainRoles` contain no F2T2E precision role relevant to a tasking action, with a reason distinguishable from the legitimate "ceiling already reached, reading refreshed" no-op (e.g. `"asset has no applicable sensing chainRoles"` vs. no rejection at all for the ceiling case). Add a named regression test for both the effector case and the ceiling-reached-refresh no-op case (FS-103's own W2 edge case: "no-op... `lastUpdatedTurn` updates — but precision doesn't change" is itself untested independently of the ceiling cases, though not itself a defect since the current 3 ceiling tests do implicitly cover the "no advance past ceiling" half; the "refresh resets staleness clock" half of that no-op is not directly asserted anywhere either — worth adding alongside the F1 fix, non-blocking on its own). |

No other findings. Both Definition of Done Implementation Tasks (1–4) and the build/test G5 gates
are solid; the BL-0028 deviation is reasonable and accurately disclosed; scope stayed within the
declared file set; the cross-package `createGameEngine.wiring.test.ts` genuinely and correctly
exercises IP-2010's decay logic end-to-end. F1 alone is sufficient grounds for `RETURNED`.

## Ledger status applied

- `docs/implementation/00-master-build-plan.md`: IP-2010 status stays **`COMPLETE`**, returned to
  `08-code-implementation` with a pointer to this report; "Next action" and prose updated to record
  the return and name F1 as the blocking defect.
- `docs/implementation/packages/INDEX.md`: IP-2010 status stays `COMPLETE` (unchanged — a
  `RETURNED` verification does not advance status), pointer to VR-2010 added.
- `docs/implementation/verification/INDEX.md`: row added for VR-2010.
- RTM: no cells altered — FR-2100/2200/2300/2400 rows were already filled accurately (they name
  real files/tests that do exist); the gap found is in the package's own DoD/Checklist
  self-certification, not a traceability-matrix error.

**Dependency-graph check (does this VR unblock anything toward `READY`):** IP-2010 stays
`COMPLETE`, not `VERIFIED` — **no package flips to `READY` from this VR**. IP-6010 (which names
IP-0010, IP-2010 as its blocking dependencies) and IP-4010 (which names IP-0010, IP-2010, IP-6010)
remain `BLOCKED`, now explicitly still gated on IP-2010's fix-and-reverify cycle, not merely on
"awaiting first verification pass" as before. IP-5010 is unaffected by this VR (separate package,
independently checkable) and was found, in the course of this audit, to already be `COMPLETE` in
the tree with its own `createGameEngine.ts`/`createGameEngine.wiring.test.ts` present — its own
verification is a separate, not-yet-run pass this session did not perform.
