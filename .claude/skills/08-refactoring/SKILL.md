---
name: 08-refactoring
description: Execute exactly one approved, eligible refactoring-scoped Implementation Package (IP-8xx0) — behavior-preserving restructuring of code (any file the package names) and/or meaning-preserving restructuring of documentation under docs/ — capture a baseline (behavior snapshot: full test-suite results, plus any deterministic-output check the package's equivalence contract names) before the first edit, refactor in small reversible steps, prove equivalence afterward (behavior-identical rebuild or the package's enumerated predicted deltas; full suite green; doc statuses/decisions/IDs meaning-unchanged; link integrity), update traceability and any migration map, and advance the package on the Master Build Plan. Use when asked to "refactor X," "restructure/reorganize the docs," "rename Y across the tree," "pay down structural debt," "the log/backlog has gotten too big," or "implement IP-8xxx" where the package names this skill. Growing living documents (an append-only run log or backlog, a router doc whose summary cells have become history essays) follow a named pattern (Step 4a): archive-split for logs, compact-to-current-state-plus-pointer for router docs, both proven by row-for-row/byte-for-byte diff, with the strategic choice confirmed via AskUserQuestion when it isn't a single obvious move. Stage-08 peer of 08-code-implementation and 08-content-authoring; it never changes behavior, never fixes bugs (even ones it finds — those go to intake), never adds features, and requires G3 authorization before running. Verification to VERIFIED belongs to 09-package-verification.
---

# Refactoring

Executes **one approved, eligible refactoring-scoped Implementation Package**: restructuring that
leaves the game's behavior and the documentation's meaning **provably unchanged**. The third
stage-08 peer — where `08-code-implementation` changes what the code *does* and
`08-content-authoring` changes what the game *offers*, this skill changes only how code and docs
are *organized*, and carries the burden of proving that's all it changed.

## What this is for (and what it is not)

One question: *given one refactoring package, what is the smallest sequence of
structure-only changes that achieves the package's stated shape — with evidence, not assertion,
that nothing observable changed?*

It SHALL NOT: change any observable game behavior · fix any bug, even a one-liner it trips over
(file it via `00-intake` as an Outstanding Issue — a refactor that "also fixes" something has
destroyed its own equivalence proof) · add features, tests-of-new-behavior, or abstractions the
package doesn't name · change the meaning of any requirement, spec, decision, status, or research
claim while moving/renaming it · redesign architecture (a structure that can't be reached without
a behavior change is a Blocking Report, not a license) · write `VERIFIED` (stage 09's exclusive
transition).

Authoritative read-only inputs: the Master Build Plan · the package · the `BL-####` it cites ·
GDS-03/07/09 + ADRs (boundaries a refactor must respect).

**Write scope (G1):** exactly the files the package names — which may be any source file (the
code/content peer seam does not bind here **because the equivalence proof is stronger**: a
behavior-identical rebuild demonstrates no content changed, by construction) and/or any files
under `docs/` (structure, filenames, links, formatting — never meaning). A refactoring package
whose predicted behavior delta is anything other than "identical" must enumerate every expected
delta and why it is behavior-neutral; if it can't, the work isn't a refactor and belongs to a
different package.

## Eligibility (all five, checked before the first edit)

1. **Package.** A refactoring-scoped `IP-8xx0` exists (authored by `07-implementation-planning`,
   citing its `BL-####`), status exactly `READY`, every dependency `VERIFIED`.
2. **Authorization (G3).** Either the release plan already schedules this refactor in the shape
   described, or an explicit owner go-ahead is on record for *this* package.
3. **Quiescence.** No other package is `IN PROGRESS`, and no `COMPLETE`-but-unverified package
   touches any file this package names.
4. **Green baseline.** The G5 gates pass on the tree *as found* (app builds/starts cleanly; full
   test suite passes). **Never refactor on red.**
5. **Equivalence contract.** The package states its proof obligation: behavior-identical rebuild
   (the default), or an enumerated list of predicted deltas with per-delta justification; for
   doc-scoped work, the meaning-preservation constraints and (if IDs/files move) the required
   migration map.

If any check fails: stop, report which one and who owns it. No consolation work.

## Workflow

### Step 1 — Select and gate-check

As `08-code-implementation` Step 0–1, plus the five eligibility checks above.

### Step 2 — Read the package; verify its claims against the tree

Every field. Confirm every file/function/module/doc-section the package cites still exists as
described — material drift is a **Blocking Report**, never routed around.

### Step 3 — Mark `IN PROGRESS`, then capture the baseline

Update the Master Build Plan first. Then, before any edit, record in the scratchpad: the full
test suite's output (check count and every check name) · for doc-scoped work, the inventory the
package names (every `BL-`/`FR-`/`IP-` status token, every ID, the link set of the affected
files). This baseline is the other half of the equivalence proof; a refactor without one is
unverifiable.

### Step 4 — Refactor in small, separately-buildable steps

Apply the package's tasks as a sequence of mechanical transformations, keeping the tree buildable
between steps where practical. Code: rename/extract/move/inline only — any edit whose
justification begins "while I'm here" is out of scope. Docs: move/split/merge/rename/relink
only — every moved claim keeps its wording or the package explicitly lists the permitted
editorial normalizations; statuses and decisions are copied character-for-character.

### Step 4a — Doc-scope pattern: growing living documents

A recurring doc-refactoring shape: a "living" document (append-only log, backlog, or
summary/router doc) has grown so large it undermines its own purpose. Two patterns, by shape:

