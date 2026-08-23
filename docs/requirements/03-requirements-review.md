# Requirements Review — v1 Baseline

- **Owned by:** `04-requirements-engineering` · **Status:** ✅ Authored, 2026-08-21
- **Reviewed:** `01-functional-requirements.md`, `02-non-functional-requirements.md` (final content,
  after two self-caught gaps were closed during authoring — see Notes below)
- **Scope:** report only; no fixes applied by this document.

## Notes on the reviewed baseline

Two issues were caught and corrected **during** authoring, before this baseline was considered
final, and are recorded here for transparency rather than left as open findings:

1. A missing win-condition requirement (King destruction ending the game) — added as **FR-1405**.
2. A dependency-field typo citing the seed SOR's own requirement ID (`FR-4005`) instead of this
   baseline's ID (`FR-4400`) in FR-1420's Dependencies field — corrected.

Both are self-authoring corrections, not findings on a frozen baseline — listed for honesty, not
counted in the findings table below.

## Findings

| # | Finding type | IDs involved | Description | Severity | Recommendation |
|---|---|---|---|---|---|
| RF-01 | Ambiguity | FR-4400 | "6 consecutive turns" does not explicitly state whether it counts total elapsed game turns (both players' turns combined) or only the King-owner's own turns. GDS-03's OQ-11 resolution establishes a *different* convention (owner's-own-turns) for maneuver/deploy transfer time specifically — a reader could over-generalize that convention to this unrelated mechanism (a continuously-active effect state, checked every turn regardless of active player, not a turn-budgeted countdown). | Medium | Add an explicit clause to FR-4400: "counted in total elapsed game turns, not the mover's-own-turns convention FR-5400 uses for maneuver transfer time" — a one-sentence disambiguation, not a design change. |
| RF-02 | Missing rationale depth | NFR-1100, NFR-1200 | The 3-second turn-latency budget and the <100ms propagation-compute target are this pass's own reasoned choices (stated inline) but are not grounded in any empirical network/performance data — there is none to ground them in yet, since no test harness exists. | Low | Revisit both values once `07`/`08` produce a real latency-measurement harness; until then, treat them as the first-guess placeholders they are (already tagged as such per this project's own convention). |
| RF-03 | Overlap / weak cross-reference | FR-6100, NFR-3100 | Both state the same fog-of-war boundary from two angles (client must never hold ground truth vs. server must never transmit it) without cross-referencing each other directly — a reader auditing one might not notice the other exists. | Low | Add "See also FR-6100"/"See also NFR-3100" cross-references when this document is next revised (a wording-only fix, not urgent enough to block advancing to `05`). |
| RF-04 | Verification-method justification | FR-8100–FR-8500 | Five UI-rendering requirements use `Demonstration` as their Verification Method without an inline justification sentence, though the skill's own rule requires justifying anything but `Test`. | Low | When `06-feature-specification`/`07-implementation-planning` design the actual client test setup, revisit whether component/snapshot tests can convert some of these to `Test`; where genuinely not (visual/UX judgment calls), add the missing one-sentence justification. |

No Critical or High findings. No duplicate requirements, no architecture violations (against
GDS-01–10 or ADR-0001), and no impossible requirements were found. No numeric value in the
baseline is missing a stated rationale (this document's own tuning table covers every one).

## Disposition

RF-01 (the only Medium) was closed immediately — a one-sentence disambiguation added to FR-4400
— since it was cheap enough not to carry forward. RF-02/03/04 (all Low) remain open, routed to
their named owner above; none blocks advancing to `05-feature-decomposition`.

## Delta review — FR-9000/NFR-10000 (Training Corpus, 2026-08-23)

Per this project's own delta-update convention (a targeted re-run of Step 3 focused on the
change, not a wholesale re-review): reviewed the new FR-9000 family (`01-functional-
requirements.md`) and NFR-10000 category (`02-non-functional-requirements.md`) for duplicates,
conflicts, ambiguity, missing verification, and missing traceability, against the existing
baseline and against MSTR-001 C10/GDS-00's companion section.

| # | Finding type | IDs involved | Description | Severity | Recommendation |
|---|---|---|---|---|---|
| RF-05 | Sequencing dependency, correctly stated but worth flagging | FR-9410, FR-9420 | Both leaves' own Dependencies field already names BL-0038's real server bootstrap as a precondition — correctly disambiguating "this requirement exists now" from "this requirement is satisfiable now." No fix needed; noted here so `05`/`06`/`07` don't mistake the dependency note for an oversight. | Low | None — already handled correctly in the FR text itself. |
| RF-06 | Verification-method justification | FR-9110, FR-9120, FR-9210, FR-9310, NFR-10100, NFR-10200 | All Inspection-verified, consistent with this family's own stated nature ("the corpus is prose, not code") — same category of justification gap RF-04 already flagged for FR-8100–8500's Demonstration methods, now recurring for Inspection. | Low | Same disposition as RF-04: acceptable for a documentation-artifact family: revisit only if a future stage finds a cheap automatable check for one of these (e.g. a link-checker script for FR-9210's bidirectional consistency). |

No Critical/High findings, no duplicates, no conflicts with the existing FR-1000–8500/NFR-1100–9200
baseline or with ADR-0001, and no numeric value in the new family lacks a stated rationale (the
family has no numeric tuning values at all — it is a coverage/process/currency family, not a
gameplay-tuning one). Both new findings (RF-05, RF-06) are Low and non-blocking, following the
same disposition pattern already established for RF-02–04. **Nothing blocks this delta from
advancing.**
