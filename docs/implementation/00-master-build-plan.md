# Master Build Plan

- **Owned by:** `07-implementation-planning` (structure/sequencing) — status column advanced by
  `08-*`/`09-package-verification` only. **Status:** authored 2026-08-22, MVP tranche.

## Status ledger

| Package | FS/BL | Owning 08 peer | Status | Blocking dependencies | G3 basis |
|---|---|---|---|---|---|
| IP-0010 | — (scaffold) | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-0010) | none | Release plan (MVP needs a codebase) |
| IP-1010 | FS-101 | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-1010-v2) | IP-0010 (VERIFIED) | Release plan (FEAT-1000, MVP) |
| IP-3010 | FS-102 (code) | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-3010) | IP-0010, IP-1010 (both VERIFIED) | Release plan (FEAT-3000, MVP) |
| IP-3011 | FS-102 (content) | `08-content-authoring` | **VERIFIED** (2026-08-22, VR-3011) | IP-3010 (VERIFIED) | Release plan (FEAT-3000, MVP) |
| IP-2010 | FS-103 | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-2010-v2) | IP-0010, IP-1010, IP-3010, IP-3011 (all VERIFIED) | Release plan (FEAT-2000, MVP) |
| IP-5010 | FS-104 | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-5010) | IP-0010, IP-1010, IP-3010, IP-3011 (all VERIFIED) | Release plan (FEAT-5000, MVP) |
| IP-6010 | FS-106 | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-6010) | IP-0010, IP-2010 (both VERIFIED) | Release plan (FEAT-6000, MVP) |
| IP-4010 | FS-105 (code) | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-4010) | IP-0010, IP-2010, IP-6010 (all VERIFIED) | Release plan (FEAT-4000, MVP) |
| IP-4011 | FS-105 (content) | `08-content-authoring` | **VERIFIED** (2026-08-23, VR-4011) | IP-4010 (VERIFIED) | Release plan (FEAT-4000, MVP) |
| IP-7010 | FS-107 | `08-code-implementation` | **VERIFIED** (2026-08-23, VR-7010-v2) | IP-0010, IP-1010, IP-6010 (all VERIFIED) | Release plan (FEAT-7000, MVP) |
| IP-8010 | FS-108 | `08-code-implementation` | **VERIFIED** (2026-08-23, VR-8010-v2) | all 10 above (all VERIFIED) | Release plan (FEAT-8000, MVP) |
| IP-9038 | — (bug remediation: BL-0038/BL-0027) | `08-code-implementation` | **READY** (2026-08-23) | IP-1010, IP-5010, IP-6010, IP-7010, IP-8010 (all VERIFIED) | Closes disclosed deviations in already-authorized packages (IP-7010, IP-3011) + completes FS-101's already-approved W1 workflow — see TWBS §6 |

**IP-9038** is the sole package not tied to an MVP Feature — it is the real server bootstrap
(BL-0038/BL-0027) that MSTR-001 v0.4 (C10) put on the critical path to the deferred G4 gate: all
11 MVP packages are `VERIFIED` and the game's logic is fully proven by tests, but nothing has
ever run it as a real process a human can connect to. All of IP-9038's dependencies are
`VERIFIED`, so it is immediately `READY`.

**IP-0010 is `VERIFIED`** (implemented 2026-08-22; independently verified 2026-08-22 by
`09-package-verification` — see
[VR-0010](verification/VR-0010-project-scaffold.md); 3 Low/Medium non-blocking findings recorded,
none affecting the result).

