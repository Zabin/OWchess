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
| IP-2010 | FS-103 | `08-code-implementation` | **COMPLETE** (2026-08-22) — **RETURNED by VR-2010** (2026-08-22), needs fix + re-verify | IP-0010, IP-1010, IP-3010, IP-3011 | Release plan (FEAT-2000, MVP) |
| IP-5010 | FS-104 | `08-code-implementation` | **COMPLETE** (2026-08-22) | IP-0010, IP-1010, IP-3010, IP-3011 | Release plan (FEAT-5000, MVP) |
| IP-6010 | FS-106 | `08-code-implementation` | BLOCKED | IP-0010, IP-2010 | Release plan (FEAT-6000, MVP) |
| IP-4010 | FS-105 (code) | `08-code-implementation` | BLOCKED | IP-0010, IP-2010, IP-6010 | Release plan (FEAT-4000, MVP) |
| IP-4011 | FS-105 (content) | `08-content-authoring` | BLOCKED | IP-4010 | Release plan (FEAT-4000, MVP) |
| IP-7010 | FS-107 | `08-code-implementation` | BLOCKED | IP-0010, IP-1010, IP-6010 | Release plan (FEAT-7000, MVP) |
| IP-8010 | FS-108 | `08-code-implementation` | BLOCKED | all 10 above | Release plan (FEAT-8000, MVP) |

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

**IP-2010** (critical-path package) needs to return to `08-code-implementation` to fix VR-2010's
Critical finding F1 (tasking a sensor with no relevant `chainRoles` silently succeeds and spends AP
instead of being rejected) and then go through a fresh `09-package-verification` pass. Separately,
`09-package-verification` on **IP-5010** remains available next — it is `COMPLETE`, has every named
blocking dependency (IP-0010, IP-1010, IP-3010, IP-3011) `VERIFIED`, and is independently checkable
in parallel with IP-2010's fix cycle. IP-6010/IP-4010/IP-4011/IP-7010/IP-8010 remain `BLOCKED` on
further downstream dependencies regardless.