- **Archive-split** (append-only logs — the pipeline journal's run log, the backlog: anything with
  a "never delete rows" rule): once the live file passes a size/row threshold that makes it
  unwieldy, move the older/closed rows **verbatim** into a new `<name>-archive.md` (same table
  format, same order), leave a one-line pointer in the live file, and keep only the recent/open
  rows live. Never delete a row — only relocate it. The equivalence proof is a **row-for-row or
  byte-for-byte diff** of the archive + live bodies against the pre-refactor file — not a
  read-through.
- **Compact-to-current-state-plus-pointer** (summary/router docs whose cells have grown into
  history essays that an owning document already carries in full): before trimming any cell,
  confirm **every** fact/ID/finding it names is independently reconstructable from the doc/INDEX
  it will point to. Anything not independently verifiable stays inline — it is not safe to
  compact. Replace the cell with a short current-state summary plus an explicit pointer to the doc
  that holds the full history.

Both patterns are meaning-preserving structural moves, governed by the same eligibility/G3 rules
as any other `IP-8xx0` package — they are not a standing exemption to run unprompted. Because no
automated test verifies "did this doc refactor preserve meaning" (unlike the test suite for code),
when a package's own approach involves a real choice (which threshold, which cells, split vs.
compact) rather than one obviously-correct move, confirm the approach with the owner via
`AskUserQuestion` before executing — get the strategy right once rather than redo a large diff.
Update the owning skill's own `SKILL.md` (e.g. `00-pipeline-manager` for the journal/backlog) and
`docs/INDEX.md` to document the new archive/convention, so future runs follow the same pattern.

### Step 5 — Prove equivalence (G5 + the contract)

Rebuild/start the app and run the full test suite using the recorded toolchain commands. Compare
against Step 3: behavior/output identical (or every delta matches the package's enumerated
prediction — an unpredicted delta is a **failed refactor**, revert or block, never rationalize
post-hoc) · test count not reduced, no check renamed without the package saying so · doc
inventory identical in meaning (every status token and ID accounted for) · no dangling links
anywhere in `docs/` to a moved/renamed file (sweep the whole tree, not just the files edited). For
the growing-document patterns in Step 4a specifically: a **row-for-row or byte-for-byte diff** of
the split/compacted output against the pre-refactor file's own corresponding content.

### Step 6 — Traceability and the migration map

Update every reference the restructuring invalidated: INDEX files, RTM rows, `CLAUDE.md`/
`memory.md` quick-reference tables (if a name or path they cite moved), the package's cited
`BL-####`. If IDs or filenames changed, write the old→new migration map where the package says.

### Step 7 — Ledger, summary, stop

Set the package `COMPLETE` (never `VERIFIED`). Present the **Refactoring Summary**: Package ·
Files Modified/Moved/Deleted · Equivalence Evidence (baseline vs. post-run comparison, or the
delta-by-delta reconciliation; suite counts before/after; doc-inventory result) · Migration Map
(or "names stable") · Outstanding Issues (bugs/smells found but **not** fixed, for intake).
**Stop** — one package per invocation.

## Blocking conditions

Stop immediately — no partial work left in the tree — when: any eligibility check fails · cited
files/sections have materially drifted · the target shape can't be reached without changing
behavior or meaning · an unpredicted behavior delta or test regression appears and can't be
reverted to a clean intermediate step. Produce a **Blocking Report** (Reason · Evidence · Required
action · Recommended owner), set the package `BLOCKED`, revert to the last provably-equivalent
state, and end the run.

## Quality checklist (before presenting `COMPLETE`)

- [ ] All five eligibility checks passed and are cited in the summary.
- [ ] Baseline captured **before** the first edit; equivalence compared against it, not against
      memory.
- [ ] Behavior/output identical, or every delta matches the package's enumerated prediction.
- [ ] Full test suite green with no reduction in checks; no behavior-bearing test weakened.
- [ ] Zero behavior/meaning changes rode along — every diff hunk is structural; bugs found were
      filed, not fixed.
- [ ] No dangling link in `docs/` to anything moved/renamed; migration map written if names
      changed.
- [ ] For a growing-document split/compaction: row-for-row/byte-for-byte diff proves zero content
      lost, or every trimmed fact is confirmed present in the doc it now points to — and, if the
      approach involved a real strategic choice, it was confirmed with the owner before executing.
- [ ] Master Build Plan shows `COMPLETE`; summary matches the actual diff.

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 08 — Package Execution** of the documentation-driven-development pipeline
(see [`.claude/skills/README.md`](../README.md)). Peers: `08-code-implementation` (behavior
changes), `08-content-authoring` (mission-set/asset/effect data). Upstream:
`07-implementation-planning` (refactoring packages enter via `refactor`-type backlog entries —
see `00-intake`; the manager's explicit scheduling conditions are in `00-pipeline-manager`).
Downstream: `09-package-verification` (re-checks the equivalence evidence; the only skill that
may write `VERIFIED`).

The Refactoring Summary carries the run's factual record; in the same closing message,
additionally state:

1. **Recommendations** — every Outstanding Issue (bug/smell found-not-fixed) with its suggested
   owner; any follow-up refactor the package deliberately deferred.
2. **Next step** — after `COMPLETE`, always `09-package-verification` on this same package
   (ideally a fresh session, for independence); after a Blocking Report, whatever its Required
   action names.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
