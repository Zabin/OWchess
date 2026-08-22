# Requirements — Index

- **Owned by:** `04-requirements-engineering` · **Status:** ✅ v1 baseline authored 2026-08-21

| Document | Contents | Status |
|---|---|---|
| [`01-functional-requirements.md`](01-functional-requirements.md) | FR-1000–8500, plus 3 Candidate Requirements | ✅ Authored |
| [`02-non-functional-requirements.md`](02-non-functional-requirements.md) | NFR-1100–9200 | ✅ Authored |
| [`03-requirements-review.md`](03-requirements-review.md) | 4 findings (1 closed inline, 3 open Low-severity) | ✅ Authored |
| [`04-requirements-traceability-matrix.md`](04-requirements-traceability-matrix.md) | Full FR/NFR/CR matrix, forward columns honestly `UNASSIGNED` | ✅ Authored |

This baseline resolves OQ-05 (asset costs), OQ-06 (mission-denial threshold), OQ-07 (session
length/tiebreak), and OQ-10 (AP cadence) with first-guess v1 numeric values — see
`01-functional-requirements.md`'s tuning table for each value's rationale. Three items remain
genuinely deferred as Candidate Requirements (belief-state decay rate, disconnect grace period,
maneuver fuel/transfer-time table) — not gaps, but explicit hand-offs to `06-feature-
specification` (and, for the maneuver table, `02-research-orbital-and-tooling` first).
