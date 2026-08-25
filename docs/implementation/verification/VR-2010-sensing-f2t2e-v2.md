# VR-2010-v2 — Sensing & the F2T2E Chain (re-verification)

- **Owned by:** `09-package-verification` · **Date:** 2026-08-22

## Package

- **ID:** IP-2010 · **Title:** Sensing & the F2T2E Chain · **Source:** FS-103
- **Commit verified:** `b4be6e6` ("fix(engine): IP-2010 post-verification fix — reject tasking
  with no sensing capability"), on top of the originally-implemented `465a6cb`. Dependencies
  IP-0010, IP-1010, IP-3010, IP-3011 are all `VERIFIED` (VR-0010; VR-1010-v2 supersedes the
  original RETURNED VR-1010 for status purposes; VR-3010; VR-3011).
- **Independence:** this session performed no implementation or fix work on IP-2010. Commit
  `b4be6e6` (the fix under re-verification) predates this session entirely and was authored by a
  prior, separate session (its own `Claude-Session` trailer differs from this one). This session's
  only actions on the tree: read-only inspection, one throwaway diagnostic test file (written, run
  with `npx vitest run`, and deleted before any commit — never part of the tree at commit time),
  and the ledger/report writes this skill is authorized to make. Independence is clean, no caveat
  needed.
- **Concurrent activity note:** at the time of this verification, the shared working tree also
  carried **uncommitted** changes to `server/src/engine/BeliefState.ts` (adding
  `computeOpponentView`/`applyDeception`) and a new untracked
  `server/src/engine/__tests__/BeliefState.fogOfWar.test.ts` — evidently a concurrent session's
  in-progress work on IP-6010 (per IP-2010's own package text, `computeOpponentView` is explicitly
  IP-6010's scope, added to this same file later). This is purely additive to the file (new
  methods appended after IP-2010's own code, confirmed by diff — no line of IP-2010's `applyTasking`
  / `decayStaleEntries` / `hasSensorCapability` was touched) and was not present when this session's
  authoritative build/test run (below) was captured. It has no bearing on IP-2010's own
  verification, which is judged against the committed tree at `b4be6e6` — noted here only for
  transparency about the shared-tree environment.

## Result

**VERIFIED** — VR-2010's Critical finding (F1: an effector-only asset, e.g. `chainRoles: ['engage']`,
silently succeeded a tasking action, debiting 1 AP and creating zero belief entries with no
rejection) is genuinely fixed. `hasSensorCapability(chainRoles)` is a real, correct capability
check (it delegates to the same `capabilityCeiling` logic `applyTasking` itself already used,
returning `true` iff at least one F2T2E precision role — find/fix/track/target — is present), and
`taskAction.ts`'s `makeTaskHandler` now calls it and rejects, with a clear, distinguishable reason,
**before** any AP is spent. Live re-exercise of the exact original failing scenario (an effector
`chainRoles: ['engage']` asset tasked through the real `GameEngine.handleAction('task', ...)` path)
now correctly returns `{accepted:false, reason:...}` with zero AP spent and zero belief entries.
The two new committed tests (`taskAction.test.ts`) correctly distinguish the rejection case from
the legitimate ceiling-reached no-op refresh case, and this session's own independent live
diagnostic — exercising find-only, fix-ceiling, track-ceiling, and (newly) full-chain
(`target`-ceiling) sensors, none of which the previously-committed suite had driven all the way to
`'target'` — confirms none of those legitimate paths were broken by the fix. All Definition of
Done and Verification Checklist items re-derived from scratch hold. Build clean; full suite green
(54 tests: 1 shared + 53 server). Scope of the fix commit matches its declared file set precisely.

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| All 4 Implementation Tasks complete; BL-0009's exact resolved behavior (5-turn window, `'find'`-removal) passes as named test cases | Re-read `BeliefState.ts` in full. Task 1 (`applyTasking` capped at `chainRoles` ceiling): `BeliefState.ts:57` (`capabilityCeiling`), `:67` (`Math.min(currentIdx + 1, ceiling, ...)`) — unchanged by the fix, still correct; confirmed by `BeliefState.tasking.test.ts`'s 3 ceiling cases (find-only, fix-ceiling, track-ceiling), all passing, plus this session's own live diagnostic exercising a 4th (full-chain, `target`-ceiling) case not in any committed fixture. Task 2 (`decayStaleEntries`, 5-turn window, `'find'`-removal): `BeliefState.ts:85-100` — `STALENESS_WINDOW = 5` (`:18`), `idx <= 0` deletes rather than floors (`:89-92`) — unchanged by the fix; `BeliefState.tasking.test.ts`'s 3 decay cases all passing. Task 3 (wired into `handleAction`): `taskAction.ts`'s `makeTaskHandler` registered via `engine.registerHandler('task', ...)`, exercised in `taskAction.test.ts` and end-to-end in `createGameEngine.wiring.test.ts`. Task 4 (decay wired into turn-advance): `registerBeliefDecay` (`taskAction.ts:61-75`) calls `tm.registerTurnEndHook(...)`, exercised end-to-end by `createGameEngine.wiring.test.ts`. | **Pass** — all 4 tasks remain genuinely implemented and tested; unaffected by the fix. |
| FS-103 Acceptance Criterion 4 / Error Handling: tasking a sensor with no relevant `chainRoles` at all is rejected with a distinguishable reason from a legitimate ceiling-reached no-op | Re-read `BeliefState.ts:24-31`: `hasSensorCapability(chainRoles)` is exported and delegates to the same `capabilityCeiling(chainRoles) >= 0` check `applyTasking` already used internally — not a stub, not a hardcoded `true`/`false`, a real re-derivation of the identical ceiling logic. Re-read `taskAction.ts:36-38`: `makeTaskHandler` calls `hasSensorCapability(source.chainRoles)` and, if false, `return { accepted: false, reason: '... has no F2T2E sensing capability ...' }` — this check runs **before** `assertOnline` (`:41-42`) and **before** `tm.spendAP` (`:45`), confirmed by direct line-order reading of the function body: capability check (`:36-38`) → online check (`:41-42`) → AP spend (`:45`) → `applyTasking` (`:48-55`). Live-exercised myself: wrote a throwaway diagnostic tasking a `chainRoles: ['engage']` asset through the real `GameEngine.handleAction('task', ...)` path — result `{"accepted":false,"reason":"eff1 has no F2T2E sensing capability (chainRoles has no find/fix/track/target role)"}`, AP unchanged (5→5), zero belief entries. Also tested `chainRoles: []` (empty) — same correct rejection. Deleted the diagnostic file before this report; it was never committed. | **Pass** — genuinely fixed, live-confirmed, and ordered correctly ahead of AP spend. |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: build clean | Ran myself from repo root: `npm run build` → `tsc -b` clean in `shared`, `server`; `tsc -b && vite build` clean in `client` (29 modules, 1.02s). No errors. | Pass |
| G5 gate: full test suite passes (package's claim: "54 total as of this re-submission: 1 shared + 53 server, incl. this package's own 11") | Ran myself: `npm test` → shared **1/1** (`types.smoke.test.ts`); server **11 files, 53/53** (`BeliefState.tasking.test.ts` 7, `taskAction.test.ts` 4 [2 new: rejection case + ceiling-reached no-op case], `deployAction.test.ts` 4, `SessionStore.test.ts` 5, `Propagator.maneuverCost.test.ts` 8, `createGameEngine.wiring.test.ts` 3, `GameEngine.winConditions.test.ts` 7, `TurnManager.test.ts` 4, `contentTemplates.test.ts` 4, `Propagator.propagation.test.ts` 3, `TemplateRegistry.test.ts` 4); client 0 test files (expected). **Full-suite total: 54** (1 shared + 53 server) — matches the package's own claim exactly. | Pass |
| FS-103 Acceptance Criteria mapped to passing tests | AC1 (1 AP + record/update) → `taskAction.test.ts` "creates a belief entry, deducting 1 AP" — passing. AC2 (ceiling never exceeded) → `BeliefState.tasking.test.ts`'s 3 ceiling cases, plus this session's own live full-chain (`target`) diagnostic — passing. AC3 (5-turn decay, `'find'`-removal) → `BeliefState.tasking.test.ts`'s 3 decay cases — passing. **AC4 (offline sensor OR no-relevant-`chainRoles` sensor rejected, with distinguishable reasons)**: offline half covered via `assertOnline` (unchanged, pre-existing); no-relevant-`chainRoles` half now covered by `taskAction.test.ts`'s "rejects tasking with an effector-only asset (no sensing chainRoles) — VR-2010 F1" (asserts `accepted:false`, reason matches `/no F2T2E sensing capability/`, AP unchanged, zero belief entries) **and** distinguished from the legitimate ceiling-reached no-op by "a legitimate ceiling-reached re-task is accepted as a no-op refresh, not rejected" (asserts `accepted:true`, precision still capped at `'track'`) — both read directly and confirmed passing, and both independently re-confirmed live by this session's own diagnostic (which additionally covered `chainRoles: []` and a full-chain `target`-ceiling case neither committed test drives). | **Pass** — AC4 is now fully mapped and both halves are genuinely distinguishable, live-confirmed. |
| Capability-ceiling enforcement verified for a `find`-only, a `fix`-ceiling, and a `track`-ceiling sensor | `BeliefState.tasking.test.ts`'s 3 cases read and confirmed passing (unchanged by the fix). This session additionally live-exercised a 4th case (full-chain, `chainRoles: ['find','fix','track','target']`) through the real dispatch path and confirmed it correctly advances all the way to `'target'` — not previously exercised by any committed fixture, and not broken by the fix. | Pass (and independently extended) |

## Requirements audit (Requirements Covered)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-2100 (task a sensor, 1 AP) | `taskAction.ts` (`makeTaskHandler`) | `taskAction.test.ts` | RTM row: FS-103, IP-2010, `BeliefState.tasking.test.ts` / `taskAction.test.ts` — filled, accurate | Pass |
| FR-2200 (precision gated by capability) | `BeliefState.ts` (`capabilityCeiling`, `applyTasking`) | `BeliefState.tasking.test.ts` (3 ceiling cases) + this session's live full-chain diagnostic | RTM row filled, accurate | Pass |
| FR-2300 (staleness/decay) | `BeliefState.ts` (`decayStaleEntries`) | `BeliefState.tasking.test.ts` (3 decay cases) + `createGameEngine.wiring.test.ts`'s end-to-end decay case | RTM row filled, accurate | Pass |
| FR-2400 (reflect precision/staleness to UI) | Not this package's scope | — | RTM row correctly reads `IP-8010 (pending)`, `UNASSIGNED` | Pass (correctly out of scope) |

`docs/requirements/04-requirements-traceability-matrix.md` rows for FR-2100/2200/2300/2400 read
directly (lines 26-29) — all already accurate; no cell required correction.

## Test run

Exact commands run by this verification session, from repo root (`node_modules` already present,
`npm install` not needed):

```
npm run build
```
→ `tsc -b` clean in `shared`; `tsc -b` clean in `server`; `tsc -b && vite build` clean in `client`
(29 modules transformed, built in 1.02s). No errors, no warnings.

```
npm test
```
→ shared: **1 passed (1)**. server: **11 files, 53 passed (53)** — `BeliefState.tasking.test.ts` 7,
`taskAction.test.ts` 4, `deployAction.test.ts` 4, `SessionStore.test.ts` 5,
`Propagator.maneuverCost.test.ts` 8, `createGameEngine.wiring.test.ts` 3,
`GameEngine.winConditions.test.ts` 7, `TurnManager.test.ts` 4, `contentTemplates.test.ts` 4,
`Propagator.propagation.test.ts` 3, `TemplateRegistry.test.ts` 4. client: 0 test files, exits 0
(expected).

**Full-suite total: 54** (1 shared + 53 server) — exactly matching the package's own claim.

**Live re-exercise of the fixed scenario (mandatory per the skill's gotcha, since the original
defect was itself a fixture-masked case):**

```
npx vitest run server/src/engine/__tests__/VR2010v2.diagnostic.test.ts   # throwaway, deleted after
```

Six cases, all passing:
1. Effector-only (`chainRoles: ['engage']`) tasked via `GameEngine.handleAction('task', ...)`:
   `{"accepted":false,"reason":"eff1 has no F2T2E sensing capability (chainRoles has no
   find/fix/track/target role)"}`, AP unchanged (5→5), 0 belief entries. **This is the exact
   scenario VR-2010's F1 found broken — now correctly rejected.**
2. Empty `chainRoles: []`: also correctly rejected, same code path.
3. Find-only sensor (`chainRoles: ['find']`): repeated tasking accepted, capped at `'find'`.
4. Fix-ceiling sensor (`chainRoles: ['find','fix']`): advances to `'fix'`, capped correctly.
5. Full-chain sensor (`chainRoles: ['find','fix','track','target']`): advances all the way to
   `'target'` over repeated tasking — a ceiling value no committed fixture drives to, confirmed
   correct here.
6. Track-ceiling sensor, re-tasked after reaching `'track'`: `{"accepted":true}`, AP still spent
   (2→1), precision still `'track'` — confirms the legitimate no-op refresh case remains distinct
   from, and unbroken by, the new rejection path.

The diagnostic file was written, run, and deleted before this report was written and before any
commit; it was never part of the tree at commit time (`git status --short` confirms a clean tree
with respect to this session's own actions, modulo the concurrent-session IP-6010 activity noted
above).

## Scope audit

`git show --stat b4be6e6` (the fix commit) touched exactly: `server/src/engine/BeliefState.ts`
(+9 lines: the `hasSensorCapability` export), `server/src/engine/taskAction.ts` (+8/-1: the
pre-AP-spend check and its import), `server/src/engine/__tests__/taskAction.test.ts` (+50: the two
new regression tests), plus documentation files (`IP-2010-sensing-f2t2e.md`'s Post-verification
fix section, Master Build Plan, `packages/INDEX.md`, backlog). No other production file touched;
no excursion into `GameEngine.ts`, `TurnManager.ts`, `SessionStore.ts`, or any IP-3010/IP-3011-owned
file. Matches the fix's declared scope (a minimal, targeted patch to the two files VR-2010's
finding named) precisely.

