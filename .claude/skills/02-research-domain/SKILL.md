---
name: 02-research-domain
description: Produce or refresh expert-level, citation-grounded research on space-domain-awareness (SDA) and counterspace doctrine vocabulary — the find-fix-track-target-engage (F2T2E) chain, the Five D's effect taxonomy (Deceive, Disrupt, Deny, Degrade, Destroy), the v1 mission sets (SATCOM, ISR, PNT-lite), and the asset roster (wide-area SDA radar, ground tracking array, space-based SDA sensor, optical/imaging sensor, kinetic/RPO effector, EW/jamming effector) — to ground OW Chess's rules, requirements, and specs in real doctrinal vocabulary rather than invented flavor text. Use when asked to research SDA/counterspace doctrine topics, to add/extend docs/research/ R-1xx topics, or to gather doctrine grounding before drafting a GDS level, FR/NFR, or FS-###. Cites the sibling ZabSpaceExercise project's research corpus (docs/research/ in that repo) as an authoritative existing corpus rather than duplicating its content — this skill's own R-1xx topics are OW-Chess-specific distillations, cross-linked to it, not a copy of it. Not for beginner tutorials — every topic is written for an agent about to encode game rules that must be doctrinally coherent.
---

# Research: SDA & Counterspace Domain

Produces the **R-1xx tier** of the research corpus (`docs/research/R-1##-*.md`) — the doctrinal
and domain vocabulary an agent needs to make OW Chess's rules, mission sets, asset roster, and
effect taxonomy read as a faithful (if simplified) game about real space-domain-awareness and
counterspace practice, not generic sci-fi flavor. The tier is tracked in
[`docs/research/INDEX.md`](../../../docs/research/INDEX.md), which lists the planned topics; this
skill authors them index-first.

## What this is for (and what it is not)

This skill exists to answer: "if an agent is about to spec or implement something touching the
F2T2E chain, the Five D's, a mission set, or an asset's real-world analog, what does it need to
know to keep the game's abstraction honest to the doctrine it's modeling" — never "explain what a
satellite is." Every document should trace to a real, cited source (open-source doctrine
publications, the SWF/CSIS-style counterspace taxonomy literature, or the project's own verified
game behavior once it exists) — never invented capabilities or thresholds presented as doctrine.

**Authoritative existing corpus — cite, don't duplicate.** The sibling project ZabSpaceExercise
maintains a substantially deeper doctrine/counterspace research corpus at
`docs/research/` in that repository (its own `01-doctrine-western.md`, `02-doctrine-non-western.md`,
`03-counterspace-taxonomy.md`, `05-mission-types-and-counters.md`, `06-bus-and-payload-operations.md`,
`07-legal-norms-and-roe.md`, etc.). OW Chess's R-1xx topics are **short, game-specific
distillations** that cite that corpus by file and section for the underlying doctrinal depth,
rather than re-deriving or copying its content. Where OW Chess's simplification of a doctrinal
concept diverges from that corpus (e.g. collapsing a five-category counterspace-weapon taxonomy
into two effector asset types), say so explicitly and justify the simplification as a game-design
decision, not a doctrinal claim.

## Scope (what this skill owns)

