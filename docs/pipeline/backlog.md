# Pipeline Backlog

Every finding, recommendation, Outstanding Issue, and Open Question a stage skill's run surfaces,
plus every feature request and bug report filed by `00-intake`, lands here as one row. IDs are
`BL-####`, sequential, never reused. Rows are appended or have their Status/Disposition updated in
place — never deleted; a rejected entry stays, marked `REJECTED` with the reason. Once a row flips
`DONE`/`REJECTED`, it moves to `docs/pipeline/backlog-archive.md` at the next triage sweep (see
`00-pipeline-manager`'s archiving convention) — that file does not exist yet because nothing has
been dispositioned to a terminal state.

**Disposition lifecycle:** `NEW` → `SCHEDULED` (names the step it rides with) / `DEFERRED` (names
its revisit trigger) / `NEEDS-USER` (names the exact decision required) / `REJECTED` (names the
reason) → `IN PIPELINE` → `DONE`. "We'll get to it" with no trigger is not a valid disposition.

**Writers:** `00-pipeline-manager` (harvest + triage + status flips) and `00-intake` (appends
`NEW` entries). No other stage skill writes this file directly.

| ID | Filed | Type | Summary | Sev/Pri | Entry stage | Disposition | Status |
|---|---|---|---|---|---|---|---|
| BL-0001 | 2026-08-21, GDS-01 (`docs/architecture/01-concept-of-operations.md`, OQ-11) | design-question | Whether maneuver/deploy transfer-time counts in the mover's own turns or in elapsed game-turns including the opponent's — ambiguous in GDS-01, needs a load-bearing decision before the data model can be built. | Medium | `03` | Resolved in GDS-03 (`docs/architecture/03-architecture.md`): counts in the mover's own turns only. | DONE |
| BL-0002 | 2026-08-21, GDS-01 (`docs/architecture/01-concept-of-operations.md`, OQ-12) | design-question | Whether passive detection (a player noticing they're being searched for, per SOR Appendix B's worked example) is a server-computed "detectability" signal or pure human inference from earned belief-state — affects whether `BeliefState`/`EffectResolver` need a detectability computation. | Medium | `03` | Resolved in GDS-03 (`docs/architecture/03-architecture.md`): pure human inference, no server mechanic in v1. | DONE |
| BL-0003 | 2026-08-21, GDS-04 (`docs/architecture/04-domain-model.md`, OQ-13) | research-gap | Exact orbital-regime/plane-class taxonomy (how many altitude bands, how many plane classes) needs grounding in what a real Kepler+J2 propagation naturally clusters into, before GDS-07 (Data Model) can pin down a concrete schema. | Medium | `02` | Resolved by R-203 (`docs/research/R-203-regime-plane-class-taxonomy.md`): recommends 9 named regimes (3 altitude bands x 3 plane classes). GDS-07 to formally adopt. | DONE |
| BL-0005 | 2026-08-21, R-203 (`docs/research/R-203-regime-plane-class-taxonomy.md`, §Sources) | research-gap | The J2 nodal-precession formula/coefficient cited in R-203 is single-sourced (a calculator blog, not a primary astrodynamics reference) — needs cross-verification against a primary source (e.g. Vallado) before `Propagator`'s actual numerical implementation. | Low | `02` (before `07`/`08` implement `Propagator`'s numerical core) | DEFERRED — revisit trigger: `07-implementation-planning`/`08-code-implementation` beginning the `Propagator` numerical implementation. Not needed for GDS-07's schema-level taxonomy adoption (classification labels only, no formula used there). | NEW |
| BL-0004 | 2026-08-21, GDS-06 (`docs/architecture/06-non-functional-requirements.md`) | finding | NFR-4002 (never show an action as available then reject it) vs. server-authoritative-only design: satisfying it without added latency needs bounded, intentional client-side legality-rule duplication (kept in sync via the shared-types mechanism from ADR-0001), not a bare ask-then-render. | Low | `03` (GDS-08/09) | SCHEDULED — rides with GDS-08 (Presentation Architecture) and GDS-09 (Interface Specification). | NEW |
