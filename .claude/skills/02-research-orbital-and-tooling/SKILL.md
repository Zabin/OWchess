---
name: 02-research-orbital-and-tooling
description: Produce or refresh expert-level, citation-grounded research on the orbital-mechanics and systems-tooling grounding OW Chess needs — simplified discrete orbital regimes (LEO/MEO/GEO-analog) backed by real hybrid Kepler+J2 propagation math, the Propagator interface boundary, server-authoritative/fog-of-war architecture patterns, WebSocket turn-notification transport, and verification/testing tooling for a Node.js+TypeScript/React+TypeScript stack (tentative — not yet owner-confirmed). Use when asked to research orbital mechanics, propagator design, real-time multiplayer transport, or testing/verification tooling for this stack, to add/extend docs/research/ R-2xx topics, or to gather implementation-grounding facts before drafting a GDS level or an FS-###/IP-#### that touches orbital math, session state, or the WebSocket boundary. Not for beginner tutorials — every topic is written for an agent about to implement or verify code that must be numerically/architecturally correct.
---

# Research: Orbital Mechanics & Tooling

Produces the **R-2xx tier** of the research corpus (`docs/research/R-2##-*.md`) — the technical
facts an agent needs to implement OW Chess's orbital simulation and server/client architecture
correctly. The tier is tracked in [`docs/research/INDEX.md`](../../../docs/research/INDEX.md),
which lists the planned topics; this skill authors them index-first.

## What this is for (and what it is not)

This skill exists to answer: "if an agent is about to implement or spec something touching orbital
propagation, the `Propagator` interface, server-authoritative session state, fog-of-war belief
tracking, WebSocket turn-change notification, or the automated test/verification toolchain, what
does it need to know to not get it wrong" — never "explain what an orbit is." Every claim must
trace to a real, cited source (orbital-mechanics textbooks/references for Kepler/J2 propagation,
the ZabSpaceExercise corpus's own `04-orbital-mechanics-primer.md` where its physics-of-access
framing applies, official framework/library documentation for whatever stack `03-architecture-
design-synthesis` confirms) — never invented formulas or library behavior from memory.

## Scope (what this skill owns)

| Asset | Role |
|---|---|
| `docs/research/R-2##-*.md` + the R-2xx section of `docs/research/INDEX.md` | Implementation-grounding topics. Suggested initial set (adjust to real gaps, and to whatever stack `03-architecture-design-synthesis` actually confirms): R-201 Keplerian orbital elements & basic two-body propagation · R-202 J2 perturbation and why it matters for a LEO/MEO/GEO-analog discrete-band presentation · R-203 mapping continuous orbital state to the game's simplified discrete regimes (the hybrid "real math underneath, simplified presentation" boundary) · R-204 the `Propagator` interface boundary — why it exists, what it must and must not expose to the rest of the engine · R-205 server-authoritative architecture & fog-of-war/belief-state patterns for a turn-based multiplayer game · R-206 WebSocket transport for turn-change push notification (connection lifecycle, reconnection, message-ordering guarantees a turn-based game needs) · R-207 testing/verification tooling for a Node.js+TypeScript backend and React+TypeScript frontend (tentative stack — mark accordingly until confirmed by an ADR). |
| Engine grounding | Once `03-architecture-design-synthesis` names real modules (a `Propagator` implementation, a `BeliefState`/`GameEngine` module, the WebSocket transport layer), every topic must trace to the real module(s) it constrains — before that, topics ground the *interface contract* the architecture will need to honor, not literal file/function names that don't exist yet. |

**Author index-before-content:** add the topic's row to the R-2xx table in
`docs/research/INDEX.md` (status `PLANNED`, ID, title, one-line scope) before writing the file;
flip to `DONE` when the quality gate passes.

## Methodology (binding for every topic)

- **Seven-section shape:** Purpose · Scope · Concepts · Operational Context · Implementation
  Guidance · Feature Mapping · Related Topics. **A document missing §5 Implementation Guidance
  has not done the job** — every concept must resolve to a concrete "do/don't do this" statement,
  tied to real module/interface names once they exist (GDS-03/GDS-09), or to the interface
  contract's shape before then.
