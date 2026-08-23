# Requirements — Index

- **Owned by:** `04-requirements-engineering` · **Status:** ✅ v1 baseline authored 2026-08-21;
  training-corpus family (FR-9000/NFR-10000) added 2026-08-23 per MSTR-001 C10 (v0.4).

| Document | Contents | Status |
|---|---|---|
| [`01-functional-requirements.md`](01-functional-requirements.md) | FR-1000–8500, FR-9000 (training corpus, new), plus 3 Candidate Requirements | ✅ Authored |
| [`02-non-functional-requirements.md`](02-non-functional-requirements.md) | NFR-1100–9200, NFR-10000 (training corpus, new) | ✅ Authored |
| [`03-requirements-review.md`](03-requirements-review.md) | 4 baseline findings (1 closed inline, 3 open Low-severity) + 2 delta findings for FR-9000/NFR-10000 (both Low) | ✅ Authored |
| [`04-requirements-traceability-matrix.md`](04-requirements-traceability-matrix.md) | Full FR/NFR/CR matrix, forward columns honestly `UNASSIGNED` | ✅ Authored |
| [`requirements-change-log.md`](requirements-change-log.md) | Dated delta-update log (first entry: the FR-9000/NFR-10000 addition) | ✅ Authored |

This baseline resolves OQ-05 (asset costs), OQ-06 (mission-denial threshold), OQ-07 (session
length/tiebreak), and OQ-10 (AP cadence) with first-guess v1 numeric values — see
`01-functional-requirements.md`'s tuning table for each value's rationale. Three items remain
genuinely deferred as Candidate Requirements (belief-state decay rate, disconnect grace period,
maneuver fuel/transfer-time table) — not gaps, but explicit hand-offs to `06-feature-
specification` (and, for the maneuver table, `02-research-orbital-and-tooling` first).
