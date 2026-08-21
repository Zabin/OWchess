---
name: 04-requirements-engineering
description: Transform an approved architecture baseline (research corpus, GDS ladder, ADRs) into a traceable requirements baseline under docs/requirements/ — hierarchical Functional Requirements (FR-####), Non-Functional Requirements (NFR-####), a Requirements Review report, and a Requirements Traceability Matrix. Use when asked to "derive requirements from the architecture," "write functional/non-functional requirements," "build a traceability matrix," "review the requirements for conflicts/gaps/duplicates," or as the stage-04 step of the project's first, from-scratch increment (derive the requirements from the GDS-05/06 architecture levels — there is no shipped game's verified behaviors to derive from yet). This skill performs no new research, no architecture redesign, and no implementation — it is a pure derivation-and-bookkeeping step. Do not use it to originate domain knowledge (02-research-*) or to make architecture decisions (03-architecture-design-synthesis). This is also the stage that sets AP/action costs, asset costs, and win-condition thresholds — the Statement of Requirements explicitly defers those numeric values here, not upstream.
---

# Requirements Engineering

Turns an **approved architecture baseline** into a **traceable requirements baseline**. Strictly
downstream of research and architecture; strictly upstream of feature planning and
implementation. It does not do either neighbor's job.

## What this is for (and what it is not)

One question: *given what has already been researched and architected, what must OW Chess's
engine, transport, and clients do, how well must they do it, and can every one of those statements
be traced back to a source and forward to a test?*

It SHALL NOT:

- **Perform new research.** A requirement needing a fact not in the inputs is a gap to report,
  not a fact to invent or look up.
- **Redesign the architecture.** A wrong/ambiguous/self-contradictory architecture statement is a
  Review finding, never patched by writing around it.
- **Implement code.** Requirements describe observable behavior, not implementation.
- **Invent requirements not supported by the inputs.** Anything untraceable goes to **Candidate
  Requirements**, explicitly excluded from the baseline, never silently promoted.

Authoritative inputs (read-only): `docs/research/` · the GDS ladder (`docs/architecture/`,
especially GDS-01…GDS-09) · `docs/architecture/adr/` · and, once they exist, the automated test
suite (each of its checks is evidence of a required, already-verified behavior) and `CLAUDE.md`'s
Known Good Behavior list. On the project's first, from-scratch increment neither exists yet — the
GDS ladder is the sole source. **If inputs conflict, report the conflict in the Review — never
resolve it unilaterally.**

**This is the stage that owns numeric tuning values.** The Statement of Requirements deliberately
defers AP/action costs, asset costs, and win-condition thresholds to stage 04 (baseline numbers)
and stage 06 (feature-level refinement) — every such value that appears in an FR/NFR's Acceptance
Criteria here must be a deliberate decision of this pass, cited to its own rationale (a design
tradeoff argued in-line, or an ADR if the number is architecturally load-bearing), never carried
forward from an upstream document's illustrative placeholder as if it were already decided.

## Outputs

Always exactly these four files, in this order, under `docs/requirements/` (plus the directory's
`INDEX.md`):

1. `docs/requirements/01-functional-requirements.md`
2. `docs/requirements/02-non-functional-requirements.md`
3. `docs/requirements/03-requirements-review.md`
4. `docs/requirements/04-requirements-traceability-matrix.md`

## Workflow

Work the four steps in order; each step's output is the next step's input.

### Step 0 — Read the inputs and build a source map

Read every input document. Keep a working inventory (notes, not a deliverable) of: every distinct
**capability** GDS-01/GDS-05 implies; every **entity/relationship** in GDS-04; every **binding
ADR**; anything that reads as a requirement but has **no traceable source** (→ Candidate
Requirements later).

### Step 1 — Functional Requirements (`01-functional-requirements.md`)

Hierarchical, 4-digit gapped numbering (`FR-1000` capability → `FR-1100` major function →
`FR-1110` sub-function → `FR-1111` atomic leaf). Suggested capability groupings for this project
(adapt to what GDS-05 actually says): FR-1xxx turn/session lifecycle (deployment, strict
alternation, win-condition check) · FR-2xxx the F2T2E chain (find/fix/track/target/engage
mechanics per asset type) · FR-3xxx asset roster & mission sets (SATCOM/ISR/PNT-lite, per-asset
capabilities) · FR-4xxx effect resolution (the Five D's — Deceive/Disrupt/Deny/Degrade/Destroy)
· FR-5xxx orbital regime & propagation (LEO/MEO/GEO-analog presentation, `Propagator` boundary)
· FR-6xxx fog-of-war / belief-state (what each player can and cannot see, how belief updates)
· FR-7xxx server-authoritative session & transport (WebSocket turn-change push, reconnection) ·
FR-8xxx presentation/UI (board rendering, turn indicators — tentative React+TypeScript).

**Every leaf requirement carries this fixed field set** (an explicit "None" is informative; a
missing field is not): ID · Title · Description · Rationale (cite the source statement) ·
Priority (state the scale once) · Inputs · Outputs · Preconditions · Postconditions · Acceptance
Criteria (checkable by a tester with no design context) · Dependencies · Verification Method
(Test/Demonstration/Analysis/Inspection — justify anything but Test) · Source Documents (exact
file + section) · Related ADRs · Notes.

**Writing rules** (FR and NFR alike): atomic (split "and"s) · unambiguous (no "should generally")
· testable · implementation-independent ("the engine shall reveal a tracked asset's regime to the
tracking player but not its exact orbital elements," not "set `belief.regime = REGIME_LEO`") ·
consistent (contradictions are Review findings) · traceable ("implied by the architecture" is not
a citation) · complete (every Step-0 capability has ≥1 FR, or the gap is a Review finding).

End with a `## Candidate Requirements` section for anything untraceable — same fields, explicitly
excluded from the numbered baseline, marked `CANDIDATE — NOT BASELINED` in the matrix.

### Step 2 — Non-Functional Requirements (`02-non-functional-requirements.md`)

Same ID discipline (`NFR-####`), same fields and rules, under these category headings in order —
writing "(none derivable from inputs — see Candidate Requirements)" rather than inventing:
Performance (turn-latency budget, WebSocket message-delivery timing) · Reliability (reconnection,
mid-game disconnect handling) · Maintainability (module boundary discipline) · State Integrity
(server-authoritative, fog-of-war non-leakage) · Security (anti-cheat posture given no accounts/no
DB in v1) · Portability (browser targets) · Usability (turn clarity, hidden-information UX) ·
Testability · Build Reproducibility · Extensibility (adding a mission set/asset type later).

Numbers in Acceptance Criteria must come from a source document or be a deliberate decision of
this pass (see "numeric tuning values" above) — never from generic convention; every such decision
states its rationale inline.

### Step 3 — Requirements Review (`03-requirements-review.md`)

Review the full FR+NFR set (plus Candidates) for: duplicates · conflicts (incl. vs. ADRs) ·
ambiguities · missing requirements · impossible requirements · architecture violations · missing
verification · missing traceability · any numeric value asserted without a stated rationale. One
finding per row: `Finding type | IDs involved | Description | Severity | Recommendation`.
**Report only — apply nothing**; fixes are an explicit, separate follow-up.

### Step 4 — Traceability Matrix (`04-requirements-traceability-matrix.md`)

One row per FR/NFR (Candidates marked). Columns: `Req ID | Title | Research Source |
Architecture Section | ADR | Module | Feature Spec | Implementation Package | Test`. Fill the
trace-back columns from Steps 0–3; the forward columns (Module, FS, IP, Test) get `UNASSIGNED`
where nothing exists yet — **never invent a forward reference**. Once an automated test suite
exists, the Test column can be filled honestly from its named checks.

## Quality gate

- [ ] Every FR/NFR has all fields populated (or explicitly None with a reason).
- [ ] Every leaf is atomic, unambiguous, testable, implementation-independent.
- [ ] Every numbered requirement has a real Source Documents citation with a section.
- [ ] Every numeric tuning value carries its own stated rationale — none silently inherited from
      an upstream illustrative placeholder.
- [ ] No baseline requirement contradicts another or an ADR — violations pulled to Candidates or
      flagged in the Review, never silently kept.
- [ ] The Review reviewed the final 01/02 content and applied no fixes.
- [ ] The matrix uses `UNASSIGNED` honestly; nothing originated a new fact, decision, or code.

## Gotchas

- Don't let Step 1/2 become design: a requirement naming a wire-format field or a database schema
  has crossed into implementation — push back to observable behavior (the Data Model level GDS-07
  owns those specifics).
- Don't backfill a matrix cell with a plausible guess — `UNASSIGNED` is the honest state.
- Delta updates (an ADR/GDS change): re-run Step 0 on the delta only, fix only the affected
  FR/NFRs, add a dated changelog note (`docs/requirements/requirements-change-log.md`), re-run
  Step 3 focused on the change, update affected matrix rows — not a wholesale regeneration.

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 04 — Requirements Engineering** of the documentation-driven-development
pipeline (see [`.claude/skills/README.md`](../README.md)). Upstream:
`03-architecture-design-synthesis`. Downstream: `05-feature-decomposition`.

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — which of the four deliverables were produced or updated (paths), plus any
   changelog entries.
2. **Recommendations** — the Review's key findings (conflicts, gaps, candidates) and who owns
   each: architecture conflicts → `03-architecture-design-synthesis`, missing domain facts → the
   owning `02-research-*` skill, adjudication calls → the owner.
3. **Next step** — if the Review surfaced Critical/High findings, resolve those upstream first
   and re-run the affected steps; once the baseline is approved (findings adjudicated, candidates
   dispositioned), advance to `05-feature-decomposition`.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
