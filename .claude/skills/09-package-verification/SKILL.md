---
name: 09-package-verification
description: Independently verify exactly one COMPLETE Implementation Package against the shipped code — re-check every Definition of Done and Verification Checklist item against the actual source tree, rebuild/start the app and run the full automated test suite (the permanent gates), audit the traceability updates the implementation claimed, produce a Verification Report (VR-####) under docs/implementation/verification/, and advance the package COMPLETE→VERIFIED (or send it back with findings). This is the ONLY skill authorized to write VERIFIED on the Master Build Plan. Use when asked to "verify IP-####," "check the last implemented package," or after any stage-08 run finishes. It verifies against what the package and its FS already say — it never fixes code (that goes back to stage 08), never edits the package or spec, and never verifies its own same-session implementation work. Do not use it to implement packages (08) or to review a whole release's packages together (10-integration-review).
---

# Package Verification

Independently confirms that **one Implementation Package marked `COMPLETE`** actually delivers
what it claims, then — and only then — advances it to `VERIFIED`. Sole authority for the
`COMPLETE → VERIFIED` transition. Its value is independence: it re-derives every claim from the
tree and the test run, taking nothing in the Implementation Summary on faith.

## What this is for (and what it is not)

One question: *does the shipped code, as it exists right now, satisfy every item of this
package's Definition of Done and Verification Checklist, every requirement in its Requirements
Covered, and the repository's permanent gates — yes or no, with evidence?*

It SHALL NOT:

- **Fix anything.** A failed check routes back to the owning stage-08 peer (or upstream if the
  defect is in the package/spec) — never a same-session patch, however small.
- **Edit the package, FS, requirements, or architecture.** All read-only. An unverifiable-as-
  written checklist is a finding for `07-implementation-planning`.
- **Verify work implemented in the same session.** State that independence is degraded and
  recommend a fresh session; proceed only if the owner accepts the caveat explicitly.
- **Verify more than one package per invocation.**
- **Rubber-stamp.** `VERIFIED` with any item unchecked, any test failing, or any traceability
  cell stale corrupts the ledger the whole downstream pipeline trusts.

## Inputs (all read-only)

The target package (`docs/implementation/packages/IP-####-*.md`), its FS, its Requirements
Covered FR/NFRs + the RTM, the Master Build Plan (read + status-write), the GDS/ADR sections it
cites, and the live source tree + the recorded toolchain.

## Outputs

1. **`docs/implementation/verification/VR-####-<slug>.md`** — numbered to match the package
   (IP-1010 → VR-1010). Create the directory's `INDEX.md` (VR ID, package, date, result, headline
   findings) on first use. Sections: **Package** (ID, title, commit hash verified) · **Result**
   (`VERIFIED`/`RETURNED` + failed-check count) · **Definition of Done audit** (one row per item:
   evidence — file:line, check name, command output — pass/fail) · **Verification Checklist
   audit** (same) · **Requirements audit** (per Requirements Covered ID: where implemented ·
   where tested · RTM cell state · pass/fail) · **Test run** (full-suite counts + the exact
   commands used, per the recorded toolchain) · **Scope audit** (did the implementing diff stay
   inside the declared file set + the stage-08 peer seam — name any excursion) · **Findings** (one
   row each: description · severity · recommended owner).
2. **Updated Master Build Plan + `packages/INDEX.md`**: on pass, `VERIFIED`, and downstream
   blocking notes updated (a dependent flips to `READY` only if *all* its dependencies are now
   `VERIFIED`). On fail, back to `IN PROGRESS` (or `BLOCKED` if the defect is upstream) with a
   pointer to the report.
3. **Updated RTM** — only to correct cells the audit proved wrong or confirm ones the
   implementation filled; never to paper over a gap.

## Workflow

1. **Select and gate.** The package must be exactly `COMPLETE`; anything else is ineligible —
   report the actual status and stop. Check the same-session independence rule.
2. **Read the package in full**, plus FS/requirements/cited GDS/ADRs. Build the checklist
   inventory: every DoD item, checklist item, Requirements Covered ID, named file.
3. **Audit the tree.** Every claimed file/change: confirm it exists and does what the package
   says by reading the code — not the Implementation Summary. Diff-scope check against the
   declared file set and the code/content peer seam.
4. **Run the gates.** Rebuild/start the app, run the full test suite, record exact counts. For
   content packages, also exercise the affected mission set/asset/effect and compare against the
   spec's acceptance criteria. Any failure — even one that looks pre-existing — is investigated
   far enough to assign ownership: this package's defect (fail the verification) or pre-existing
   (finding with evidence). **If the package's Definition of Done references a tunable or
   scenario-dependent parameter** (a specific mission set, asset combination, effect duration, or
   fog-of-war belief-state edge case that the suite's own shared fixtures default to one fixed
   value for), **exercise the built app at a non-default value of that parameter yourself**, live,
   and check the claimed behavior directly — a full green suite is not sufficient evidence on its
   own if every suite that exercises the package shares a fixture that never varies the parameter.
   (Illustrative risk: a package's DoD is about fog-of-war belief-state decay scaling with turns
   elapsed since last contact, every consuming suite's fixture defaults to one fixed turn-count,
   and the suite passes 100% green while turn-count=1 or turn-count=max both silently produce a
   belief-state leak or an over-eager expiry — no VR would catch that unless it drove the app at a
   non-default turn-count itself.)