**IP-1010 is now `VERIFIED`** (2026-08-22). History: an initial verification pass
([VR-1010](verification/VR-1010-session-turn-lifecycle.md)) RETURNED it for a Critical finding
(`SessionStore` generated sequential, guessable session IDs, violating NFR-3200 and FS-101
Acceptance Criterion 1) plus a Medium RTM gap (NFR-2100/2200/3200/6100 left `UNASSIGNED`) and two
Low notes. Both were fixed same day: `generateSessionId` now uses `crypto.randomBytes(16)`
(128 bits), base64url-encoded, with a new test (50-draw collision/format check); the four NFR RTM
rows filled. A fresh, independent re-verification
([VR-1010-v2](verification/VR-1010-session-turn-lifecycle-v2.md)) re-derived the full Definition
of Done/Verification Checklist audit from scratch against the current tree (not just the delta),
confirmed the fix is real cryptographic randomness backed by a real test, rebuilt and re-ran the
full suite itself, and confirmed the result: **`VERIFIED`**, with one new Low, non-blocking note
(F5: the fix commit's claim of having "reworded" the Deviation note was imprecise — it appended a
corrective section rather than editing the original sentence in place). No package flips to
`READY` from this alone: IP-3010/IP-3011 (both `COMPLETE`, not yet `VERIFIED`) remain the
next-in-line packages for `09-package-verification`; IP-2010/IP-5010/IP-6010/IP-4010/IP-7010/
IP-8010 remain `BLOCKED` on those and further downstream dependencies.

