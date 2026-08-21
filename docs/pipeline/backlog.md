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

*(empty — this is the pipeline's initial state; the first entries will be filed once `01-vision`
or a later stage surfaces a finding, or `00-intake` files a request)*