4a. **Reachability sweep (mandatory, G6.1).** For every exported symbol, module, message type,
   handler, hook, content registry, or config file this package claims to deliver, **grep the tree
   for a production caller** — excluding `__tests__`, spec files, and fixtures. A symbol whose only
   callers are tests is **dead code, and the package that shipped it did not deliver it**: that is
   a finding at minimum High, and a Critical one if the symbol implements a `Must` requirement.
   Record the sweep's result explicitly, including "swept N symbols, all reachable" — silence is
   not a positive result.

   The check is literally this shape, per claimed symbol:
   `grep -rn "<symbol>" <src roots> | grep -v __tests__` — and then reading the hits to confirm
   they are *calls*, not merely the definition, a re-export, or a type reference.

   *Why this exists:* `checkWinConditions`, the session event log, `Propagator.advance()` and
   `EffectDefinitionRegistry` each passed verification with **zero production callers**. The game
   could not end, no player could see what an opponent had done, and the orbital math never ran —
   through 11 `VERIFIED` packages and two clean integration reviews. This sweep costs seconds and
   would have caught all four.

4b. **Verify against the FS, not only the package (G6.3).** A package cannot be its own acceptance
   standard — it is authored by the same pipeline that implements it, so a package that quietly
   narrows its own scope will always self-consistently pass. Enumerate the **owning FS's**
   acceptance criteria and check each against the shipped result. **Any AC the package omitted,
   deferred, or reworded into something weaker is a finding against the package**, not an accepted
   scope note. Deferring an AC requires the owner's explicit agreement on record, not a package's
   own say-so.

   **`Demonstration` criteria are not dischargeable by this skill's normal evidence (G6.2).** A
   passing unit test, a code reading, and a ledger audit are all evidence about *mechanism*; a
   `Demonstration` criterion is a claim about what a human *sees*. It requires a captured artifact
   — screenshot, recording, or driven-session transcript — filed with the VR. If this run cannot
   produce that artifact, the criterion is **UNMET**, the package cannot be `VERIFIED` on it, and
   the run routes it to `09-content-review`. It may never be marked "correctly left unchecked."

   *Why this exists:* FR-8100–FR-8500 were all `Priority: Must` / `Verification: Demonstration`.
   IP-8010 descoped two of FS-108's five acceptance criteria into a deviation note, verification
   accepted the package's own narrowed bar, and the result shipped with no stylesheet and a
   text-list board — while carrying a `VERIFIED` status.

5. **Audit traceability.** Every Requirements Covered ID traces in the RTM to real files and
   real tests this package shipped.
6. **Write the report**, update the ledgers, commit as `docs(verification): VR-#### — <result>`.

## Quality gate (before writing `VERIFIED`)

- [ ] Every DoD and checklist item has recorded evidence — none waved through.
- [ ] App builds/starts cleanly; full suite green — run by name, counts recorded.
- [ ] Every covered requirement traces to real code and a real check in the RTM.
- [ ] The implementing change stayed in scope, or every excursion is explained and accepted.
- [ ] The report's Result matches the ledger status written.
- [ ] No code, package, spec, or requirement was edited by this run.
- [ ] For any tunable/scenario-dependent parameter the DoD references, this run itself exercised
      the app at a non-default value — not just re-run the suite and trusted its existing fixture
      coverage.
- [ ] **Reachability sweep run and its result recorded** (G6.1) — every claimed symbol has a
      production, non-test caller, or the exception is a filed finding. "Swept N, all reachable"
      is stated positively; silence does not count.
- [ ] **Every acceptance criterion of the owning FS checked** (G6.3) — not only the package's own
      DoD — and any criterion the package narrowed or omitted is filed as a finding.
- [ ] **No `Demonstration` criterion marked satisfied without a captured artifact** (G6.2) filed
      with this VR. Absent the artifact it is `UNMET` and routed to `09-content-review`.
- [ ] "Builds/starts cleanly" was verified by **actually starting the process and connecting to
      it** (G5), not by a successful compile.

## Gotchas

- Every package on this project is a forward-design package (there is no as-built baseline to
  verify against) — verification is always against the current tree, not any historical claim;
  drift from what the package/FS says is a finding regardless.
- A `RETURNED` result is a *normal* outcome — cheap detection is the point. Route the finding,
  don't soften the result.
- Severity honesty: a cosmetic doc typo can pass with a Low note; an unchecked DoD item is a hard
  fail. Don't let smallness tempt you into fixing it — even one line belongs to stage 08.

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 09 — Package Verification** of the pipeline (see
[`.claude/skills/README.md`](../README.md)). Peer: `09-content-review` (qualitative content
review). Upstream: the stage-08 peers. Downstream: `10-integration-review` (once a tranche's
packages are all `VERIFIED`), or back to stage 08 for the next package.

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — the VR written (path + Result), status transitions applied, RTM cells
   corrected.
2. **Recommendations** — every finding with severity and owner; independence caveats if any.
3. **Next step** — on `RETURNED`: re-run the owning stage-08 peer on this package against the
   findings; on `VERIFIED` with more `READY` packages in the tranche: stage 08 on the next one
   (critical-path first); on `VERIFIED` with the tranche done: `10-integration-review`.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