**IP-3010 is now `VERIFIED`** (2026-08-22 — see
[VR-3010](verification/VR-3010-asset-roster-lifecycle.md)). Independent audit confirmed the deploy
action's AP-cost deduction, the ground/space `deployState.turnsUntilOnline` lifecycle, and
`assertOnline` pre-online blocking all against the code directly, cross-checked against a real
second consumer (IP-2010's `taskAction.ts`, which already lands on this branch). Both disclosed
deviations — reuse of GDS-07's existing `turnsUntilOnline` field instead of a new `onlineAt` field,
and the additive `TurnManager.registerTurnEndHook` extension (BL-0022) — were independently
confirmed accurate and judged reasonable, the same way VR-1010 judged BL-0021: `TurnManager.ts`'s
diff is purely additive (its pre-existing methods are behavior-identical; `TurnManager.test.ts`
still passes unmodified) and `shared/src/types.ts` was untouched by IP-3010's commit. The package's
own once-open checklist item (does the schema match IP-3011's eventual data) is now independently
confirmed true, since IP-3011's real content templates load and validate cleanly. Build clean; full
suite green (38 tests). One new Low, non-blocking finding: `tickDeployStates` isn't yet wired to
`registerTurnEndHook` in any production bootstrap — this matches the identical, currently-unwired
state of every other handler/hook in the tree (no server bootstrap exists yet for any of them), so
it's a project-wide gap deferred to the future transport/bootstrap package, not an IP-3010 defect.
**No package flips to `READY` from this VR alone**: IP-3011's sole blocking dependency (IP-3010) is
now met, making it the next checkable package for its own verification, but IP-2010 and IP-5010 —
both already `COMPLETE` — still also name IP-3011 as a blocking dependency, and IP-3011 remains
`COMPLETE`, not yet `VERIFIED`, so neither flips to `READY`.

**Note (observed mid-session):** IP-5010 (`Propagator`) has since landed as `COMPLETE` on this
branch — implemented concurrently with this verification pass, ahead of the sequencing this plan's
"Parallel opportunities" section anticipated (it expected IP-5010 to start only once IP-1010/
IP-3010/IP-3011 were all `VERIFIED`). This is recorded here as an observation for
`07-implementation-planning`/the pipeline journal; this VR pass verified IP-3010 only and did not
audit IP-5010's own implementation.

**IP-3011 is now `VERIFIED`** (2026-08-22 — see
[VR-3011](verification/VR-3011-asset-mission-content.md)). A fresh, independent session (no
involvement in implementing IP-3011) read every one of the 7 asset-type + 3 mission-set JSON
templates and `loadContent.ts` directly, confirmed each against `TemplateRegistry`'s actual
validator (IP-3010), confirmed the ground/space `timeToOnline` asymmetry (≤1 ground, ≥3 space)
holds across the whole roster, and confirmed every numeric AP-cost/timing field carries an
in-content disclosure that it is provisional pending `02-research-domain`'s R-1xx grounding
(BL-0017) — not silently presented as final. BL-0027 (the `loadContent.ts` runtime-`__dirname`
JSON read not being copied into `server/dist/` by `tsc -b`) was independently reproduced (`dist/
content/` confirmed to hold the compiled loader but no `.json` files) and its scoping confirmed
accurate: this package's own G5 gate (`vitest`, which runs against source) is genuinely
unaffected. Rebuilt and re-ran the full suite fresh: 52 tests across 12 files, all green — up
from the package's own claimed 29 (1 shared + 28 server) purely because IP-2010 and IP-5010 landed
additional tests concurrently/after IP-3011 on this branch; IP-3011's own 4
`contentTemplates.test.ts` tests are unchanged and still pass.
`createGameEngine.wiring.test.ts` was confirmed as a genuine live exercise of the shipped content
end-to-end (real templates, real deploy/online-lifecycle behavior), not merely a re-run of the
package's own schema test. Three Low, non-blocking findings recorded (a stale test-count line in
the package's own Verification Checklist; a pre-existing FS-102/package wording drift between "six"
and "seven" asset types; the FR-3300 RTM row not explicitly naming the content-side test) — none
affect the result.

**IP-2010 and IP-5010 are now unblocked toward their own verification.** Both packages' sole
named blocking dependencies are IP-0010, IP-1010, IP-3010, and IP-3011 — all four are now
`VERIFIED`. Both remain `COMPLETE` (already implemented), but each is now the next checkable
package for `09-package-verification`. IP-6010/IP-4010/IP-4011/IP-7010/IP-8010 remain `BLOCKED`
regardless — their own blocking dependencies (IP-2010 and/or IP-6010) are not yet `VERIFIED`.

**IP-2010 was independently verified and `RETURNED`** (2026-08-22 — see
[VR-2010](verification/VR-2010-sensing-f2t2e.md)). A fresh, independent session (no involvement in
implementing IP-2010) confirmed all 4 Implementation Tasks, both belief-decay behaviors (BL-0009's
5-turn window and `'find'`-removal), and the BL-0028 deviation (`applyTasking`'s two extra
`observerState`/`opponentTrueState` parameters beyond GDS-09) as reasonable and accurately
disclosed, judged against the VR-1010/VR-3010 model. Build clean; full suite green (52 tests,
re-run fresh — includes IP-5010's `Propagator.*.test.ts` and the cross-package
`createGameEngine.wiring.test.ts`, which was independently confirmed to genuinely exercise
IP-2010's own decay logic end-to-end, not superficially). **One Critical finding (F1)**, found only
by live-exercising a case none of the package's own fixtures cover (per the skill's
tunable-parameter gotcha): tasking a sensor with no F2T2E-relevant `chainRoles` at all (e.g. an
effector) is not rejected — it silently succeeds, deducts 1 AP, and produces zero belief effect,
with no distinguishable reason returned, directly violating FS-103 Acceptance Criterion 4 and its
Error Handling section despite the package's own Verification Checklist marking that item
satisfied. **IP-2010 stays `COMPLETE`, returned to `08-code-implementation`** to add the missing
pre-spend rejection check (and a regression test) before re-verification. No package flips to
`READY` from this VR: IP-6010/IP-4010 remain `BLOCKED`, now explicitly gated on IP-2010's
fix-and-reverify cycle rather than merely on "awaiting first pass."

**IP-5010 is now `VERIFIED`** (2026-08-22 — see [VR-5010](verification/VR-5010-propagator.md)). A
fresh, independent session (no involvement in implementing IP-5010) read `Propagator.ts` in full
and independently hand-re-derived FS-104's worked example (`LEO-EQUATORIAL → GEO-POLAR` = 11 fuel
/ 5 turns) directly from FS-104's raw Maneuver Cost Table formula — not from the code or the
regression test — and cross-checked every populated cell of `ALTITUDE_COST`/`PLANE_COST` against
FS-104's two source tables: all matched, both directions of every pair, with the 25%
combined-maneuver discount and `Math.floor` rounding applied correctly and only when both axes
change. This closes a real gap in the package's own Analysis checklist item, which had relied
solely on the regression test matching FS-104's prose rather than an independent re-derivation
(Low, non-blocking finding). Both disclosed notes — BL-0030 (the `createGameEngine.ts` composition
root, not named by any package's Files to Create list) and BL-0031 (maneuver AP is deducted but the
Maneuver Cost Table's `fuelCost` is not yet gated against any fuel-analog budget field, since none
exists yet on `Asset` or any content template) — were independently confirmed accurate against the
code. Build clean; full suite green (60 tests, up from the package's own claimed 52 purely because
a later, unrelated IP-2010 post-verification fix commit landed more tests after IP-5010 — Low,
non-blocking finding, same drift pattern noted in VR-2010/VR-3011). All 7 Requirements Covered rows
(FR-5100/5200/5300/5400/5500, NFR-1200, NFR-5300) trace correctly in the RTM to real code and
tests/Inspection. **No package flips to `READY` from this VR**: IP-8010 (the only package naming
IP-5010 as a dependency) needs all ten other packages `VERIFIED` first, and several (IP-2010,
IP-6010, IP-4010, IP-4011, IP-7010) are not yet there.

