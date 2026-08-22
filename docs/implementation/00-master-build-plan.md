# Master Build Plan

- **Owned by:** `07-implementation-planning` (structure/sequencing) — status column advanced by
  `08-*`/`09-package-verification` only. **Status:** authored 2026-08-22, MVP tranche.

## Status ledger

| Package | FS/BL | Owning 08 peer | Status | Blocking dependencies | G3 basis |
|---|---|---|---|---|---|
| IP-0010 | — (scaffold) | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-0010) | none | Release plan (MVP needs a codebase) |
| IP-1010 | FS-101 | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-1010-v2) | IP-0010 (VERIFIED) | Release plan (FEAT-1000, MVP) |
| IP-3010 | FS-102 (code) | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-3010) | IP-0010, IP-1010 (both VERIFIED) | Release plan (FEAT-3000, MVP) |
| IP-3011 | FS-102 (content) | `08-content-authoring` | **COMPLETE** (2026-08-22) | IP-3010 | Release plan (FEAT-3000, MVP) |
| IP-2010 | FS-103 | `08-code-implementation` | **COMPLETE** (2026-08-22) | IP-0010, IP-1010, IP-3010, IP-3011 | Release plan (FEAT-2000, MVP) |
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

`09-package-verification` on **IP-3011** next — its sole blocking dependency, IP-3010, is now
`VERIFIED`. IP-2010 and IP-5010 (both `COMPLETE`) remain gated on IP-3011's own `VERIFIED` status
before either can flip to `READY`; IP-6010/IP-4010/IP-4011/IP-7010/IP-8010 remain `BLOCKED` on
further downstream dependencies regardless.
