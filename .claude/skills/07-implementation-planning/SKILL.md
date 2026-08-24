---
name: 07-implementation-planning
description: Transform approved Feature Specifications (FS-###) — or backlog bugs routed here as remediation work — into an executable implementation plan under docs/implementation/ — a Technical Work Breakdown, build-ready Implementation Packages (IP-####, the 14-field template), and the Master Build Plan (sequencing, dependency graph, critical path, status ledger). This is also where the actual toolchain (build/start/test commands) gets picked and recorded, once 03-architecture-design-synthesis confirms the tech stack via ADR — no earlier skill invents npm script names. Use when asked to "plan the implementation of FS-###," "write the implementation package for this feature," "package the fix for BL-####," "break this spec into work packages," or "update the Master Build Plan." This skill writes no production code (packages describe work in prose/pseudocode only), performs no research, no architecture redesign, no requirements authoring, and never modifies the Feature Specification it plans — and authoring a package is never itself an authorization to code it (G3): a package that implements work already scheduled by the current, owner-approved release plan inherits that plan's authorization automatically; a package outside the release plan (not on it, or a materially different shape than what it describes) still needs the owner's explicit per-package go-ahead. Do not use it to write Feature Specifications (06) or to implement packages (08).
---

# Implementation Planning

Turns **approved Feature Specifications** (and backlog-routed bug remediations) into an
**executable implementation plan**: a Technical Work Breakdown, Implementation Packages
(`IP-####`), and an up-to-date Master Build Plan. It decides *how the work is cut and sequenced*
— never *what the game does* (upstream) and never *the code itself* (downstream).

## What this is for (and what it is not)

It SHALL NOT:

- **Write production code.** No package contains literal committed code — tasks and tests are
  described in prose/pseudocode sufficient for a coding agent, never as compilable source.
- **Modify specs, requirements, or architecture.** An unimplementable spec or a conflict found
  while planning routes upstream — never planned around quietly.
- **Authorize coding (G3) beyond what the release plan already covers.** A package being fully
  specified — even `READY` — is not itself authorization to build. If the package implements work
  the current, owner-approved release plan (`docs/feature-planning/01-release-plan.md`, or its
  successor) already schedules, in the shape the plan describes, that plan approval is the
  authorization — no separate per-package go-ahead is required. A package that is *not* on the
  release plan, or diverges materially from what the plan describes, still requires the owner's
  explicit per-package go-ahead before any stage-08 peer may build it. State every new package's
  authorization status explicitly, and cite which basis applies.
- **Execute anything.** The moment work turns into editing repo source, it belongs to stage 08.
- **Invent a toolchain command ahead of confirmation.** This skill picks and records the actual
  build/start/test commands once the tech-stack ADR exists — before that, it names what's still
  unconfirmed rather than guessing an npm script name.

Authoritative read-only inputs: `docs/features/FS-###` · `docs/feature-planning/` ·
`docs/requirements/` · `docs/architecture/` (+ ADRs, GDS-09 interfaces) · `docs/pipeline/backlog.md`
(for bug remediations) · **the live source tree** (verify every cited file/function/module exists
once code exists).

## Outputs

All under `docs/implementation/` (this skill's sole write scope):

1. **`docs/implementation/01-technical-work-breakdown.md`** — per tranche: FS (or BL) → work
   units → owning package(s), with the rationale for every split/no-split decision. Even a
   single-package tranche gets a short TWBS section — the record of *why the cut is what it is*
   is the artifact.
2. **`docs/implementation/packages/IP-####-<slug>.md`** — one per unit of work, the **15-field
   template**, every field populated: Package ID · Objective · Requirements Covered ·
   Architecture Components · Interfaces · Files to Create/Modify · Implementation Tasks · Tests
   to Add · **Player-Visible Result** · Documentation Updates · Definition of Done · Verification
   Checklist · Dependencies · Risks · Rollback Considerations.

   **Player-Visible Result** *(field added 2026-08-23, G6)* — answer, in one or two sentences:
   *after this package ships, what does a player see or do differently?* Two legal answers:

   - A concrete observable change ("the board shows a countdown on a deploying asset"). State how
     it can be seen, so stage 09 knows what to demonstrate.
   - **"Nothing — this is infrastructure."** Then the field **must name the specific later package
     that makes it visible, and that package must exist in this plan.** An infrastructure package
     with no named consumer is not plannable: it is dead code with a schedule.

   *Why this exists:* win-condition checking, the event log and orbital propagation were each
   built, tested, and marked `VERIFIED` while no package anywhere in the plan ever wired them to
   something a player could perceive. Every one had a green suite. None had a consumer. This field
   makes that gap impossible to write down without noticing it. Assign to the owning stage-08 peer explicitly: a
   logic/server/client/build package names `08-code-implementation`; a pure content package
   (mission-set/asset-type/effect-definition data templates) names `08-content-authoring`; a
   structure-only (behavior/meaning-preserving) package names `08-refactoring`.
3. **`docs/implementation/00-master-build-plan.md`** — updated, not regenerated: new package
   rows (status, blocking dependencies, authorization state), dependency-graph edges,
   critical-path recalculation, parallel notes. Update `packages/INDEX.md` in the same pass —
   the index and the plan must never disagree.

## Conventions

- **ID scheme:** `IP-<FS series>0` mirrors the FS series (FS-101 → `IP-1010`; lettered slices
  `IP-1011`); bug-remediation packages with no FS take the `IP-9xx0` series, citing their
  `BL-####`; refactoring packages take the `IP-8xx0` series, citing their `refactor`-type
  `BL-####`. Check `packages/INDEX.md` for claimed IDs; gapped numbering.
- **Refactoring packages** (`IP-8xx0`) name `08-refactoring` as executor and additionally carry
  an **equivalence contract** in their Verification Checklist: behavior-identical rebuild (the
  default) or an enumerated, per-delta-justified list of predicted observable deltas; for
  doc-scoped work, the meaning-preservation constraints and the migration-map location if
  IDs/files move. A package that mixes refactoring with behavior change must be split — the
  equivalence proof doesn't survive mixing.
- **Status vocabulary (verbatim):** `NOT STARTED / READY / IN PROGRESS / BLOCKED / COMPLETE /
  VERIFIED`. This skill only writes `NOT STARTED`, `READY`, or `BLOCKED` — `IN PROGRESS`/
  `COMPLETE` belong to stage 08, `VERIFIED` exclusively to `09-package-verification`.
- **`READY` means** fully specified **and** every dependency `VERIFIED` (`COMPLETE` is not
  sufficient — stays `BLOCKED` with a note).
- **Every package is forward-design.** This project has no shipped application to document
  as-built, so every package enters at `NOT STARTED`/`READY`/`BLOCKED` and earns
  `COMPLETE`/`VERIFIED` the normal way, through stage 08 then 09.

## Workflow

### Step 0 — Confirm the inputs are approved and eligible

The target FS(s) must be approved with no blocking Open Questions (or the target `BL-####` must
be `SCHEDULED` to this step by the manager). If not, stop and report which gate is open and who
owns it. If this is the first package that will touch the toolchain and no tech-stack ADR exists
yet, that ADR is itself a blocking dependency — route it to `03-architecture-design-synthesis`
before planning proceeds.

### Step 1 — Technical Work Breakdown

Decompose along real seams: module boundaries (per GDS-03: `GameEngine`/`Propagator`/
`BeliefState`/`EffectResolver`/`TurnManager`/transport/client UI), interface boundaries (GDS-09
contracts), test boundaries, and the code/content peer split. Right-size: one package = one
focused stage-08 run against one coherent Definition of Done. Record every split decision.

**Verb inventory (mandatory for any capability spanning more than one runtime concern).** Before
cutting packages, list every verb the capability actually requires — typically some subset of
*resolve, render, apply, persist, review*. For each verb, name the package that covers it, or
record an explicit, deliberate deferral (with the reason). A capability is not fully decomposed
until every verb has an owner or a named deferral — silence is not a deferral. (Illustrative risk:
a fog-of-war increment that packages *compute* — deriving a player's updated belief state after
an opponent's move — and *render* — showing that belief state on the board — but never names a
package whose Files-to-Modify actually wires a stale belief entry to *expire/persist* correctly
across turns, so the engine could correctly compute and display a belief state yet silently leak
or retain information past when it should. Nothing in the TWBS would catch this without an
explicit verb-by-verb check.)

**Supersession sweep (mandatory whenever a package retires or supersedes an existing model).**
When a package's own framing is "generalizes X past its old fixed shape" or "supersedes Y," search
the tree for *every* call site that still encodes the pattern being retired — not just the one
call site the package's own Files-to-Modify names. A search for the old model's literal signature
(hardcoded asset-type comparisons, magic constants tied to the old shape, fixed-case switches) is
cheap and must be run before the package is considered complete-in-scope. Record what the sweep
found — including "found nothing else, confirmed clean" as a real, positive result, not silence.

### Step 2 — Author the package(s)

All 14 fields, grounded in the **current** source tree (once it exists) or the confirmed
architecture (before it does) — verify every file, function, module, and interface the package
cites actually exists as described (or is honestly marked "to create"). A guessed `Files to
Modify` list is this skill's most expensive defect: stage 08 treats drift as a hard Blocking
condition. `Tests to Add` names the test area/suite it lands in; `Verification Checklist` always
includes the two permanent gates by name (app builds/starts cleanly; full automated test suite
passes — G5), citing the actual recorded commands once the toolchain ADR exists.

### Step 3 — Update the Master Build Plan and package index

New rows (status, blockers, authorization state), graph edges, critical path, parallel
opportunities; `packages/INDEX.md` in sync. Per new package, state explicitly whether G3
authorization exists and its basis: **release-plan coverage** (cite the release plan section/row
the package matches, in shape and scope) or an explicit **owner go-ahead on record**. If neither
applies, the default is **not authorized**.

### Step 4 — Cross-link and commit

Update each planned FS's metadata to point at its package(s) (metadata only), commit as
`docs(implementation): IP-#### — <what was planned>`.

## Sequencing rules (added 2026-08-23, G6)

**Walking skeleton first.** On any increment that has no runnable application yet, **package #1
must produce one** — a real process a human can start and open, even if it does almost nothing —
and every package after it must leave the app still runnable. Never plan a tranche whose runnable
entry point arrives last.
> The real server bootstrap was planned as package **#12** here. Eleven packages were built,
> verified and integration-reviewed against something that had never executed as a process.

**One vertical slice before horizontal layers.** Cut at least one thin end-to-end path — a single
action travelling engine → wire → UI → pixels — before decomposing along module boundaries.
Layered cuts hide integration failure until the last layer lands, and the last layer is exactly
where schedule pressure falls.
> Eight MVP features were cut as eight horizontal layers with UI last, so nothing was visible
> until everything was done — and "everything" never arrived.

## Quality gate

- [ ] Every planned FS/BL was confirmed approved + eligible before drafting.
- [ ] **Every package has a populated Player-Visible Result** (G6); every "Nothing — infrastructure"
      answer names a later package that makes it visible, and that package exists in this plan.
- [ ] **The tranche is runnable from package #1**, and no package leaves the app un-runnable.
- [ ] Every package has all 14 fields populated — no literal code anywhere.
- [ ] Every Files to Create/Modify entry checked against the current tree, or honestly marked
      "to create" before any code exists.
- [ ] Every Requirements Covered ID exists in `docs/requirements/` and matches the FS.
- [ ] Dependency edges consistent across package fields, the plan's graph, and the index.
- [ ] No package `READY` whose dependencies aren't all `VERIFIED`; no package marked authorized
      without an explicit, cited basis.
- [ ] The TWBS records the rationale for every split/no-split decision.
- [ ] For a multi-verb capability, every verb has a named package or a recorded, deliberate
      deferral — the TWBS states this explicitly.
- [ ] For a package that supersedes an existing model, the supersession sweep was run and its
      result is recorded.
- [ ] No package's Verification Checklist cites an invented toolchain command — either the real
      recorded command (once the ADR exists) or an explicit note that it's still TBD.

## Gotchas

- **Don't let a package become a second FS.** The FS owns behavior; the package owns
  files/tasks/tests/sequencing.
- **Plan for verification at authoring time.** Every Verification Checklist item must be
  objectively checkable — a vague checklist makes stage 09 guess.
- **Bug remediations get packages too** — that's what keeps a fix traceable.
- **Watch server-authority/fog-of-war boundaries**: a package touching belief-state computation
  or the WebSocket transport must say explicitly what it does and does not expose to the client.

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 07 — Implementation Planning** of the documentation-driven-development
pipeline (see [`.claude/skills/README.md`](../README.md)). Upstream: `06-feature-specification`
(or the backlog, for remediations). Downstream: `08-code-implementation` /
`08-content-authoring`.

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — TWBS sections, packages authored (IDs + paths + owning 08 peer), Master
   Build Plan / index rows, each new package's status + authorization state.
2. **Recommendations** — spec defects or Open Questions routed upstream, right-sizing concerns,
   critical-path risks, and any toolchain confirmation still owed to `03`, the owner should know
   before authorizing.
3. **Next step** — if the new package(s) are `READY` and authorized (release-plan coverage cited,
   or an explicit owner go-ahead on record), advance to the owning stage-08 peer naming the first
   package (critical-path first); if authorization is missing, ask the owner for the explicit
   go-ahead; if planning was blocked upstream, name the owning skill and what it must resolve.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