- **Inline-cite every formula, timing claim, and named library behavior at the claim site.** Every
  `##` section ends with a `### Sources` subsection (live URL + accessed date; add a Wayback
  snapshot where fetchable). The project's own test suite results are a valid Tier-A source once
  they exist ("what this system verifiably does").
- **Flag single-source claims inline** — don't present a one-source number as settled fact.
- **3–8 page band** per topic; split rather than sprawl.
- If `WebFetch`/`WebSearch` are unavailable in the session, still author from well-established
  orbital-mechanics/software facts but mark every unverifiable citation "needs fetch-verification"
  and report the gap in the completion summary so the manager files it.
- **Never invent a numeric game-tuning value** (AP costs, asset costs, win thresholds) and never
  presuppose an unconfirmed toolchain command — mark the tech stack tentative wherever cited,
  pending `03-architecture-design-synthesis`/`07-implementation-planning` confirmation.

## Workflow

1. **Read the trigger context.** What spec/feature/architecture level needs grounding? Identify
   which R-2xx topic(s) are implicated.
2. **Check existing coverage first** — read the R-2xx index section and relevant topic files
   before assuming a gap; also check whether the ZabSpaceExercise corpus's orbital-mechanics
   primer already covers the needed depth (cite it rather than re-deriving); re-reading beats
   re-researching.
3. **If a gap exists:** index row first, then research with tiered sources (prefer primary
   orbital-mechanics references and official library/framework docs over blog summaries), then
   write/update the topic per the methodology.
4. **Cross-link both directions** — update Related Topics in siblings, and Feature Mapping on the
   GDS/FS/IP artifact(s) it grounds (metadata only).
5. **Flip the index status**, verify against the quality gate, and commit as
   `docs(research): R-2## — <what changed>`.

## Quality gate (before calling a topic/edit done)

- [ ] Every claim has an inline citation at the claim site.
- [ ] Every `##` section has a `### Sources` subsection.
- [ ] §5 Implementation Guidance gives concrete do/don't statements, tied to real names where they
      exist and to the interface contract's shape where they don't yet — not generic advice.
- [ ] Frontmatter Dependencies/Referenced By/Feature Mapping bidirectionally consistent.
- [ ] The tentative tech stack is explicitly flagged as tentative wherever cited; nothing presumes
      an unconfirmed toolchain decision as settled.
- [ ] Nothing reads like novice-tutorial prose; file stays in the 3–8 page band.

## Gotchas

- Don't re-derive what a future `CLAUDE.md`/`memory.md` will document about *this game
  specifically* (its actual module names, its actual WRAM-equivalent state layout) — cite them
  once they exist; the encyclopedia adds the *general* technical grounding those documents assume.
- Common defect classes this tier exists to prevent: a `Propagator` implementation leaking
  continuous orbital state past the interface boundary it exists to hide; a WebSocket
  reconnection path that silently drops a turn-change notification; a fog-of-war belief-state
  update that isn't actually server-authoritative (a client inferring more than the server sent).
  Work these into §5 as concrete do/don't guidance before they ever become a shipped bug.
- This skill does not touch the R-1xx tier (SDA/counterspace doctrine grounding —
  `02-research-domain`).

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 02 — Research (orbital/tooling peer)** of the documentation-driven-development
pipeline (see [`.claude/skills/README.md`](../README.md)). The two `02-research-*` skills are
peers — run whichever owns the tier the gap is in. Upstream: `01-vision`. Downstream:
`03-architecture-design-synthesis` (and whichever spec-authoring skill requested the grounding).

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — every topic produced or updated (paths), every index status flipped.
2. **Recommendations** — remaining coverage gaps, citation-verification gaps, single-source
   claims needing a second source, tentative-stack items still awaiting an ADR, and who owns each
   follow-up.
3. **Next step** — if this run closed a grounding gap requested by a downstream skill, return to
   that skill and resume the blocked artifact; if the sibling `02-research-domain` tier still has
   a gap for the current increment, name it; otherwise advance to
   `03-architecture-design-synthesis`.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and the
owner relies on each stage's summary to know what to invoke next.
