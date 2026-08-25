# VR-1010-v2 — Session & Turn Lifecycle (re-verification)

- **Owned by:** `09-package-verification` · **Date:** 2026-08-22
- **Supersedes-for-status-purposes:** [VR-1010](VR-1010-session-turn-lifecycle.md) (RETURNED,
  2026-08-22) — that report is kept as the historical record of the RETURNED pass; this is an
  independent, from-scratch re-verification of the same package after its post-verification fix.

## Package

- **ID:** IP-1010 · **Title:** Session & Turn Lifecycle · **Source:** FS-101
- **Commit verified:** `c3c6057` ("fix(engine): IP-1010 post-verification fix — cryptographically
  random session IDs"), on top of the original implementing commit `7568b56`. Also present in the
  tree at verification time: `f85537c` (IP-3010, COMPLETE but not yet VERIFIED — touches
  `TurnManager.ts` via the additive `registerTurnEndHook`/BL-0022 hook; checked for interaction
  below) and `bfeed3c` (IP-3011, COMPLETE but not yet VERIFIED — content templates only, no
  engine-file overlap with IP-1010; landed on this branch mid-session, so all build/test evidence
  below was captured against the tree *including* it, not against an earlier snapshot).
- **Independence:** this session performed no implementation or fix work on IP-1010 — both
  `7568b56` and `c3c6057` predate this session entirely, and this session's only actions were
  read-only inspection plus the ledger/report writes this skill is authorized to make.
  Independence is clean, no caveat needed.

## Result

**VERIFIED** — the prior Critical finding (F1) is genuinely fixed with real cryptographic
randomness and a real regression test; the RTM gap (F2) is closed correctly; the full suite is
green (25 tests); no new hard-fail found on a from-scratch re-audit of the whole package (not just
the delta). One new Low, non-blocking documentation-accuracy note recorded (see Findings, F5).

## Definition of Done audit (re-derived from scratch against the current tree)

| Item | Evidence | Result |
|---|---|---|
| All 5 Implementation Tasks complete; all 4 win-condition paths independently testable and passing, incl. BL-0012 ordering | Read `SessionStore.ts` (create/join/King deployment), `TurnManager.ts` (`activePlayer`/`apRemaining`/`submitAction`/`advanceTurn`/`spendAP`), `GameEngine.ts` (`checkWinConditions`, `handleAction`) in full. `GameEngine.winConditions.test.ts` — 7/7 passing (destruction, denial, resignation, timeout-tiebreak-with-winner, timeout-tiebreak-draw, BL-0012 simultaneity, null-before-any-condition). | Pass |
| `handleAction` dispatch shell compiles, routes to stubs; `registerHandler` accepts injected handlers; unregistered type rejected with a clear reason | `GameEngine.ts:35-37` (`registerHandler`), `:72-76` (handler lookup; rejects with `no handler registered for action type '${action.type}'` when absent). `deployAction.test.ts:49` confirms a real consumer (`IP-3010`) registers `'deploy'` through this exact API — the shell is proven to actually route, not merely compile. | Pass |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: `npm run build` clean | Ran myself from repo root: `npm run build` → `tsc -b` clean in `shared` and `server`; `tsc -b && vite build` clean in `client` (29 modules, 927ms). No errors. | Pass |
| G5 gate: `npm test` full suite passes | Ran myself twice (see Test run note on a mid-session concurrent commit): final run against the current tree → shared **1/1**, server **28/28** across 6 files (`SessionStore.test.ts` 5, `GameEngine.winConditions.test.ts` 7, `deployAction.test.ts` 4, `TemplateRegistry.test.ts` 4, `TurnManager.test.ts` 4, `contentTemplates.test.ts` 4 — the last from IP-3011, which landed on this branch mid-session), client 0 test files (expected, none exist yet). Full-suite total **29**. Package's own claim — "this package's own 16" (`SessionStore.test.ts` 5 + `TurnManager.test.ts` 4 + `GameEngine.winConditions.test.ts` 7) — still correctly identifies IP-1010's own tests as 16; the "full repo suite" figure has since grown to 29 as later packages landed, which is expected drift the package's wording (correctly, per F4's fix) does not claim to freeze. | Pass |
| Acceptance Criteria 1–5 of FS-101 map to passing tests | AC1 (unique, ≥122-bit-entropy ID) → `SessionStore.test.ts:5-17`, the new NFR-3200 test: 50 draws, no collisions, format `session-[A-Za-z0-9_-]{20,}` (22-char base64url of 16 random bytes = 128 bits ≥ 122), explicitly asserts the id does **not** match the old `session-\d+` sequential format. This is the specific gap VR-1010 failed on (F1) — now closed with a real assertion, not just a fixed implementation. AC2 (join/reject third) → `:19-26`. AC3 (secret simultaneous King) → `:28-45`, `:47-59`. AC4 (5 AP, no carryover) → `TurnManager.test.ts:17-26`. AC5 (out-of-turn rejection) → `TurnManager.test.ts:28-33`. All read and independently confirmed passing. | Pass |
| No module outside `TurnManager` performs turn/AP legality checks | Read `GameEngine.ts` in full: every non-resign action path (`:64-65`) is gated through `tm.submitAction(...)` before any dispatch; `GameEngine.ts` itself never reads or compares `activeTurn`/`apRemaining` directly. `TurnManager.ts` is the sole owner of both fields. | Pass |

## Requirements audit (Requirements Covered)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-1110 (create session) | `SessionStore.createSession` | `SessionStore.test.ts` (indirectly via every test's fixture setup, and directly by the new NFR-3200 entropy test, which exercises `createSession` 50 times and asserts on its output) | RTM row present, IP-1010, correct | Pass |
| FR-1120/1121/1130/1210/1220/1230 | `SessionStore.ts` | `SessionStore.test.ts` (5 tests) | RTM rows filled, IP-1010, correct file names | Pass |
| FR-1310/1330/1340/1350 | `TurnManager.ts` | `TurnManager.test.ts` (4 tests) | RTM rows filled and correct (FR-1320 legitimately `UNASSIGNED`, deferred to client UI, unchanged from VR-1010's finding) | Pass |
| FR-1405/1410/1420 | `GameEngine.checkWinConditions` | `GameEngine.winConditions.test.ts` (7 tests) | RTM rows filled and correct | Pass |
| **NFR-2100** (deterministic resolution) | Turn loop / win-check are pure functions of stored state; no randomness or wall-clock read in `TurnManager`/`GameEngine` logic (confirmed by reading both files in full — the only `crypto.randomBytes` call in this package is in `SessionStore.generateSessionId`, which is metadata generation, not game-state resolution) | No dedicated test (structural argument, same as VR-1010's assessment) | RTM row now reads: `IP-1010 \| (structural — pure functions of stored state, no randomness/wall-clock; no dedicated test, per VR-1010 F2)` — filled, accurately characterized, matches the actual code | Pass — gap closed |
| **NFR-2200** (session isolation) | `SessionStore` keyed by `SessionId` in a `Map`; each `SessionRecord` independently constructed, no shared mutable state observed between records on inspection | No dedicated test | RTM row filled with the same structural framing, accurate | Pass — gap closed |
| **NFR-3200** (unguessable session identifiers, ≥122 bits) | `SessionStore.ts:64-66`: `` `session-${randomBytes(16).toString('base64url')}` `` — 128 bits of CSPRNG output, never a counter or any predictable input | `SessionStore.test.ts:5-17` — real test, 50-draw collision-free + format assertion + explicit rejection of the old sequential shape | RTM row: `SessionStore.test.ts (entropy/non-sequential test, fixed post-VR-1010 F1)` — filled and accurate | **Pass — Critical finding F1 fixed** |
| NFR-6100 (server-authoritative state) | All mutation paths originate in `GameEngine`/`TurnManager`/`SessionStore`; confirmed no client-writable path exists anywhere in this package's three files | No dedicated test | RTM row filled with the same structural framing, accurate | Pass — gap closed |

## Test run

Exact commands run by this verification session, from repo root, on the container's installed
Node/npm (node_modules already present, no `npm install` needed):

```
npm run build
```
→ `tsc -b` clean in `shared`; `tsc -b` clean in `server`; `tsc -b && vite build` clean in `client`
(29 modules transformed, built in 927ms). No errors, no warnings.

```
npm test
```
→ shared: **1 passed (1)**. server: **6 files, 28 passed (28)** — `SessionStore.test.ts` 5,
`GameEngine.winConditions.test.ts` 7, `deployAction.test.ts` 4, `TemplateRegistry.test.ts` 4,
`TurnManager.test.ts` 4, `contentTemplates.test.ts` 4. client: 0 test files, exits 0 (expected, no
client tests exist yet).

**Full-suite total: 29** (1 shared + 28 server). Note on timing: this run's *first* pass (taken
immediately after reading the package/RTM/prior VR) recorded 25 (1 shared + 24 server, no
`contentTemplates.test.ts`); a concurrent commit (`bfeed3c`, IP-3011 — mission-set/asset-type
content templates, unrelated to IP-1010) landed on this same branch mid-session, adding
`contentTemplates.test.ts` (4 tests). I re-ran `npm run build`/`npm test` a second time, after
noticing the new commit via `git log`, to make sure this report's evidence reflects the tree as it
actually stands, not a snapshot taken moments before the branch moved — both runs were fully
green throughout. IP-1010's own tests remain exactly 16 of the (now 29) total
(`SessionStore.test.ts` 5 + `TurnManager.test.ts` 4 + `GameEngine.winConditions.test.ts` 7); the
other 13 belong to IP-0010/IP-3010/IP-3011, already-merged, non-IP-1010 work.

No tunable/scenario-dependent parameter applies to this package in the sense the skill's gotcha
describes (no fixture defaults masking a range that could silently misbehave at a non-default
value) — the parameter that mattered here (session-ID *shape*) is exactly what the new NFR-3200
test now exercises directly, and I additionally read `generateSessionId`'s source myself and
confirmed by inspection that it calls `randomBytes(16)` (not a stored/incrementing field) on every
invocation — the fix is structural, not merely re-labeled.

## Scope audit

`git show --stat c3c6057` (the fix commit) touched exactly: `SessionStore.ts`,
`SessionStore.test.ts`, plus documentation files (the package itself, Master Build Plan,
`packages/INDEX.md`, `backlog.md`, RTM) — no other production file. This matches the package's
declared file set precisely; no excursion.

Separately, `git show --stat f85537c` (IP-3010, present in the tree, COMPLETE-not-VERIFIED) shows
it added `TurnManager.registerTurnEndHook` — an **additive, non-breaking extension** to a file
IP-1010 owns, disclosed in that commit's own message as BL-0022 and consistent with `TurnManager`'s
existing doc-comment ("IP-3010 registers deploy-state ticking here... later packages register
their own turn-scoped work the same way rather than TurnManager importing their modules"). This
does not alter any of IP-1010's own behavior or tests (`TurnManager.test.ts` still passes
unmodified) and is not a scope violation of IP-1010's own package — noted here only because the
task asked this run to check for cross-package interaction with IP-3010 specifically. No action
needed.

## Deviation note re-judgment (BL-0021 / VR-1010's F3)

VR-1010's F3 finding: the original Deviation note claimed GDS-07 "leaves Destroy's exact
mechanism... as an implementation choice," when GDS-07's own Merge Gate actually commits to
"removal, not a flag" for the general/array-based case — overstating the ambiguity, though the
King-specific flag was still judged reasonable given the King's distinct single-field storage.

On this re-audit: the fix commit (`c3c6057`) **appended a new "Post-verification fix" section**
that correctly and precisely restates the King-specific carve-out (quoting VR-1010's own judgment
almost verbatim). However, `git show c3c6057` confirms the **original Deviation note text itself
was left byte-for-byte unchanged** — it still reads "GDS-07 leaves Destroy's exact mechanism...as
an implementation choice" with no King-specific qualification. The fix commit's own message and
`docs/pipeline/backlog.md`'s BL-0025 disposition both describe this as the note having been
"reworded," which is not literally what happened — a corrective addendum was added below it, but
the original sentence was not edited in place. See F5 below: Low severity, not a blocker, since the
accurate framing is present in the same document (immediately following section) and the backlog
entry, and a reader of the whole package file gets the correct picture — but the claim of having
"reworded" the note is imprecise, mirroring the very kind of wording-imprecision VR-1010 flagged
under its own F4.

## Findings

| # | Description | Severity | Owner |
|---|---|---|---|
| F5 | The fix commit (`c3c6057`) and `docs/pipeline/backlog.md`'s BL-0025 disposition both claim the BL-0021 Deviation note was "reworded" to state the King-specific carve-out precisely. In fact the original Deviation note sentence was left unchanged; a new "Post-verification fix" section was appended below it with the corrected framing instead. Net effect on a reader is fine (the correct framing is present in the document), but the change-description is inaccurate about *how* it was fixed. | Low | `07-implementation-planning`/pipeline-journal owner: either edit the original Deviation note sentence in place to remove the overstated claim, or correct BL-0025's/the commit's description to say "appended a corrective addendum" rather than "reworded." Non-blocking. |

No other findings. F1 (Critical) and F2 (Medium) from VR-1010 are both fully resolved with direct
evidence above; F4 (Low, wording) is fully resolved.

## Ledger status applied

- `docs/implementation/00-master-build-plan.md`: IP-1010 status → **`VERIFIED`** (2026-08-22,
  VR-1010-v2), pointer added; "Next action" section and prose updated to reflect the current
  state. Dependency check: IP-3010 and IP-3011 (both `COMPLETE`, not yet `VERIFIED`) are the only
  packages whose Blocking-dependencies column names IP-1010 alongside others still unmet.
  IP-3010's other dependency (IP-0010) is already `VERIFIED`, but IP-3010 itself stays
  `COMPLETE`/awaiting its own `09-package-verification` pass — this run verifies IP-1010 only, so
  IP-3010 is not flipped. IP-2010/IP-5010 name IP-0010+IP-1010+IP-3010+IP-3011 — IP-1010 is now
  satisfied but IP-3010/IP-3011 are not yet `VERIFIED`, so neither flips to `READY`. IP-6010/
  IP-4010/IP-7010/IP-8010 all sit behind further-downstream unmet dependencies regardless. **No
  package flips to `READY` from this VR alone**, exactly as expected.
- `docs/implementation/packages/INDEX.md`: IP-1010 status → `VERIFIED`.
- `docs/implementation/verification/INDEX.md`: row added for VR-1010-v2.
- RTM: no cells altered by this VR — the audit found NFR-2100/2200/3200/6100 rows already filled
  and accurate by the prior fix commit; confirming, not correcting.
