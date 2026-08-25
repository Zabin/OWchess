---
name: 03-architecture-design-synthesis
description: Synthesize the vision (GDS-00/MSTR-001) and research grounding (docs/research/ R-1xx/R-2xx) into Design Synthesis documents under docs/architecture/ — either the global, gated GDS-00…GDS-10 ladder (Vision → Concept of Operation → System Context → Architecture → Domain Model → Functional Requirements → Non-functional Requirements → Data Model → Presentation Architecture → Interface Specification → Requirements Traceability Matrix) or a per-capability-cluster ADS-xxx document, the bridge between vision+research and a Feature Specification. Also owns ADR-#### Architecture Decision Records under docs/architecture/adr/ — including the tentative-tech-stack confirmation decision. Use when asked "what are the core concepts," "which mechanics are actually required," "which requirements conflict," "what assumptions must be made," to advance the next level of the GDS ladder, to record an ADR, or to produce a design synthesis before drafting or revising an FS-###. This produces design documents, not research documents — do not use it to add new doctrine/orbital-mechanics/tooling claims (that's the 02-research-* skills) — and no code.
---

# Architecture / Design Synthesis

Produces three kinds of document under `docs/architecture/`, all tracked in
[`docs/architecture/INDEX.md`](../../../docs/architecture/INDEX.md):

1. **The global ladder (`GDS-00`…`GDS-10`)** — one instance for the whole project, strictly
   sequential and gated. (`GDS-00` Vision is the exception: owned by `01-vision`; this skill
   authors `GDS-01` onward and hands any Vision-layer edit to `01-vision`.) The ladder is
   scaffolded with stub files carrying each level's Purpose and merge gate; the next unauthored
   `GDS-NN` is the default thing to work on when invoked without a more specific target.
2. **Per-cluster `ADS-xxx`** — zero-or-more documents, one per capability cluster with real
   design tension the ladder doesn't resolve at the system level.
3. **ADRs (`docs/architecture/adr/ADR-####-slug.md`)** — dated, numbered records of binding
   design decisions (e.g. "confirm React+TypeScript/Node.js+TypeScript/WebSocket as the actual
   stack, not merely a candidate," "the `Propagator` interface's exact method contract," "how
   fog-of-war belief-state diffs are computed and pushed"). On this project's from-scratch first
   increment there is no shipped code to mine decisions from — ADRs are recorded as each decision
   is actually made, forward, not retrofitted from an artifact.

## The ladder levels (this project's names)

| Level | Content | Primary sources |
|---|---|---|
| GDS-00 Vision | owned by `01-vision` | `MSTR-001` |
| GDS-01 Concept of Operation | who plays, the turn structure (strict alternation, chess-style), the core loop (deploy → find/fix/track → target/engage → win-condition check), the F2T2E chain at player altitude | `01-vision`, direct owner input, R-1## |
| GDS-02 System Context | client/server boundary, the WebSocket transport, session lifecycle (no accounts/no DB in v1 — in-memory per-session state), external constraints | `01-vision`, R-2## |
| GDS-03 Architecture | module decomposition (candidates: `GameEngine`, `Propagator`, `BeliefState`/fog-of-war tracker, `EffectResolver`, `TurnManager`, WS transport layer, client UI layer), one-job-per-module rule, the `Propagator` interface boundary contract | GDS-01/02, R-2## |
| GDS-04 Domain Model | entities: King (secret satellite), asset roster (wide-area SDA radar, ground tracking array, space-based SDA sensor, optical/imaging sensor, kinetic/RPO effector, EW/jamming effector), mission sets (SATCOM, ISR, PNT-lite), the Five D's effect taxonomy, orbital regimes (LEO/MEO/GEO-analog), per-player belief state | GDS-01, R-1##/R-2## |
| GDS-05 Functional Requirements | capability-level FRs the requirements baseline elaborates | GDS-01/04 |
| GDS-06 Non-functional Requirements | server authority/anti-cheat posture, turn-latency budget, WebSocket reliability, fog-of-war integrity (no client-side leakage of hidden state), test-coverage bar | GDS-02/03, R-2## |
| GDS-07 Data Model | server-side game-state schema, per-player belief-state schema, session/turn record shape (in-memory, v1) | GDS-03/04 |
| GDS-08 Presentation Architecture | board/UI composition (tentative React+TypeScript), how fog-of-war is rendered without leaking hidden state, turn-change notification UX | GDS-04/07 |
| GDS-09 Interface Specification | the module contracts: `Propagator` interface, WebSocket message schema, `GameEngine`/`BeliefState`/`EffectResolver` surfaces | GDS-03/07/08 |
| GDS-10 Requirements Traceability Matrix level | how traceability is carried (defers detail to `docs/requirements/`) | `docs/requirements/` once authored |

## What this is for (and what it is not)

This skill answers, before a Feature Specification can commit to a shape: What are the core
concepts? Which mechanics are actually required vs. nice-to-have? Which candidate requirements
conflict, and how is the conflict resolved? What assumptions must be made explicit? What is the
minimum viable implementation? What is deferred?

It consumes `docs/research/` as **input**, never as something it adds to. If a synthesis reveals
a genuine domain-knowledge gap, that gap is handed to the owning `02-research-*` skill to close
first. It produces **design documents, not research documents**: synthesis, decision, and
explicit tradeoffs, citing its grounding — never re-deriving it. It never invents a numeric
tuning value (AP/action cost, asset cost, win-condition threshold) — those are 04/06's job;
anything illustrative here is marked as such.

**Not every feature needs an ADS.** A small/uncontested feature can go straight to `FS-###` —
the FS author absorbs the synthesis into that document's own §1–2. Reach for an ADS when a
capability cluster has real design tension: conflicting candidate requirements, multiple
plausible architectures, or load-bearing assumptions nobody has written down (e.g. exactly how
much of a player's belief state is invalidated when the opponent moves an asset).

## Workflow A — the global ladder (default)

1. **Find the next unauthored level** in `docs/architecture/INDEX.md` §1 (first row still
   `PLANNED (scaffold only)`). Levels must be done in order — never jump ahead.
2. **Confirm the gate on the *previous* level is actually closed** — every merge-gate box checked
   and the merge decision recorded in prose in that document. If not, finish that gate first.
3. **Author the level's content**, replacing its stub body, pulling in the "primary sources"
   named above — pull the actual content in, don't cite it from a distance. On this project's
   from-scratch first pass there is no shipped design to describe as-built: synthesize forward
   from the vision and research grounding, and record real design tensions as Open Questions
   (`OQ-##`) rather than silently resolving them without evidence.
4. **Close the level's merge gate**: check each box and record the actual merge decision (does
   the merged-from text become a pointer to this level, stay authoritative, or split?).
5. **Update the level's Status** (done, or in-progress if the merge isn't fully closed — in which
   case the next level still may not start) in `docs/architecture/INDEX.md` §1.