| Asset | Role |
|---|---|
| `docs/research/R-1##-*.md` + the R-1xx section of `docs/research/INDEX.md` | Game-facing doctrine distillations. Suggested initial set (adjust to real gaps): R-101 the F2T2E chain as a turn-structured game loop · R-102 the Five D's effect taxonomy and how each maps to a game effect · R-103 mission sets (SATCOM, ISR, PNT-lite) — what each represents and why a player would field assets toward it · R-104 the asset roster — each asset's real-world analog, its plausible find/fix/track/target/engage role · R-105 fog-of-war and belief-state as a doctrinal analog (SDA as an imperfect-information problem, not just a game mechanic) · R-106 legal/normative framing (why the game models denial/degradation rather than glorifying kinetic destruction, and how that shapes the Five D's balance). |
| Cross-links | Every topic cites the matching ZabSpaceExercise corpus file(s) by relative description (that repo is read-only reference material, not part of this repo — cite by title/section, not by a path this repo can dereference) and the OW Chess artifact(s) it grounds (GDS-04 Domain Model, specific FR-#### ranges, FS-### specs). |

**Author index-before-content:** add the topic's row to the R-1xx table in
`docs/research/INDEX.md` (status `PLANNED`, ID, title, one-line scope) before writing the file;
flip to `DONE` when the quality gate passes.

## Methodology (binding for every topic)

- **Seven-section shape:** Purpose · Scope · Concepts · Doctrinal Grounding (with citations) ·
  Game-Design Mapping · Simplifications & Divergences (every place the game's abstraction departs
  from the cited doctrine, and why) · Related Topics. **A document missing the Game-Design Mapping
  or the Simplifications section has not done the job** — this tier's whole point is bridging real
  doctrine to game rules honestly.
- **Inline-cite every doctrinal claim at the claim site.** Prefer citing the ZabSpaceExercise
  corpus's own already-sourced claims (naming its file) over re-fetching primary sources from
  scratch; where OW Chess needs a doctrinal fact that corpus doesn't cover, source it independently
  (open-source doctrine publications, e.g. USSF Spacepower doctrine, SWF/CSIS counterspace
  taxonomy reports) with a live URL + accessed date.
- **Flag single-source claims inline** — don't present a one-source number as settled fact.
- **3–6 page band** per topic (shorter than a full doctrinal deep-dive — this tier distills for
  game design, it doesn't re-author the doctrine corpus).
- If `WebFetch`/`WebSearch` are unavailable in the session, still author from well-established
  doctrinal facts and the ZabSpaceExercise corpus's own citations, mark anything unverifiable
  "needs fetch-verification," and report the gap in the completion summary so the manager files it.
- **Never invent a numeric tuning value** (an asset's game cost, an effect's duration, a win
  threshold) — those belong to stages 04/06; this tier documents the doctrinal *shape* a rule
  should have, not the number.

## Workflow

1. **Read the trigger context.** What spec/feature/architecture level needs grounding? Identify
   which R-1xx topic(s) are implicated.
2. **Check existing coverage first** — read the R-1xx index section and relevant topic files
   before assuming a gap; also check whether the ZabSpaceExercise corpus already covers the
   doctrinal depth needed (it usually does) — re-reading beats re-researching.
3. **If a gap exists:** index row first, then research (preferring the sibling corpus's citations,
   falling back to independent sourcing for OW-Chess-specific mappings), then write/update the
   topic per the methodology.
4. **Cross-link both directions** — update Related Topics in siblings, and Feature Mapping on the
   GDS/FR/FS artifact(s) it grounds (metadata only).
5. **Flip the index status**, verify against the quality gate, and commit as
   `docs(research): R-1## — <what changed>`.

## Quality gate (before calling a topic/edit done)

- [ ] Every doctrinal claim has an inline citation at the claim site (own source or the
      ZabSpaceExercise corpus file it distills).
- [ ] The Game-Design Mapping and Simplifications & Divergences sections are both present and
      concrete, not generic.
- [ ] No numeric game-tuning value invented here.
- [ ] Frontmatter Dependencies/Referenced By bidirectionally consistent.
- [ ] File stays in the 3–6 page band; nothing duplicates the ZabSpaceExercise corpus's own depth
      wholesale — it cites, it doesn't re-author.

## Gotchas

- Don't let this skill become a backdoor for re-deriving the ZabSpaceExercise corpus from
  scratch — cite it; add only the OW-Chess-specific game-mapping layer on top.
- Common defect class this tier exists to prevent: a mission set, asset, or effect that "sounds
  doctrinal" but has no real grounding, so a later requirements/spec pass can't cite anything and
  silently invents behavior.
- This skill does not touch the R-2xx tier (orbital mechanics, architecture/tooling grounding —
  `02-research-orbital-and-tooling`).

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 02 — Research (domain peer)** of the documentation-driven-development
pipeline (see [`.claude/skills/README.md`](../README.md)). The two `02-research-*` skills are
peers — run whichever owns the tier the gap is in. Upstream: `01-vision`. Downstream:
`03-architecture-design-synthesis` (and whichever spec-authoring skill requested the grounding).

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — every topic produced or updated (paths), every index status flipped.
2. **Recommendations** — remaining coverage gaps, citation-verification gaps, single-source
   claims needing a second source, and who owns each follow-up.
3. **Next step** — if this run closed a grounding gap requested by a downstream skill, return to
   that skill and resume the blocked artifact; if the sibling `02-research-orbital-and-tooling`
   tier still has a gap for the current increment, name it; otherwise advance to
   `03-architecture-design-synthesis`.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and the
owner relies on each stage's summary to know what to invoke next.
