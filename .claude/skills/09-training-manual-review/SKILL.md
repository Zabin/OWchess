---
name: 09-training-manual-review
description: Independently review the training corpus — docs/training/ modules and docs/manual/ screenshots — against the FR-9000/NFR-10000 requirements baseline and the shipped, VERIFIED behavior of the real OW Chess application, producing a Training Review report under docs/reviews/. Checks accuracy (prose vs. as-built behavior, driven live via Playwright where warranted), traceability integrity (Sources footers ⇄ matrix rows, both directions), coverage (every operator-visible capability has manual coverage), and pedagogy (audience fit — plain language for a non-technical player, module sizes per NFR-10100, screenshot fidelity per NFR-10200). Use when asked to "review the manual," "check the training docs against the code," or after any 08-training-manual-authoring run. A Stage 09 peer of 09-package-verification: review-only — it reports and routes findings, never fixes prose or code, and never reviews its own session's authoring work.
---

# Training Manual Review

Independently reviews the **training corpus** the way `09-package-verification` reviews a code
package: against the requirements baseline (FR-9000 family, NFR-10000) and against **shipped,
`VERIFIED` behavior**, not against what the authoring pass said it did. The training corpus is a
co-equal product (MSTR-001 C10); this is its verification stage.

## What this is for (and what it is not)

It answers: *does the training corpus, as it stands on disk, teach the game that actually ships?*
It SHALL NOT fix anything it finds — findings route to the owning skill
(`08-training-manual-authoring` for manual prose or screenshots, `00-intake` for code bugs the
review exposes, `04-requirements-engineering` for requirements gaps). It never reviews training
artifacts authored in its own session — independence is the point, exactly as
`09-package-verification` never verifies its own same-session implementation.

## Scope selection

One of: the sections touched by a named authoring run (the common case, its "Next step"), a
named module set, or the whole corpus (a periodic audit — expect to sample rather than exhaust
on a large corpus; say what was sampled — though OW Chess's single shared corpus is small enough
that a full read is usually the right default).

## What to check (the review dimensions)

1. **Accuracy** — sampled prose claims vs. as-built behavior: panels/actions/flows exist and
   behave as described. Drive the real running app via Playwright for any claim about an
   interactive flow that hasn't been observed this session. A manual describing removed, renamed,
   or never-shipped behavior is a **Critical** finding — it actively mis-trains a player.
2. **Traceability integrity** — `> Sources:` footers current (named paths/FR IDs exist);
   `06-manual-traceability.md`'s forward and reverse tables mutually consistent and consistent
   with the footers (FR-9120/9210); no orphaned section IDs.
3. **Coverage** — every operator-visible capability in the forward index reaches manual coverage
   (FR-9110); recently `VERIFIED` packages (check the Master Build Plan's latest `VERIFIED` rows)
   present in the corpus at all, not just the ones that existed when the corpus was first written.
4. **Pedagogy** — audience fit for an adult wargaming-curious, non-technical player (SOR §2):
   jargon introduced or glossary-linked, module sizes per NFR-10100; screenshot fidelity per
   NFR-10200 (every screenshot a genuine Playwright capture of the real running app at the
   documented step — a mockup, a stale screenshot from a prior UI, or a screenshot that doesn't
   match its caption is a finding, not a style nitpick).

## Output

**`docs/reviews/training-review-<scope>.md`** (matching `docs/reviews/`'s descriptive naming),
containing: scope + commit reviewed, what was actually exercised per dimension (a clean dimension
states what was checked, not just "OK"), and findings one row each — `Finding | Artifact(s) |
Description | Severity | Recommended owner` — on the project's Critical/High/Medium/Low scale.

## Quality gate

- [ ] All four dimensions exercised and evidenced; sampling stated where sampling was used.
- [ ] At least one interactive claim per reviewed module live-driven via Playwright against the
      real running app, not merely re-read.
- [ ] Every finding has severity + concrete recommended owner; nothing was fixed in-pass.
- [ ] Independence held: nothing reviewed was authored in this session.
- [ ] Nothing but the report was written.

## Pipeline position & completion summary (mandatory, every run)

This skill is a **Stage 09 peer** (independent verification) of the documentation-driven-development
pipeline (see [`.claude/skills/README.md`](../README.md)). Upstream:
`08-training-manual-authoring`. Downstream: `10-integration-review` (whose documentation-coherence
dimension leans on this skill's reports) and `11-release-readiness` (a release whose training
corpus is stale or inaccurate ships mis-training — surface it there, per MSTR-001 §6's release
"done" bar).

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — the report written (path), scope, headline result (clean / N findings by
   severity).
2. **Recommendations** — each finding routed: manual prose/screenshots → `08-training-manual-
   authoring`; code bugs → `00-intake`; requirements conflicts → `04-requirements-engineering`.
3. **Next step** — clean: the pipeline work this review was gating (often `11-release-readiness`
   revisiting a deferred G4 decision); findings: the owning skill for the most severe finding
   first.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