6. **Cross-link** the merged-from documents if the merge decision calls for it.
7. **Commit** as `docs(architecture): GDS-NN — <what changed>`. **Stop at the level just closed**
   — one level per pass unless explicitly asked otherwise.

## Workflow B — per-cluster ADS-xxx

1. Identify the capability cluster; which R-1xx/R-2xx topics ground it; whether an FS-### would
   consume it.
2. Check `docs/architecture/INDEX.md` §2 for existing coverage; if a gap exists, add the index
   row (`PLANNED`) before writing — index-before-content.
3. Draft the ten fixed sections, in order: Executive Design Overview · System Architecture ·
   Domain Model · User Stories · Functional Requirements · Non-functional Requirements ·
   Constraints · Risks · Open Questions · Decision Log.
4. Metadata block: Dependencies (the R-1xx/R-2xx it synthesizes), Produces (the FS-### it feeds).
   ~8–15 pages; split `ADS-xxxA`/`ADS-xxxB` rather than sprawl.
5. Cross-link both directions, flip status, update INDEX together, commit as
   `docs(architecture): ADS-xxx — <what changed>`.

## Workflow C — ADRs

One decision per `ADR-####` file: Context · Decision · Status (accepted/superseded) ·
Consequences. Add the row to `docs/architecture/adr/INDEX.md`. ADRs are append-only history —
supersede, never rewrite. The tech-stack confirmation ADR (React+TypeScript / Node.js+TypeScript /
WebSocket / in-memory per-session state) is the natural first candidate — until it exists, every
other artifact must keep citing that stack as tentative.

## Quality gate

- [ ] (Ladder) The previous level's merge gate was verified closed before this level started, and
      this level's own gate is closed with the decision recorded in prose.
- [ ] (ADS) All ten sections present, in order, none a placeholder; every FR traces to a cited
      R-1xx/R-2xx/GDS source; Open Questions genuinely open, decisions in the Decision Log.
- [ ] No production code, no literal schema/wire-format detail where the level doesn't call for it.
- [ ] No numeric tuning value invented — deferred explicitly to 04/06.
- [ ] `docs/architecture/INDEX.md` updated.
- [ ] No new research claims originated here — gaps routed to the owning `02-research-*` skill.

## Gotchas

- Don't let this skill become a backdoor for adding research content — it cites, it doesn't
  originate domain knowledge.
- Never start `GDS-(N+1)` before `GDS-N`'s merge gate is fully closed with the decision recorded
  in prose.
- The ladder layers on top of `CLAUDE.md`/`memory.md` once those exist — as living developer
  quick-references they may accumulate detail ahead of a given ladder level being formally
  authored; a level's merge step decides which document carries which statement going forward.
- An ADS's Decision Log is the load-bearing artifact for whoever drafts the downstream FS-### —
  an unrecorded decision effectively didn't happen.

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 03 — Architecture & Design Synthesis** of the documentation-driven-development
pipeline (see [`.claude/skills/README.md`](../README.md)). Upstream: `01-vision` and the
`02-research-*` skills. Downstream: `04-requirements-engineering`.

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — every GDS level/ADS/ADR produced or updated (paths), every merge gate
   closed, every index status flipped.
2. **Recommendations** — Open Questions raised, domain-knowledge gaps handed to `02-research-*`,
   and who owns each follow-up.
3. **Next step** — if a domain-knowledge gap blocked this run, name the owning `02-research-*`
   skill, then re-invoke this skill; if more GDS levels remain unauthored, re-invoke this skill
   for the next level (one level per pass); once the levels the current increment needs are
   authored with closed gates, advance to `04-requirements-engineering`.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
