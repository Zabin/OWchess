# Master Build Plan

- **Owned by:** `07-implementation-planning` (structure/sequencing) — status column advanced by
  `08-*`/`09-package-verification` only. **Status:** authored 2026-08-22, MVP tranche.

## Status ledger

| Package | FS/BL | Owning 08 peer | Status | Blocking dependencies | G3 basis |
|---|---|---|---|---|---|
| IP-0010 | — (scaffold) | `08-code-implementation` | **VERIFIED** (2026-08-22, VR-0010) | none | Release plan (MVP needs a codebase) |
| IP-1010 | FS-101 | `08-code-implementation` | READY | IP-0010 (VERIFIED) | Release plan (FEAT-1000, MVP) |
| IP-3010 | FS-102 (code) | `08-code-implementation` | BLOCKED | IP-0010, IP-1010 | Release plan (FEAT-3000, MVP) |
| IP-3011 | FS-102 (content) | `08-content-authoring` | BLOCKED | IP-3010 | Release plan (FEAT-3000, MVP) |
| IP-2010 | FS-103 | `08-code-implementation` | BLOCKED | IP-0010, IP-1010, IP-3010, IP-3011 | Release plan (FEAT-2000, MVP) |
| IP-5010 | FS-104 | `08-code-implementation` | BLOCKED | IP-0010, IP-1010, IP-3010, IP-3011 | Release plan (FEAT-5000, MVP) |
| IP-6010 | FS-106 | `08-code-implementation` | BLOCKED | IP-0010, IP-2010 | Release plan (FEAT-6000, MVP) |
| IP-4010 | FS-105 (code) | `08-code-implementation` | BLOCKED | IP-0010, IP-2010, IP-6010 | Release plan (FEAT-4000, MVP) |
| IP-4011 | FS-105 (content) | `08-content-authoring` | BLOCKED | IP-4010 | Release plan (FEAT-4000, MVP) |
| IP-7010 | FS-107 | `08-code-implementation` | BLOCKED | IP-0010, IP-1010, IP-6010 | Release plan (FEAT-7000, MVP) |
| IP-8010 | FS-108 | `08-code-implementation` | BLOCKED | all 10 above | Release plan (FEAT-8000, MVP) |

**IP-0010 is `VERIFIED`** (implemented 2026-08-22; independently verified 2026-08-22 by
`09-package-verification` — see
[VR-0010](verification/VR-0010-project-scaffold.md); 3 Low/Medium non-blocking findings recorded,
none affecting the result). This unblocks its sole direct dependent: **IP-1010 is now `READY`**
(fully specified and its only dependency, IP-0010, is `VERIFIED`). IP-3010/IP-2010/IP-5010/etc.
remain `BLOCKED` — each still depends on packages (IP-1010 and beyond) that are not yet
`VERIFIED`.

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

`08-code-implementation` on **IP-1010** (now `READY` — its sole dependency, IP-0010, is
`VERIFIED`) — the critical-path package for FS-101 (Session & Turn Lifecycle).