**IP-2010 is now `VERIFIED`** (2026-08-22 — see
[VR-2010-v2](verification/VR-2010-sensing-f2t2e-v2.md)), superseding the earlier `RETURNED`
[VR-2010](verification/VR-2010-sensing-f2t2e.md) result. A fresh, independent session (no
involvement in the fix or in VR-2010) confirmed VR-2010's sole Critical finding (F1: an
effector-only asset silently succeeded a tasking action, no rejection, AP spent) is genuinely
fixed: `hasSensorCapability(chainRoles)` re-derives the real capability-ceiling logic (not a stub)
and `taskAction.ts`'s `makeTaskHandler` now calls it and rejects, with a clear reason, strictly
before `assertOnline`/AP-spend — confirmed both by direct line-order code reading and by this
session's own live re-exercise of the exact original failing scenario (`chainRoles: ['engage']`
through the real `GameEngine.handleAction('task', ...)` path), which now correctly rejects with
zero AP spent and zero belief entries. The two new committed regression tests correctly distinguish
the rejection from the legitimate ceiling-reached no-op refresh; this session additionally
live-confirmed a previously-untested full-chain (`target`-ceiling) case was not broken by the fix.
Full Definition of Done/Verification Checklist re-derived from scratch; build clean; full suite
green (54 tests, exactly matching the package's own claim). No findings. **IP-6010's blocking
dependencies (IP-0010, IP-2010) are both now `VERIFIED`** — IP-6010 itself was found already
`COMPLETE` in the tree at verification time (a concurrent session's implementation work, the same
pattern already seen with IP-5010), so it is now the next package eligible for its own
`09-package-verification` pass; this VR did not itself audit IP-6010's implementation. IP-4010
remains `BLOCKED` (still needs IP-6010 `VERIFIED`).

**IP-6010 is now `VERIFIED`** (2026-08-22 — see [VR-6010](verification/VR-6010-fog-of-war-enforcement.md)),
the project's highest-priority security test surface (NFR-3100/GDS-06), audited with extra
scrutiny per its own Risks note. `computeOpponentView`/`applyDeception` were independently
confirmed structurally incapable of leaking true opponent state — both methods read/write only
identifiers into the observer's own `beliefOfOpponent` map, never a reference to the opponent's
true `Asset`/King/`activeEffects` objects. This session independently re-ran the package's own
mandatory supersession sweep from scratch (not trusting its "found nothing else, confirmed clean"
claim) — re-grepped `OpponentView`/`beliefOfOpponent`/`opponentTrueState` across all of `server/src`
and additionally read every file touching `PlayerState` — and reached the same clean conclusion,
including cross-checking `EffectResolver.ts` (a concurrent, uncommitted IP-4010 file already
present in the tree) as a legitimate, correctly-scoped consumer of `applyDeception`, not a rival
construction site. The fog-of-war boundary was live-exercised beyond the committed test file's own
coverage with three independently-constructed scenarios (a zero-belief observer against a fully-
populated, even King-bearing secret opponent; a mutation/object-identity isolation check on the
returned `OpponentView`; a byte-for-byte true-`Asset` snapshot around `applyDeception`) — all held.
One Low, non-blocking finding: BL-0033's Deviation note is accurate for `computeOpponentView` but
undercounts `applyDeception`'s actual signature delta (silently drops GDS-09's `observer: PlayerId`
rather than retaining it, and adds an undisclosed `turnNumber` parameter) — functionally benign,
flagged for `07-implementation-planning`'s eventual GDS-09/BL-0033 reconciliation. Build clean; full
suite green (57 tests, exactly matching the package's own claim), run from an isolated `git
worktree` at `HEAD` since the live shared tree carried unrelated, concurrent, uncommitted IP-4010
edits that broke its own build (not an IP-6010 defect). **IP-7010's blocking dependencies (IP-0010,
IP-1010, IP-6010) are now all `VERIFIED`** — IP-7010 flips `BLOCKED` → **`READY`**, the next package
due for `08-code-implementation`. **IP-4010's blocking dependencies (IP-0010, IP-2010, IP-6010) are
also now all `VERIFIED`**, but it was found already `COMPLETE` in the shared working tree
(uncommitted, concurrent implementation, along with IP-4011 similarly `COMPLETE`) rather than
`BLOCKED` awaiting this flip — once committed, IP-4010 is the next package eligible for its own
`09-package-verification` pass; this VR did not itself audit IP-4010's or IP-4011's implementation.

**IP-4010 is now `VERIFIED`** (2026-08-22 — see [VR-4010](verification/VR-4010-effect-resolver.md)).
The Deceive/Destroy structural distinction (GDS-04/07's most safety-critical mechanism in this
package) was live-exercised beyond `EffectResolver.test.ts`'s own coverage: a King pre-populated
with an active Disrupt entry and non-zero `consecutiveDenialTurns`/`totalDenialTurns` was Deceived
twice in a row through the real `GameEngine.handleAction('engage', ...)` path — its true state was
byte-for-byte unchanged across both calls (not just `trueRegime`/`destroyed`, but also
`activeEffects` and both denial-streak fields, none of which the committed fixture ever populates
non-default), while a separate Destroy call on a different target did flip `destroyed`, confirming
two genuinely different code paths. Denial-streak arithmetic was independently cross-checked
field-for-field: `GameEngine.checkWinConditions` (IP-1010) reads `king.destroyed`,
`king.consecutiveDenialTurns` (against `DENIAL_STREAK_THRESHOLD = 6`, matching FR-4400's tuning
table), and `king.totalDenialTurns` (at `TIMEOUT_TURN_CAP = 60`, matching FR-1420) — exactly the
fields `EffectResolver` writes, no drift. The `TurnEndHook` `turnNumber` widening (BL-0036) is
confirmed additive/backward-compatible: IP-1010's/IP-3010's own already-`VERIFIED` hook-consumer
tests (`TurnManager.test.ts`, `deployAction.test.ts`, `taskAction.test.ts`,
`createGameEngine.wiring.test.ts`) all re-run clean, unmodified. One Low, non-blocking finding: the
`resolveEngagement` Deviation note discloses only the added `effectorObserverState` parameter but
undercounts the actual delta (also silently adds `currentTurn`/`falseRegime`, neither disclosed) —
the same category of gap VR-6010's F1 found in `applyDeception`'s note. One more Low, cosmetic
finding: the package's own prose describes a "`handleAction` switch" that doesn't literally exist
(the real mechanism is `GameEngine.registerHandler`, the same pattern already established by prior
packages). Build clean; full suite green (66 tests, exactly matching the package's own claim).
**IP-4011 (names IP-4010 as its sole blocking dependency, already `COMPLETE`) is now the next
package eligible for its own `09-package-verification` pass.**

**IP-4011 is now `VERIFIED`** (2026-08-23 — see [VR-4011](verification/VR-4011-effect-content.md)).
All five effect-definition files were hand-verified against FS-105's prose and against
`EffectResolver.ts`'s real `DISRUPT_DENY_DURATION`/`DEGRADE_DURATION` constants directly, not just
against the package's own tests. A live re-exercise beyond the committed "BL-0037 cross-check"
test (which only round-trips `disrupt`/`degrade` through the real resolver) independently confirmed
the **Deny** duration, a non-default 7-turn multi-stack Degrade tick past the 6-turn mission-denial
threshold (correct expiry/reset/total arithmetic), and that Deceive's content-declared
`"until-cleared"` duration is never written into a real `EffectStateEntry`. The effector-to-effect
doctrine mapping was independently cross-checked cell-by-cell against IP-3011's real asset-type
`_effectAffinity` content — fully consistent today, though (Low finding) the committed test that
checks `allowedEffectorTemplateIds` only verifies referential existence, not this doctrine
cross-check the package's own "Tests to Add" section promises. Two further Low, non-blocking
findings: Task 2's "IP-4010's `EffectDefinition` schema" wording is imprecise since the schema is
authored entirely within this package (already substantively disclosed by BL-0037); the package's
"70 tests" claim is stale (94 today) purely from concurrent IP-7010/IP-8010 landing. Build clean;
full suite green. No package flips to `READY` from this VR alone: IP-8010 (the only package naming
IP-4011) also still needs IP-7010 `VERIFIED`.

**IP-7010 was independently verified 2026-08-23 and RETURNED** — see
[VR-7010](verification/VR-7010-transport.md). The security/integrity-critical claims held up under
live, hand-constructed exercise (not just re-reading the code or re-running the committed suite):
`broadcastStateDelta` genuinely computes two independent per-recipient `StateDeltaMessage`s through
IP-6010's already-`VERIFIED` `computeOpponentView` — a constructed scenario with deliberately
distinct true regimes for each player confirmed neither player's socket ever receives the other's
true state, and the two message payloads are never the same object; `SessionStore`'s
`crypto.randomBytes(16)` session-ID generation (VR-1010-v2's fix for BL-0023) is unchanged and
`connectionRegistry.ts` introduces no ID scheme of its own that could bypass it; the disconnect
notify/choice/reconnect sequence has no timer anywhere (`grep` confirms) and matches FS-101 §W7's
notify-and-choose policy for the normal `'wait'`/`'cancel'` paths. Two High findings block
`VERIFIED`: **(F1)** `handleConnection`'s reconnect path silently sends nothing when the presented
`sessionId` no longer exists, instead of the "clear 'session no longer exists' response" FS-107's
own W4 edge case and NFR-7200 explicitly require — live-reproduced with a fresh fake connection and
a nonexistent session ID, and uncaught by either committed test file. **(F2)** FS-101 §W7 requires a
cancelled session to carry "a distinct outcome value (e.g. `'cancelled'`)"; `SessionState` has no
`outcome` field at all, and the cancel path only sets `phase = 'ended'` — the package's own DoD
claim of delivering `outcome: 'cancelled'` is not implemented anywhere in the shipped schema or
code. Live-reproducing the adjacent edge case (cancelling a session whose `turnNumber` already
exceeds the 60-turn timeout cap) shows `GameEngine.checkWinConditions` actively mislabels it
`{winner: null, reason: 'timeout-tiebreak'}` rather than reporting a cancellation — a functional
correctness bug, not merely a documentation gap. Build clean; full suite green (79 shared+server
tests, matching the package's own claim exactly). IP-7010 stays `COMPLETE`, routed back to
`08-code-implementation` (F1: guard the reconnect path) and `07-implementation-planning` (F2: the
`SessionState`/`outcome` schema gap is upstream of this package's own scope). IP-8010 remains
`BLOCKED` pending IP-7010's fix-and-reverify cycle (IP-4011 is independently `VERIFIED`, so it is no
longer part of what blocks IP-8010).

## Dependency graph

```
IP-0010
  └─▶ IP-1010 ──▶ IP-3010 ──▶ IP-3011 ──▶ IP-2010 ──▶ IP-6010 ──┬─▶ IP-7010 ──▶ IP-8010
                                                                  │
      IP-5010 (parallel, after IP-1010/IP-3010) ───────────────────────────────┤
      IP-4010 ──▶ IP-4011 (after IP-6010) ──────────────────────────────────────┘
```

## Critical path

`IP-0010 → IP-1010 → IP-3010 → IP-2010 → IP-6010 → IP-7010 → IP-8010` (7 packages — the 6-Feature
release-plan critical path plus the one foundational scaffold package it didn't previously
account for). IP-3011/IP-5010/IP-4010/IP-4011 do not lengthen this path but are hard prerequisites
of the final package (IP-8010).

## Parallel opportunities

Once IP-3010 is `VERIFIED`: IP-3011 (content) and IP-2010 (engine) can each start immediately (the
critical path already accounts for IP-2010; IP-3011 is genuinely free parallel capacity). Once
IP-1010/IP-3010/IP-3011 are `VERIFIED`: IP-5010 (`Propagator`) can proceed in parallel with
IP-2010/IP-6010's own sequence, converging only at IP-8010.

## Next action

**IP-5010, IP-2010, IP-6010, IP-4010, and IP-4011 are all `VERIFIED`** (see VR-5010, VR-2010-v2,
VR-6010, VR-4010, and VR-4011 above) — no further action needed on any of them. **IP-7010 was
independently verified 2026-08-23 and RETURNED** (see VR-7010 above, 2 High findings: F1 a silent
reconnect-to-nonexistent-session failure, F2 a missing/mislabeled cancellation `outcome`).
**`08-code-implementation` has now executed the remediation** (2026-08-23): F1 fixed —
`broadcastToOne` sends an explicit `action-rejected`/`'session no longer exists'` message instead
of silently dropping a reconnect to a nonexistent session; F2 fixed — `SessionState.cancelled`
(additive field), `WinReason` gained `'cancelled'`, `handleDisconnectResponse`'s `'cancel'` branch
sets it, and `GameEngine.checkWinConditions` checks it first (ahead of resignation), verified
against VR-7010's exact hand-reproduced past-timeout-cap scenario in a new regression test. Build
clean; full suite green (96 tests: 1 shared + 80 server + 15 client, up from 94). IP-7010 was then
**independently re-verified 2026-08-23 and VERIFIED** (see
[VR-7010-v2](verification/VR-7010-transport-v2.md)) — both High findings genuinely fixed,
re-derived from a hand-constructed reconnect-to-nonexistent-session case and VR-7010's exact
past-timeout-cap cancellation scenario (plus a control case proving the timeout-tiebreak branch
really would have fired otherwise), not just from re-running the committed regression tests. Fog-
of-war non-leak and `SessionStore` ID entropy re-confirmed unaffected; scope audit confirmed the
fix commit touched exactly the Remediation section's named files. Two Low, informational,
non-blocking findings (a pre-existing, unreachable "deploying-phase connect" message-labeling
quirk predating this fix; an RTM cell that's incomplete but not wrong). Rebuilt from a genuinely
clean `node_modules`; full suite green (96 tests, matching exactly). **IP-7010 is now `VERIFIED`.**
**IP-8010** (all 10 named dependencies now `VERIFIED`) is the next package eligible for its own
`09-package-verification` pass — it remains `COMPLETE`, no further implementation work needed,
just awaiting that verification pass.

**IP-8010 was independently verified 2026-08-23 and RETURNED** — see
[VR-8010](verification/VR-8010-presentation-ui.md). The fog-of-war rendering boundary was
independently re-derived beyond the committed component-level test, at the full
`GameClient`→`App` pipeline level with a deliberately contaminated `StateDeltaMessage` (smuggled
`PlayerState`-only fields onto an `OpponentView`-shaped object) — no leak found through `App`'s
rendered output. The legality pre-filter's coarse gates were cross-checked line-by-line against
the real server code (`TurnManager.submitAction`/`spendAP`, `assertOnline`,
`Propagator.planManeuver`'s BL-0014 rejection, `BeliefState.hasSensorCapability`) and confirmed a
genuine parallel implementation, not a stub. One High finding blocks `VERIFIED`: (F1) no message
type, interface, or shared static catalog exists anywhere in the codebase to deliver
`AssetTemplate` (AP cost/time-to-online) data from server to client — `main.tsx` hardcodes
`deployableTemplates: []`, GDS-09 never defines such a channel (`AssetTemplate` content lives only
in `server/src/content/`, never re-exported through `shared/`), and no test anywhere renders
`AssetTray` with non-empty data. This leaves FS-108 AC4/FR-8300 permanently undeliverable by the
shipped system today — not merely an outstanding Demonstration item, as the package's own
Deviation note implies by bundling the whole Demonstration-scoped surface under the honestly-
disclosed BL-0039 CSS-only gap. A live scratch render independently confirmed `AssetTray`'s own
component logic is correct given real data — the defect is the missing data-delivery path, not
the component. One Low finding (F2) noted for the record, not blocking: the client's
`engage`-category gate (`chainRoles.includes('engage')`) is stricter than the real server code
(`engageAction.ts`/`EffectResolver.resolveEngagement` never check `chainRoles` at all) — a
previously-uncaught gap in IP-4010's own scope, not an IP-8010 defect, and not capable of causing
a post-hoc rejection (the client only ever hides a category the server would still accept, never
the reverse). Rebuilt from a genuinely clean `node_modules`; full suite green (96 tests: 1 shared +
80 server + 15 client, matching VR-7010-v2's count exactly). **IP-8010 stays `COMPLETE`**, routed
to `07-implementation-planning` first (F1 needs a new interface/data-delivery decision — a
template-catalog message type or a shared static catalog export — before `08-code-implementation`
can wire it and before any Demonstration pass on AC4/FR-8300 is even attemptable), then back to
`08-code-implementation`, for a fresh, independent `09-package-verification` pass. All 10 other
MVP packages remain `VERIFIED`; `10-integration-review` cannot yet proceed on the full MVP tranche
until IP-8010 itself reaches `VERIFIED`.

**`07-implementation-planning` has now planned the remediation** (2026-08-23, see IP-8010's own
`Remediation (VR-8010)` section): a new one-shot `TemplateCatalogMessage` (not a shared static
catalog — avoids reintroducing a BL-0027-family JSON/dist-copy problem and keeps content-authoring's
file ownership untouched), sent once per connection from `handleConnection`, built from a new
`TemplateRegistry.listAssetTemplates()` accessor; `AssetTemplate`/`MissionSetTemplate` move to
`shared/src/interfaces.ts` (pure relocation); `App.tsx`'s `deployableTemplates` becomes reactive
client state instead of a value frozen at mount. IP-8010 is now fully specified for
`08-code-implementation` to execute and re-submit.

**`08-code-implementation` has now executed the remediation** (2026-08-23): F1 fixed — a
`TemplateCatalogMessage` is sent once per connection from `handleConnection`, built from the new
`TemplateRegistry.listAssetTemplates()`; `AssetTemplate`/`MissionSetTemplate` relocated to
`shared/src/interfaces.ts`; `gameClient.ts` stores the catalog reactively; `App.tsx`/`main.tsx`
consume it instead of a frozen `[]` prop; a new `AssetTray.test.tsx` (2 tests) covers the
previously-missing non-empty-data render path, including that an ordinary `state-delta` doesn't
clear the static catalog. Build clean; full suite green (98 tests: 1 shared + 80 server + 17
client, up from 96). IP-8010 is `COMPLETE` and ready for a fresh, independent
`09-package-verification` pass — the last step before all 11 MVP packages are `VERIFIED`.

**IP-8010 was independently re-verified 2026-08-23 and `VERIFIED`** — see
`docs/implementation/verification/VR-8010-presentation-ui-v2.md`. The fix was live-exercised
through the real `createGameEngine()`→`createTransport()`→`handleConnection()` path (not just
`<App>` plus a hand-built message): a genuine `TemplateCatalogMessage` carrying all 7 of IP-3011's
real asset-type templates is sent exactly once per connection, byte-identical to both connections,
and never re-sent on a later `state-delta` push. `AssetTray.test.tsx`'s claims were independently
re-derived (no spread-order bug in `gameClient.ts`); the `AssetTemplate`/`MissionSetTemplate`
relocation confirmed non-breaking; the message-count test updates confirmed to reflect real new
behavior, not a loosened assertion. Build clean; full suite green (98 tests, matching the package's
own claim exactly). No findings. **All 11 MVP Implementation Packages now stand `VERIFIED`** — all
10 other packages re-confirmed still `VERIFIED` with no drift. The MVP tranche is ready for
`10-integration-review`.

**`10-integration-review` came back clean** (`docs/reviews/integration-review-mvp-tranche.md`, no
Critical/High findings) and **`11-release-readiness` produced an advisory-GO Release Assessment**
(`docs/reviews/release-assessment-mvp.md`) — but at the G4 gate, the owner deferred the GO/NO-GO
decision pending a real human playtest (MSTR-001 v0.4, C10). **`07-implementation-planning`
authored IP-9038** (2026-08-23) to close the blocker that decision surfaced: BL-0038 (no real
`WebSocketServer` bootstrap), BL-0027 (dist doesn't copy content JSON), and a disclosed
session-creation/join gap (BL-0055) FS-101's own W1 workflow assumed but no package ever built.
All of IP-9038's dependencies are `VERIFIED`; it is `READY` now.
