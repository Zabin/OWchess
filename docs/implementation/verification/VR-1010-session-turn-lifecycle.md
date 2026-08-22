# VR-1010 — Session & Turn Lifecycle

- **Owned by:** `09-package-verification` · **Date:** 2026-08-22

## Package

- **ID:** IP-1010 · **Title:** Session & Turn Lifecycle · **Source:** FS-101
- **Commit verified:** `7568b56` ("feat(engine): implement IP-1010, session & turn lifecycle")
- **Independence:** this verification session performed no implementation work on IP-1010; the
  implementing commit (`7568b56`) predates this session entirely. Independence is clean, no
  caveat needed.

## Result

**RETURNED** — 1 hard-fail (Critical) requirement violation, 1 traceability gap (Medium), plus
two Low informational notes. Returned to `08-code-implementation` (status: back to `IN PROGRESS`).

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| All 5 Implementation Tasks complete; all 4 win-condition paths independently testable and passing, incl. BL-0012 ordering | `SessionStore.ts` (create/join/King deployment), `TurnManager.ts` (activePlayer/apRemaining/submitAction/advanceTurn), `GameEngine.ts` (`checkWinConditions`, `handleAction`). `GameEngine.winConditions.test.ts` — 7/7 passing, including the BL-0012 destruction-vs-timeout case (line 54-60). | Pass |
| `handleAction` dispatch shell compiles, routes to stubs; `registerHandler` accepts injected handlers; unregistered type rejected with a clear reason | `GameEngine.ts:35-37` (`registerHandler`), `:72-75` (rejects unregistered type with `no handler registered for action type '${action.type}'`). Confirmed by reading, not by trusting the summary. | Pass |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: `npm run build` clean | Re-ran myself: `npm run build` (root) → `tsc -b` clean in `shared`, `server`, and `client` (`vite build` also clean, 29 modules). | Pass |
| G5 gate: `npm test` full suite passes (package claims 16: 1 shared smoke + 15 server) | Re-ran myself: `npm test` (root). Shared: 1/1. Server: **23/23** across 5 files (`SessionStore.test.ts` ×4, `TurnManager.test.ts` ×4, `GameEngine.winConditions.test.ts` ×7 — IP-1010's own 15 — plus `deployAction.test.ts` ×4 and `TemplateRegistry.test.ts` ×4, which belong to already-merged non-IP-1010 work, not this package). Client: 0 test files (none expected). Full-suite total is **24**, not 16 — the package's "16 tests total" claim is accurate only for *this package's own* tests, not the repo's full suite. Informational, not a correctness defect (see Findings). | Pass (suite green); wording imprecision noted below |
| Acceptance Criteria 1–5 of FS-101 map to passing tests | AC2 (join/reject third) → `SessionStore.test.ts:5-12`. AC3 (secret simultaneous King) → `SessionStore.test.ts:14-45`. AC4 (5 AP, no carryover) → `TurnManager.test.ts:17-26`. AC5 (out-of-turn rejection) → `TurnManager.test.ts:28-33`. **AC1** ("a created session has a unique, ≥122-bit-entropy ID") has **no test and is not satisfied by the implementation** — see Findings F1. The package's own DoD line only claims "Acceptance Criteria 1–5" yet checks it `[x]`; AC1 does not in fact hold. | **Fail** (AC1) |
| No module outside `TurnManager` performs turn/AP legality checks | `GameEngine.handleAction` (`GameEngine.ts:64-65`) delegates every non-resign/non-exempt action to `tm.submitAction(...)` before doing anything else; no `activeTurn`/AP field is read or compared inside `GameEngine.ts` directly. Confirmed by reading the full file. | Pass |

## Requirements audit (Requirements Covered)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-1110 (create session) | `SessionStore.createSession` | indirectly, via fixture setup only — no dedicated assertion | RTM: IP-1010 / `TurnManager.test.ts (via SessionStore fixture setup)` | **Fail** — see F1: the *acceptance criterion this FR maps to* (unique, unguessable ID) is not met by the code, and no test would have caught it since no test asserts anything about the ID's shape/entropy. |
| FR-1120/1121/1130/1210/1220/1230 | `SessionStore.ts` | `SessionStore.test.ts` (4 tests) | RTM rows filled, IP-1010, correct file names | Pass |
| FR-1310/1320\*/1330/1340/1350 | `TurnManager.ts` | `TurnManager.test.ts` (4 tests) | RTM rows filled and correct (\*FR-1320 legitimately `UNASSIGNED` — not in this package's Requirements Covered list, correctly deferred to client UI work) | Pass |
| FR-1405/1410/1420 | `GameEngine.checkWinConditions` | `GameEngine.winConditions.test.ts` (7 tests) | RTM rows filled and correct | Pass |
| NFR-2100 (deterministic resolution) | Turn loop and win-check are pure functions of stored state, no randomness/wall-clock in the logic itself — structurally satisfied | No dedicated test | **RTM row still `UNASSIGNED`** across Feature Spec/IP/Test columns despite being in this package's Requirements Covered list | Gap (F2) |
| NFR-2200 (session isolation) | `SessionStore` keyed by `SessionId` in a `Map`; each `SessionRecord` independent | No dedicated test | RTM row `UNASSIGNED` | Gap (F2) |
| **NFR-3200 (unguessable session identifiers, ≥122 bits)** | `SessionStore.createSession`: `` `session-${this.nextId++}` `` — a **monotonic, unauthenticated global counter**, the opposite of "computationally infeasible to guess" | No test | RTM row `UNASSIGNED` | **Fail (Critical) — F1** |
| NFR-6100 (server-authoritative state) | All mutation paths originate in `GameEngine`/`TurnManager`/`SessionStore`; no client-writable path exists in this package | No dedicated test | RTM row `UNASSIGNED` | Gap (F2), functionally satisfied |

## Test run

Exact commands run by this verification session, from repo root, on Node v22.22.2 / npm 10.9.7:

```
npm run build
```
→ `tsc -b` clean in `shared`, `server`; `tsc -b && vite build` clean in `client` (29 modules,
built in 1.25s). No errors.

```
npm test
```
→ shared: **1 passed (1)**. server: **5 files, 23 passed (23)**
(`SessionStore.test.ts` 4, `GameEngine.winConditions.test.ts` 7, `deployAction.test.ts` 4,
`TurnManager.test.ts` 4, `TemplateRegistry.test.ts` 4). client: 0 test files, exits 0 (expected —
no client tests exist yet).

IP-1010's own tests (the 16 claimed: 1 shared smoke + 15 server) are exactly reproduced and green.
The suite as a whole is 24, including 8 tests from already-merged, non-IP-1010 work
(`deployAction.ts`/`TemplateRegistry.ts`, predates this package's commit per `git show --stat
7568b56`).

No tunable/scenario-dependent parameter applies here in the sense the skill's gotcha describes
(no fixture defaults to mask a range) — but the *absence* of any test around session-ID shape is
exactly the same class of blind spot: a fully green suite gave no signal that AC1/NFR-3200 were
unmet. I exercised `SessionStore.createSession` directly (reading the source, and confirming by
inspection that two consecutive calls return `session-1`/`session-2`) rather than trusting the
green suite.

## Scope audit

`git show --stat 7568b56` confirms the diff touched exactly the declared file set: `GameEngine.ts`,
`SessionStore.ts`, `TurnManager.ts`, their three test files, `shared/src/types.ts` (the BL-0021
addition), plus documentation files (FS-101 metadata, Master Build Plan, packages/INDEX.md,
backlog.md, RTM). `deployAction.ts`/`TemplateRegistry.ts` in the same directory are **not** part of
this commit — pre-existing files from a different, already-merged package. No excursion beyond the
declared set and the code-implementation peer seam.

## Deviation note judgment (BL-0021)

The package added `totalDenialTurns: number` and `destroyed: boolean` to the shared `Asset` type,
beyond IP-0010's original scaffold, filed as BL-0021.

- **`totalDenialTurns`** — genuinely new, additive-only (no existing field renamed/removed,
  nothing consuming `consecutiveDenialTurns` is broken), clearly necessitated by FR-1420's
  tiebreak needing a cumulative count distinct from the streak-that-resets
  (`consecutiveDenialTurns`, BL-0015). Properly disclosed via BL-0021 and the package's own
  Deviation note. **Reasonable and properly disclosed.**
- **`destroyed: boolean`** — the package's note frames GDS-07 as leaving Destroy's removal-vs-flag
  mechanism as an "implementation choice." On inspection, GDS-07's own Merge Gate
  (`docs/architecture/07-data-model.md:102-103`) is **not actually silent** here — it explicitly
  checked off "destroy → removal, not a flag" as its committed decision, contradicting the body
  text's parenthetical ("or marks it destroyed...") a few lines above. Taken literally, the
  package's flag-based `destroyed` field for the King diverges from GDS-07's own checked Merge
  Gate. However, GDS-07 also models the King as a **single, non-array `PlayerState.king` field**,
  distinct from the array-based `assets: Asset[]` the "removal" language was written for — the
  King cannot be "removed from an array" the way a regular asset can, since it isn't stored in
  one. A flag is the only mechanism that shape supports. **Judgment: a reasonable, forced
  implementation choice for the King specifically, correctly scoped and disclosed** — but the
  Deviation note's characterization of GDS-07 as leaving this open is not quite accurate (GDS-07
  did commit to "removal, not a flag" — just for the general/array case, not the King's singular
  field). This is a Low-severity documentation-accuracy note, not a scope violation: see F3.

Overall: the BL-0021 disclosure practice (naming the field, the reason, and filing a backlog
number for `07`/GDS-07 to formally reconcile) is exactly the right way to handle a
forward-design/no-as-built-baseline schema gap. It is additive, non-breaking, and does not by
itself justify returning the package — it is not the reason for this VR's RETURNED result.

## Findings

| # | Description | Severity | Owner |
|---|---|---|---|
| F1 | `SessionStore.createSession` generates sequential IDs (`session-${nextId++}`) — trivially guessable. Violates NFR-3200 ("sufficiently random... computationally infeasible" to guess, ≥122 bits per FS-101's Integrity Considerations) and FS-101 Acceptance Criterion 1 (unique, ≥122-bit-entropy ID). No test exists that would have caught this. | **Critical** — hard fail, blocks VERIFIED | `08-code-implementation` (re-open IP-1010): replace with a cryptographically random generator (e.g. `crypto.randomBytes`-derived token) sized for ≥122 bits of entropy, and add a test asserting the ID is not a predictable/sequential value (e.g. two sessions never share a suffix pattern; sufficient length/charset). |
| F2 | RTM rows for NFR-2100, NFR-2200, NFR-3200, NFR-6100 remain `UNASSIGNED` across Feature Spec/Implementation Package/Test columns, despite all four being listed in IP-1010's own Requirements Covered. Only the FR-1xxx rows were updated. | Medium | `08-code-implementation`, on the same re-open: fill these RTM rows once F1 is fixed and each NFR has (at minimum) an inspection note or a real test backing it — do not fill NFR-3200's cell until the entropy fix lands and is tested. |
| F3 | The Deviation note's claim that GDS-07 "leaves Destroy's exact mechanism... as an implementation choice" overstates the ambiguity — GDS-07's own Merge Gate explicitly commits to "removal, not a flag" (for the general/array-based `assets` case). The King-specific flag is still judged reasonable given the King's distinct single-field storage (see judgment above), but the note should say so precisely rather than imply GDS-07 was silent. | Low | `07-implementation-planning`/GDS-07 owner: tighten BL-0021's wording (or a GDS-07 addendum) to state the King's field-based storage is the reason a flag applies to it specifically, while non-King asset destruction (future packages) still owes GDS-07's array-removal default. |
| F4 | The package's Verification Checklist claims "`npm test` full suite passes (16 tests...)" — accurate for IP-1010's own tests, but the actual full repo suite is 24 tests (8 more from already-merged `deployAction`/`TemplateRegistry` work). Not a defect, just imprecise wording that could mislead a future reader auditing "the full suite." | Low | `08-code-implementation`: word future DoD/Checklist test-count claims as "this package's N tests" vs. "the full suite's M tests," not conflated. |

## Ledger status applied

- `docs/implementation/00-master-build-plan.md`: IP-1010 status → back to `IN PROGRESS`, pointer to
  this VR, F1 named as the blocking defect.
- `docs/implementation/packages/INDEX.md`: IP-1010 status → `IN PROGRESS`.
- No RTM cells altered by this VR (the audit found rows honestly reflecting current — imperfect —
  reality; correcting them is `08`'s job once F1/F2 are addressed, not this run's).
- No dependents flip: IP-3010/IP-2010/IP-5010/etc. were already `BLOCKED` on IP-1010 not being
  `VERIFIED`; that remains unchanged.
