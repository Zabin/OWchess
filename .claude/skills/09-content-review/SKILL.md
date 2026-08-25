---
name: 09-content-review
description: Qualitatively review shipped mission-set/asset-type/effect-definition content against its spec — drive the built app through the affected scenarios, capture screenshots/state snapshots of the affected mission sets, assets, and effects, and judge doctrinal coherence (does the content read as a faithful, if simplified, SDA/counterspace mechanic), board/UI readability, and fog-of-war correctness — producing a Content Review report under docs/reviews/. The stage-09 peer of 09-package-verification: verification audits the ledger claims mechanically; this skill judges whether the shipped result actually satisfies the design intent the FS and R-1xx/R-2xx research describe. Use after ANY stage-08 package (08-content-authoring or 08-code-implementation) changes what's rendered on the board or how a mission set/asset/effect behaves — not only content-authoring packages; a fog-of-war indicator or effect animation authored inside a code package still needs this review — or when asked to "review the new mission set/asset/effect," "check the board rendering," or "does the effect resolution actually make sense." Read-only with respect to code and content — findings route back to whichever stage-08 peer owns the reviewed content (or upstream); it never fixes anything.
---

# Content Review

Judges **shipped content against design intent**. `09-package-verification` proves the package
did what its checklist says; this peer proves the result *reads and plays* the way the spec and
the R-1xx/R-2xx research say it should. It observes and reports; it changes nothing but its own
report.

## Scope selection

**Trigger on the change, not on which stage-08 peer made it.** One package's board-rendering or
mission-set/asset/effect-behavior change (after its `08-content-authoring` *or*
`08-code-implementation` run — a fog-of-war status indicator or a new effect animation authored
inside a code package is exactly as much this skill's business as a new mission-set template),
one feature's content surface, or an explicitly named set of mission sets/assets/effects. The
reviewed content should already be `COMPLETE` (and ideally `VERIFIED`) — if the mechanical
verification hasn't run, say so; this review doesn't substitute for it. Before skipping a package
because it "isn't a content package," check whether it changed what's on the board or how the
game behaves at all — `09-package-verification`'s own checklist confirms a mechanism (does an
effect apply the correct state transition); it does not confirm what the board actually *shows*
or how the game actually *plays* to a player, so a code package that adds/changes board content
or in-game behavior is not "covered" just because its VR passed.

## This review is not optional (added 2026-08-23, G6)

**This skill went un-invoked for the entire MVP** — 137 commits, 11 `VERIFIED` packages, two clean
integration reviews, and an advisory release GO, with `docs/reviews/` containing no content review
at all. The result shipped with no stylesheet, a text-list "orbital board," and a game that could
not be ended. Nothing in the pipeline forced this check, so it never happened, and every stage
downstream inherited the assumption that someone else had looked.

Two consequences now bind:

- **A `Demonstration` acceptance criterion can only be discharged here** (G6.2), by a captured
  artifact — screenshot, recording, or driven-session transcript. `09-package-verification`
  cannot discharge one, and must route it to this skill. If a release's scope contains an
  undemonstrated `Demonstration` criterion, `11-release-readiness` has a **blocking** item.
- **"There was no runnable app to review" is a finding, not an excuse.** If this skill cannot be
  run because nothing starts, say so loudly and route it as Critical — that condition is itself
  the most important thing the pipeline needs to hear, and it is the exact condition that went
  unreported here for eleven packages.

## What to check (the review dimensions)

1. **Visual/state fidelity** — build/start the app and drive every affected scenario (each
   mission set, each asset's F2T2E states, each effect application, the fog-of-war reveal/hide
   transitions), capturing screenshots or state snapshots. Does the board render as the spec
   describes? Is hidden information actually hidden from the wrong player?
2. **Doctrinal coherence** — against R-1xx (SDA/counterspace domain grounding) and the FS: does
   the mission set, asset, or effect read as a faithful (if simplified) mechanic — plausibly
   connected to the real-world capability it represents — rather than an arbitrary game rule?
   Flag any content that "sounds doctrinal" but has drifted from the research grounding.
3. **Readability & composition** — does the board read at a glance: whose turn it is, which
   assets are deployed, what a player currently believes about the opponent (fog-of-war state)
   legibly distinct from ground truth?
4. **Fog-of-war / effect correctness** — if the reviewed content touches belief-state or effect
   resolution: drive the engine through the spec's trigger conditions, confirm the indicator and
   the state change actually appear correctly, and confirm no hidden information leaked to the
   wrong player at any point in the exercised sequence.
5. **Documentation coherence** — `memory.md`'s mission/asset/effect quick-refs and `CLAUDE.md`'s
   relevant sections reflect the shipped content; the FS's acceptance criteria all have evidence.

## Output

**`docs/reviews/content-review-<scope>.md`**: scope + package list (with the commit hash
reviewed), the screenshots/state snapshots taken (paths), evidence per dimension, and findings as
one row each — `Finding | Artifacts involved | Description | Severity | Recommended owner` —
using the project's Critical/High/Medium/Low scale. A clean review states what was actually
exercised to earn the "clean."

## Quality gate

- [ ] The app reviewed was built/started from the current tree (commit hash recorded).
- [ ] Every affected mission set/asset/effect/fog-of-war state was actually exercised and
      screenshotted/snapshotted — not judged from source.
- [ ] All five dimensions exercised; a dimension with nothing to report says what was checked.
- [ ] Every finding has a severity and a concrete recommended owner; none fixed in-pass.
- [ ] Nothing but the report (and tracker rows) was written.

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 09 — Content Review**, peer of `09-package-verification` (see
[`.claude/skills/README.md`](../README.md)). Upstream: whichever stage-08 peer authored the
reviewed board/game content — `08-content-authoring` or `08-code-implementation`. Downstream:
`10-integration-review`, or back to that same stage-08 peer with findings.

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — the report written (path), scope, headline result (clean / N findings by
   severity), screenshots/snapshots taken.
2. **Recommendations** — each finding with its owner: content defects → whichever stage-08 peer
   authored the reviewed content (via a `07` remediation package if the fix isn't covered by an
   open package); spec-intent ambiguity → `06-feature-specification`; doctrinal-grounding gaps →
   `02-research-domain`.
3. **Next step** — clean: continue the tranche (next stage-08 package, or
   `10-integration-review` if the tranche is done); findings: route them per above and name the
   first step.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
