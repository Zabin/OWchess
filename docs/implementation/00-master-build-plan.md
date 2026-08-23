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
| IP-4011 | FS-105 (content) | `08-content-authoring` | **COMPLETE** (2026-08-22) | IP-4010 (VERIFIED) | Release plan (FEAT-4000, MVP) |
| IP-7010 | FS-107 | `08-code-implementation` | **COMPLETE** (2026-08-22) | IP-0010, IP-1010, IP-6010 (all VERIFIED) | Release plan (FEAT-7000, MVP) |
| IP-8010 | FS-108 | `08-code-implementation` | **COMPLETE** (2026-08-23 — IP-4011/IP-7010 still awaiting their own verification) | all 10 above | Release plan (FEAT-8000, MVP) |

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

**IP-5010, IP-2010, IP-6010, and IP-4010 are all `VERIFIED`** (see VR-5010, VR-2010-v2, VR-6010,
and VR-4010 above) — no further action needed on any of them. **IP-7010 is `READY`** (all three
named blocking dependencies — IP-0010, IP-1010, IP-6010 — are `VERIFIED`): a package due for
`08-code-implementation`. **IP-4011** (already `COMPLETE`; its sole named blocking dependency,
IP-4010, is now `VERIFIED`) is the next package eligible for its own `09-package-verification`
pass. IP-8010 (depends on all 10 other packages) remains `BLOCKED`/not yet eligible.
