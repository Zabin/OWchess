# VR-6010 — Fog-of-War Enforcement

- **Owned by:** `09-package-verification` · **Date:** 2026-08-22

## Package

- **ID:** IP-6010 · **Title:** Fog-of-War Enforcement · **Source:** FS-106
- **Commit verified:** `b5f0141` ("feat(engine): implement IP-6010, fog-of-war enforcement").
  Dependencies IP-0010 (`VERIFIED`, VR-0010) and IP-2010 (`VERIFIED`, VR-2010-v2, `df1c718`) are
  both satisfied as of this session's start.
- **Independence:** this session performed no implementation work on IP-6010. Commit `b5f0141`
  predates this session (its `Claude-Session` trailer names a different session) and its content
  was verified purely by reading. This session's only tree actions: read-only inspection, one
  throwaway diagnostic test file (`VR6010.diagnostic.test.ts`, written, run with `npx vitest run`,
  and deleted before this report — never committed), a temporary `git worktree` at `HEAD`
  (`b5f0141`'s descendant, `df1c718`) used only to get a clean build/test run isolated from other
  concurrent sessions' uncommitted edits, and the ledger/report writes this skill is authorized to
  make. Independence is clean, no caveat needed.
- **Concurrent activity note:** at audit time the shared working tree also carried **uncommitted**
  changes unrelated to IP-6010: modified `TurnManager.ts`/`createGameEngine.ts` and new, untracked
  `EffectResolver.ts`/`engageAction.ts` (evidently a concurrent session's in-progress IP-4010 work;
  `packages/INDEX.md`'s uncommitted edit already marks IP-4010 `COMPLETE`), plus this same
  uncommitted `00-master-build-plan.md`/`packages/INDEX.md` diff. These changes broke `npm run
  build` in the live working tree (a `TurnEndHook` arity mismatch in the in-progress
  `createGameEngine.ts` edit) — a defect in that concurrent, uncommitted work, not in IP-6010. To
  judge IP-6010 cleanly, this session ran the build/test gates in an isolated `git worktree`
  checked out at `HEAD` (commit `df1c718`, which already includes `b5f0141`) rather than against
  the live, partially-edited working tree; the worktree was removed after use and no working-tree
  files were touched or discarded by this maneuver. This is noted for transparency only — it has
  no bearing on IP-6010's own result.

## Result

**VERIFIED** — Both Definition of Done items hold under independent re-derivation, not just a
re-read of the Implementation Summary. `computeOpponentView` is confirmed, by reading
`BeliefState.ts` line-by-line, to read only `observerState.beliefOfOpponent` (never
`trueOpponentState.assets`/`.king`/`.activeEffects`) and to return the GDS-07 `OpponentView` shape,
which is structurally incapable of carrying a `PlayerState`'s fields. `applyDeception` is confirmed
to write only to `observerState.beliefOfOpponent`, never touching the `subject`'s own `Asset`
object. This session independently re-ran the package's own supersession sweep (Implementation
Task 3) from scratch rather than trusting its "found nothing else, confirmed clean" claim, and
independently reached the same conclusion — see the Supersession sweep section below. This session
also live-exercised both enforcement boundaries with its own constructed scenarios beyond the
committed test file's coverage (an observer with **zero** belief entries against an opponent
holding wholly untasked, even-destroyed assets and a King; an attempt to corrupt the observer's map
or the true opponent state by mutating the returned `OpponentView`; a byte-for-byte
before/after-snapshot check on the deceived subject's true `Asset`) — all three held. Build clean;
full suite green (57 tests: 1 shared + 56 server, exactly matching the package's own claim). The
BL-0033 deviation note is accurate and reasonable for `computeOpponentView` but **incomplete** for
`applyDeception` — see the Deviation note judgment below (a Low, non-blocking finding, not grounds
for `RETURNED`).

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| `computeOpponentView` is the only function in the codebase constructing opponent-facing data | Re-read `BeliefState.ts:104-120` in full: the method body is exactly `{ playerId: trueOpponentState.playerId, beliefEntries: Array.from(observerState.beliefOfOpponent.values()) }` — it reads `trueOpponentState.playerId` (a bare identifier, not asset/king/effect data) and `observerState.beliefOfOpponent` only; no reference to `trueOpponentState.assets`, `.king`, or `.activeEffects` appears anywhere in the method or the file. Independently re-ran the supersession sweep (below) across the whole `server/src` tree — confirmed no other construction site exists. | **Pass** |
| `applyDeception` never mutates true state | Re-read `BeliefState.ts:128-145`: the method takes `subject: AssetId` (an identifier, not an `Asset` reference) and writes only to `observerState.beliefOfOpponent.set(subject, entry)` — it never receives or dereferences the subject's actual `Asset` object, so it is structurally incapable of touching it (not merely "chooses not to"). Own live diagnostic: constructed a `trueAsset` object, JSON-snapshotted it before calling `applyDeception`, called it, and confirmed the post-call JSON snapshot is byte-identical (not just two named fields, the whole object). Committed test (`BeliefState.fogOfWar.test.ts:70-83`) independently confirms the same via `trueRegime`/`destroyed` field checks. | **Pass** |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: build clean | Ran from a clean `git worktree` at `HEAD` (`df1c718`): `npm install` (178 packages), then `npm run build` — `tsc -b` clean in `shared`/`server`; `tsc -b && vite build` clean in `client` (29 modules, 1.36s). No errors. (The live working tree's own `npm run build` fails, but only due to a concurrent, uncommitted IP-4010-in-progress edit to `createGameEngine.ts` — see Concurrent activity note above; not an IP-6010 defect.) | Pass |
| G5 gate: full test suite passes (package's claim: "57 total: 1 shared + 56 server, incl. this package's 3 in `BeliefState.fogOfWar.test.ts`") | Ran from the same clean worktree: `npm test` → shared **1/1**; server **12 files, 56/56** (`BeliefState.tasking.test.ts` 7, `taskAction.test.ts` 4, `deployAction.test.ts` 4, `BeliefState.fogOfWar.test.ts` 3, `Propagator.maneuverCost.test.ts` 8, `createGameEngine.wiring.test.ts` 3, `SessionStore.test.ts` 5, `GameEngine.winConditions.test.ts` 7, `contentTemplates.test.ts` 4, `TurnManager.test.ts` 4, `Propagator.propagation.test.ts` 3, `TemplateRegistry.test.ts` 4); client 0 test files (expected). **Full-suite total: 57** (1 + 56) — matches the package's own claim exactly. | Pass |
| FS-106 Acceptance Criteria mapped to passing tests | AC1 (every `StateDeltaMessage.opponentView` traces to `computeOpponentView`): confirmed vacuously true by grep — no code anywhere in `server/src` production code constructs a `StateDeltaMessage` yet (transport, IP-7010, is still `BLOCKED`/unimplemented), so there is no construction site to violate this criterion; will need re-checking once IP-7010 lands (the package's own Verification Checklist already flags this for `10-integration-review`). AC2 (no client code accepts/derives an opponent `PlayerState`-shaped object): confirmed vacuously true — `client/src` has no non-scaffold code (`grep` for `PlayerState`/`OpponentView` in `client/src` returns nothing). AC3 (a centrally-run fog-of-war suite exercising every other Feature's data): `BeliefState.fogOfWar.test.ts` currently exercises `BeliefState` in isolation with hand-built fixtures, not the real output of FS-101–105's other modules — a genuine partial state, but the package's own Verification Checklist explicitly and accurately flags this ("flagged in this doc for `10-integration-review` to re-check whenever any later package... touches `BeliefState`/transport"), so this is disclosed scoping, not a hidden gap. | **Pass** — both hard ACs hold (vacuously, appropriately for the current build order); the partial-AC3 state is honestly disclosed, not a defect. |
| Centrally-run test suite flagged for `10-integration-review` | Confirmed the flag text is present in the package's own Verification Checklist (line 87-89) and is an accurate description of the suite's current, intentionally-partial scope. | Pass (disclosure honest) |

## Supersession sweep — independent re-audit (Implementation Task 3)

The package's own claim: "`grep -rn "OpponentView\|beliefOfOpponent\|opponentTrueState" server/src`
(excluding tests): the only other reader of `opponentTrueState`'s raw assets is `applyTasking`...
`GameEngine.ts`, `deployAction.ts`, `taskAction.ts`, `maneuverAction.ts`, `Propagator.ts` hold no
independent opponent-data-construction logic. Found nothing else — confirmed clean."

This session independently re-ran the sweep from scratch rather than trusting that text:

```
grep -rn "OpponentView\|beliefOfOpponent\|opponentTrueState\|applyDeception\|computeOpponentView" \
  server/src --include="*.ts" | grep -v __tests__
```

Result (12 lines): `SessionStore.ts:42` (`beliefOfOpponent: new Map()` — state initialization,
not construction of opponent-facing output); `EffectResolver.ts` (three lines — a doc-comment
referencing `beliefOfOpponent`/BL-0028/BL-0033's pattern, and its `resolveEngagement` method
reading `effectorObserverState.beliefOfOpponent.get(...)` to gate on precision, plus a legitimate
call to `beliefState.applyDeception(...)` on the Deceive path — this is the correct, sole caller of
`applyDeception` outside `BeliefState.ts` itself, and it never constructs an `OpponentView` or
touches `target`'s own true fields beyond the destroy-path's `target.destroyed = true`, which is
`EffectResolver`'s own documented Destroy responsibility, structurally distinct from Deceive); the
remaining 9 lines are all within `BeliefState.ts` itself (`applyTasking`'s legitimate internal read
of `opponentTrueState.king`/`.assets` to build belief entries — server-internal, never client-
facing — plus `computeOpponentView`/`applyDeception`'s own bodies).

This session then went one step further than the package's own sweep (which only grepped three
identifiers) and independently read **every file in `server/src` that touches `PlayerState`**
(the broader instruction, since a second construction site need not literally use the string
`OpponentView` to be a leak): `EffectResolver.ts`, `__tests__/BeliefState.fogOfWar.test.ts`,
`BeliefState.ts`, `__tests__/taskAction.test.ts`, `taskAction.ts`,
`__tests__/createGameEngine.wiring.test.ts`, `maneuverAction.ts`,
`__tests__/BeliefState.tasking.test.ts`, `SessionStore.ts`, `__tests__/deployAction.test.ts`,
`TurnManager.ts`, `deployAction.ts`. None of the non-test files construct, serialize, or return an
opponent-facing view of any kind — `taskAction.ts`/`deployAction.ts`/`maneuverAction.ts` all
operate on the *acting* player's own state and return `{accepted, reason?}`-shaped local results;
`TurnManager.ts`/`SessionStore.ts` manage turn/session bookkeeping with no serialization boundary
at all. Also confirmed no `StateDeltaMessage`/`opponentView`/`ownState` construction exists
anywhere yet (`grep -rn "opponentView\|StateDeltaMessage\|ownState" server/src --include="*.ts"`
excluding tests returns nothing) — consistent with IP-7010 (transport) still being unimplemented.

**Independent conclusion: confirmed clean.** No second construction site exists. `EffectResolver.ts`
(not yet an authorized, `VERIFIED` package's file — it belongs to the still-`BLOCKED`/in-progress
IP-4010, present in the tree ahead of its own verification, the same pattern already seen with
IP-5010/IP-6010 landing ahead of sequencing) is a legitimate, correctly-scoped consumer of
`applyDeception`, not a rival construction site.

## Live-exercise of the fog-of-war boundary (independent, beyond the committed test file)

Wrote and ran (then deleted, never committed) `VR6010.diagnostic.test.ts`, three cases:

1. **Zero-belief observer vs. a fully-populated secret opponent.** `observerState.beliefOfOpponent`
   left empty; `trueOpponentState` given two assets never tasked by anyone (`bob-secret-1`,
   `bob-secret-2`, the latter `destroyed: true`) plus its own King. `computeOpponentView` returned
   `{ playerId: 'bob', beliefEntries: [] }` — `Object.keys(view)` is exactly
   `['playerId', 'beliefEntries']` (no stray fields), and `JSON.stringify(view)` contains neither
   `bob-secret-1`, `bob-secret-2`, nor `bob-king` anywhere in the serialized output — confirming the
   non-leakage at the object-shape level, not merely an array-length check.
2. **Object-identity check.** Mutated the returned `view.beliefEntries` array (pushed a fabricated
   entry) after the call and confirmed `observerState.beliefOfOpponent.size` was unaffected (still
   1) — the returned array is `Array.from(...)`'s fresh copy, not a live reference into the
   observer's own map, so a caller mutating the outbound view cannot corrupt server-side belief
   state. Also confirmed `trueOpponentState.assets[0].trueRegime` was unaffected by any of this.
3. **`applyDeception` true-state isolation, snapshot-based.** Built a `trueAsset`, took a full
   `JSON.stringify` snapshot before calling `applyDeception(observerState, trueAsset.assetId, ...)`,
   and confirmed the post-call snapshot is **byte-identical** — a stronger check than asserting two
   named fields unchanged, since it also covers every other field on the `Asset` (e.g. `basing`,
   `chainRoles`, `maneuverState`, `activeEffects`) that a narrower test wouldn't touch.

All three passed. Combined with the committed test file's own three cases (untasked-asset
exclusion, deception corrupting only the observer's entry, deception preserving existing precision
rather than resetting it), the enforcement boundary is confirmed both by the package's own tests
and by this session's independently-constructed scenarios.

## Deviation note judgment (BL-0033, judged against VR-2010's BL-0028 / VR-1010's BL-0021 / VR-3010's BL-0022 model)

Read GDS-09 directly (`shared/src/interfaces.ts:38-56`, which the project transcribes verbatim
from `docs/architecture/09-interface-specification.md`):

- `computeOpponentView(observer: PlayerId, trueOpponentState: PlayerState, turnNumber: number):
  OpponentView` — 3 parameters.
- `applyDeception(observer: PlayerId, subject: AssetId, falseRegime: OrbitalRegimeLabel): void` —
  3 parameters.

Shipped (`BeliefState.ts:111-144`):

- `computeOpponentView(observer, observerState, trueOpponentState, _turnNumber)` — 4 parameters.
  **Matches the note precisely**: `observer` and `trueOpponentState`/`turnNumber` are all retained
  in the same relative roles, and exactly one new parameter (`observerState: PlayerState`) is
  appended. Purely additive — no GDS-09 parameter removed or repurposed.
- `applyDeception(observerState, subject, falseRegime, turnNumber, sourceAssetId)` — 5 parameters.
  **Does not fully match the note.** The note says only "an added `observerState: PlayerState`
  parameter... plus `sourceAssetId`," but two things are true of the shipped signature that the
  note does not say: (a) GDS-09's `observer: PlayerId` parameter is **not retained** — it is
  replaced by `observerState: PlayerState` rather than supplemented by it (unlike
  `computeOpponentView`, which keeps both); (b) `turnNumber` is a **wholly new** parameter with no
  GDS-09 counterpart at all (GDS-09's `applyDeception` has no turn-number parameter of any kind),
  and the note never mentions it.

**Is it a real problem, functionally?** No — both omissions are benign and arguably necessary:
`observerState.playerId` already carries what a separate `observer: PlayerId` parameter would have
supplied, so dropping it is not a capability loss; `turnNumber` is genuinely required to populate
`BeliefStateEntry.lastUpdatedTurn` on the corrupted entry (confirmed by reading
`BeliefState.ts:139`), which no other parameter could supply. Both are exactly the same root cause
the note names (BL-0028: GDS-09's pseudocode omits the state/turn-access parameters `BeliefState`'s
methods actually need) — the note's overall diagnosis is correct even though its enumeration of the
delta is incomplete for this one method.

**Is disclosure accurate?** Partially. The note is accurate and complete for
`computeOpponentView`. For `applyDeception` it undercounts the actual signature delta — it reads as
"one parameter added" when the real change is "one parameter added, one parameter substituted for a
different-shaped one, and one parameter added with no disclosure at all." This is the same category
of issue VR-1010's F5 flagged (a fix's change-description accurate in substance but imprecise about
*how* the change was made) — non-blocking, but worth correcting so `07-implementation-planning`'s
BL-0033/GDS-09 reconciliation pass works from a complete picture rather than being surprised by
`turnNumber`'s presence when it reconciles the interface.

**Judgment: substantively reasonable and additive-only in effect, but the disclosure itself is
incomplete for `applyDeception`** — see Finding F1 below. This does not change the VR's overall
result; the deviation's *substance* clears the same bar VR-2010/VR-3010/VR-1010 applied (a real
problem, a defensible minimal-footprint fix, no corruption of already-`VERIFIED` work), only its
*written disclosure* falls short for one of the two methods.

## Requirements audit (Requirements Covered)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-6100 (server-only ground truth) | `BeliefState.computeOpponentView` reads only `observerState.beliefOfOpponent`; no client code exists to violate the negative requirement (client is a scaffold) | `BeliefState.fogOfWar.test.ts` + this session's own zero-belief/object-identity diagnostics | RTM row (line 44): filled, accurate | Pass |
| FR-6200 (belief-filtered outbound messages only) | `computeOpponentView` is the sole constructor of `OpponentView`; no `StateDeltaMessage` construction exists yet anywhere (IP-7010 not started) so this is currently satisfied vacuously, pending IP-7010's own wiring | `BeliefState.fogOfWar.test.ts` (structural-shape assertions) | RTM row (line 45): filled, accurate; correctly does not overclaim transport-level enforcement not yet built | Pass |
| NFR-3100 (fog-of-war non-leakage) | `computeOpponentView`/`applyDeception`, structurally incapable of reading/writing true opponent asset data (identifiers only, no object references) | `BeliefState.fogOfWar.test.ts` + independent supersession-sweep re-audit (Inspection) + this session's own live-exercise scenarios | RTM row (line 61): filled, accurate, correctly names "supersession sweep, Inspection" as a second verification mechanism alongside the test file | Pass |

`docs/requirements/04-requirements-traceability-matrix.md` rows for FR-6100/FR-6200/NFR-3100 read
directly — all already accurate; no cell required correction.

## Test run

Exact commands, run from a temporary `git worktree` checked out at `HEAD` (`df1c718`) to isolate
this run from concurrent, uncommitted, unrelated edits in the shared working tree (see Concurrent
activity note):

```
git worktree add <scratch-path> HEAD
cd <scratch-path>
npm install
npm run build
npm test
git worktree remove <scratch-path>   # (from the original working tree, after)
```

`npm run build` → `tsc -b` clean in `shared`/`server`; `tsc -b && vite build` clean in `client`
(29 modules, 1.36s). No errors.

`npm test` → shared: **1 passed (1)**. server: **12 files, 56 passed (56)** —
`BeliefState.tasking.test.ts` 7, `taskAction.test.ts` 4, `deployAction.test.ts` 4,
`BeliefState.fogOfWar.test.ts` 3, `Propagator.maneuverCost.test.ts` 8,
`createGameEngine.wiring.test.ts` 3, `SessionStore.test.ts` 5, `GameEngine.winConditions.test.ts` 7,
`contentTemplates.test.ts` 4, `TurnManager.test.ts` 4, `Propagator.propagation.test.ts` 3,
`TemplateRegistry.test.ts` 4. client: 0 test files, exits 0 (expected).

**Full-suite total: 57** (1 shared + 56 server) — exactly matching the package's own claim.

Additionally ran, in the live working tree, then deleted before this report (never committed):

```
npx vitest run server/src/engine/__tests__/VR6010.diagnostic.test.ts
```

3 tests, all passing — see Live-exercise section above for what each covers.

## Scope audit

`git show --stat b5f0141` (the implementing commit) touched: `server/src/engine/BeliefState.ts`
(+44: the two new methods, exactly the file IP-2010 created, no other module edited — matches
"Files to Create/Modify"), `server/src/engine/__tests__/BeliefState.fogOfWar.test.ts` (new, +104),
plus documentation/traceability files (`FS-106-fog-of-war-enforcement.md`,
`00-master-build-plan.md`, `packages/INDEX.md`, `IP-6010-fog-of-war-enforcement.md`,
`04-requirements-traceability-matrix.md`, `docs/pipeline/backlog.md`) and an unrelated
`VR-5010-propagator.md` addition (a prior package's verification report landing in the same commit
— journaling/ledger housekeeping, not a code excursion). No excursion into `GameEngine.ts`,
`taskAction.ts`, `deployAction.ts`, `maneuverAction.ts`, `Propagator.ts`, or any other
already-`VERIFIED` package's file. Matches the package's declared file set precisely.

## Findings

| # | Description | Severity | Owner |
|---|---|---|---|
| F1 | BL-0033's Deviation note is accurate and complete for `computeOpponentView` (exactly one parameter added, `observerState`, with all three GDS-09 parameters otherwise retained) but incomplete for `applyDeception`: the shipped signature also (a) replaces GDS-09's `observer: PlayerId` parameter with `observerState: PlayerState` rather than retaining it alongside the addition (unlike `computeOpponentView`'s purely-additive pattern), and (b) adds a `turnNumber: number` parameter with no GDS-09 counterpart at all and no mention in the note. Both changes are functionally benign and serve the same root cause the note already names (GDS-09's pseudocode omits state/turn-access parameters `BeliefState`'s methods need), but the written disclosure undercounts the actual delta, which could mislead `07-implementation-planning`'s eventual GDS-09/BL-0033 reconciliation pass about what `applyDeception`'s real final shape needs to be reconciled to. | Low | `07-implementation-planning` — when reconciling BL-0033 (alongside BL-0028) against GDS-09, use `applyDeception`'s actual 5-parameter shipped signature (`observerState, subject, falseRegime, turnNumber, sourceAssetId`) as the source of truth rather than the note's undercount; no code change needed, this is a documentation-completeness note only. Non-blocking. |

No other findings. Both Definition of Done items and both Verification Checklist G5 gates are
solid; the supersession sweep is independently reproduced clean; both enforcement boundaries were
live-exercised beyond the committed test file's coverage with no leak found; scope stayed within
the declared file set.

## Ledger status applied

- `docs/implementation/00-master-build-plan.md`: IP-6010 status advanced `COMPLETE` → **`VERIFIED`**
  (VR-6010). Dependency-graph notes updated: **IP-7010** (names IP-0010, IP-1010, IP-6010 — all
  three now `VERIFIED`) flips `BLOCKED` → **`READY`**. **IP-4010** (names IP-0010, IP-2010, IP-6010
  — all three now `VERIFIED`) has its dependency gate fully satisfied, but this session found it
  already `COMPLETE` in the shared working tree (an uncommitted, concurrent implementation pass, not
  yet part of any commit this VR judges) — so it is not flipped to `READY` here (it is already past
  that state, pending its own commit and then its own `09-package-verification` pass); this VR does
  not itself audit IP-4010's implementation. **IP-4011** (depends on IP-4010, still not `VERIFIED`)
  and **IP-8010** (depends on all 10 others) remain `BLOCKED`.
- `docs/implementation/packages/INDEX.md`: IP-6010 row status advanced to `VERIFIED`, pointer to
  VR-6010 added.
- `docs/implementation/verification/INDEX.md`: row added for VR-6010.
- RTM: no cells altered — FR-6100/FR-6200/NFR-3100 rows were already filled accurately.

**Dependency-graph check (does this VR unblock anything toward `READY`):** IP-6010 is now
`VERIFIED`. **IP-7010** names IP-0010 (`VERIFIED`), IP-1010 (`VERIFIED`), and IP-6010 (now
`VERIFIED`) as its sole blocking dependencies — all three now satisfied — **IP-7010 flips to
`READY`**, the next package eligible for `08-code-implementation`. **IP-4010** names IP-0010,
IP-2010, IP-6010 — all three now `VERIFIED` — its dependency gate is also fully satisfied, but it
was found already `COMPLETE` (uncommitted, concurrent implementation) rather than awaiting a
`READY` flip; once that work is committed, it is the next package eligible for its own
`09-package-verification` pass. **IP-4011** (depends on IP-4010) remains `BLOCKED` until IP-4010 is
`VERIFIED`. **IP-8010** remains `BLOCKED` (needs all 10 other packages `VERIFIED`).