## Findings

No findings. VR-2010's sole Critical finding (F1) is genuinely and correctly fixed: the capability
check is real (not a stub), runs strictly before AP is spent, is exercised by two new committed
regression tests that correctly distinguish rejection from the legitimate no-op, and this session's
own independent live re-exercise — covering both the original failing scenario and previously-
untested legitimate ceiling values (empty roles, full-chain to `'target'`) — confirms the fix
without discovering any new defect or regression.

## Ledger status applied

- `docs/implementation/00-master-build-plan.md`: IP-2010 status advanced `COMPLETE` → **`VERIFIED`**
  (VR-2010-v2). Dependency-graph note updated: IP-6010 (names IP-0010, IP-2010 as blocking
  dependencies — both now `VERIFIED`) — found already `COMPLETE` in the tree at verification time
  (implemented concurrently by another session, ahead of this ledger's prior sequencing
  expectation, the same pattern already recorded for IP-5010); with both its blocking dependencies
  now `VERIFIED`, IP-6010 is the next package eligible for its own `09-package-verification` pass.
  IP-4010 (names IP-0010, IP-2010, IP-6010) stays `BLOCKED` — IP-6010 is not yet `VERIFIED`.
- `docs/implementation/packages/INDEX.md`: IP-2010 row status advanced to `VERIFIED`, pointer to
  VR-2010-v2 added.
- `docs/implementation/verification/INDEX.md`: row added for VR-2010-v2.
- RTM: no cells altered — FR-2100/2200/2300/2400 rows were already filled accurately.

**Dependency-graph check (does this VR unblock anything toward `READY`):** IP-2010 is now
`VERIFIED`. **IP-6010** names IP-0010 (`VERIFIED`, VR-0010) and IP-2010 (now `VERIFIED`,
VR-2010-v2) as its sole blocking dependencies — both now satisfied. IP-6010 itself was found
already `COMPLETE` in the tree at verification time (a concurrent session's implementation work,
observed mid-audit as the uncommitted `computeOpponentView`/`applyDeception` additions to
`BeliefState.ts` noted above) — with both dependencies now `VERIFIED`, it is the next package
eligible for its own `09-package-verification` pass; this VR does not itself verify IP-6010's
implementation. IP-4010 (IP-0010, IP-2010, IP-6010) remains `BLOCKED`: IP-6010 is not yet
`VERIFIED`. IP-4011 (depends on IP-4010) and IP-7010 (depends on IP-0010, IP-1010, IP-6010) remain
`BLOCKED` for the same reason. IP-5010 is unaffected by this VR (separate package, already
`VERIFIED` per VR-5010, found in the ledger at verification time).
