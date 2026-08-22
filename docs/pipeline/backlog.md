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
