---
name: 08-code-implementation
description: Implement exactly one approved, eligible Implementation Package end-to-end — write the server engine/transport/client code and tests it describes (candidate modules once confirmed by architecture: GameEngine, Propagator implementation, BeliefState/fog-of-war tracker, EffectResolver, TurnManager, WebSocket transport, client UI), build/start the app, run the full test suite, fix defects this package's own changes introduced, update the documentation and traceability the package names, and advance that package's status on the Master Build Plan. Use when asked to "implement IP-####," "pick up the next ready package and build it," or "execute the next step of the Master Build Plan." This is the first skill in the pipeline authorized to modify production source. It implements exactly one package per invocation, never redesigns architecture, never edits requirements/specs/packages, and never chooses work outside the Master Build Plan. A package already scheduled by the current, owner-approved release plan is authorized (G3) on that basis alone; a package outside or diverging from the release plan still needs its own explicit owner go-ahead. Content-only packages (mission-set/asset-type/effect-definition data templates) belong to its peer 08-content-authoring; verification to VERIFIED belongs to 09-package-verification.
---

# Code Implementation

Turns **one approved, eligible Implementation Package** into **working, tested code**. Strictly
downstream of planning; strictly upstream of independent verification. One package per
invocation, never more.

## What this is for (and what it is not)

One question: *given one package and everything decided upstream, what is the smallest, most
faithful set of code and test changes that satisfies exactly what the package describes — no
more, no less — leaving the repository fully green and fully traceable?*

It SHALL NOT: redesign architecture (a design that doesn't fit once you're in the code is a
Blocking Report, not a license to redraw a boundary) · change requirements · modify the FS or the
package being executed (drift/staleness is a Blocking Report) · select work outside the Master
Build Plan (no "while I'm here" fixes — Outstanding Issues instead) · write `VERIFIED` (stage
09's exclusive transition) · invent a build/test/start command not recorded by the toolchain ADR
— if the package's Verification Checklist cites a command that doesn't match the confirmed
toolchain, that's a Blocking condition, not something to route around with a guess.

Authoritative read-only inputs: the Master Build Plan · the package · its FS · the requirements
it covers (+ RTM) · GDS-03/07/09 + ADRs.

**Write scope (G1):** the server engine/transport modules and client UI code the confirmed
architecture names, plus exactly the files the package names. The data templates for mission
sets/asset types/effect definitions belong to `08-content-authoring` — a package that needs both
surfaces should have been split; if it wasn't, that's a planning finding, not a reason to cross
the seam silently (note it and implement only what the package names).

## Workflow

### Step 0–1 — Read the plan, select the package

Read the full Master Build Plan status table + dependency graph. If the owner named a package,
that's the candidate — still gate-check it. Otherwise select deterministically: status exactly
`READY` → every dependency `VERIFIED` (**`COMPLETE` is not sufficient**) → prefer critical path →
lowest ID → if still tied, ask. Zero survivors: stop and report what's closest and what it waits
on.

**Eligibility ≠ authorization (G3), but release-plan coverage satisfies it.** Check the package's
recorded authorization state. A package that implements work the current, owner-approved release
plan already schedules, in the shape the plan describes, is authorized on that basis — no separate
go-ahead needed; cite the matching release-plan section/row. A package not on the release plan, or
diverging materially from what it describes, needs its own explicit owner go-ahead on record. If
neither basis is present, stop and ask.

### Step 2–3 — Read the package and everything it cites

Every field, not just Implementation Tasks. Then verify the package's claims about the current
tree (files, module/function names, interfaces) still hold — material drift is a **Blocking
Report**, never routed around with a plausible substitute. Confirm the recorded toolchain commands
(build/start/test) match what `07-implementation-planning` actually recorded from the confirmed
tech-stack ADR — an unconfirmed toolchain is itself a blocking condition, not something to guess
past.

### Step 4 — Mark `IN PROGRESS` before the first edit

Update the Master Build Plan so a second session can't pick the same package.

### Step 5 — Implement only the work described

File by file per Files to Create/Modify and Implementation Tasks. Test-first where practical:
encode the package's "done when" as a failing test, then implement until it passes. Never touch a
file the package doesn't name; never add an abstraction or refactor it didn't ask for; respect
its explicit out-of-scope statements. Domain-shaped care points: keep the `Propagator`'s internal
continuous-state math from leaking past its interface boundary into game-rule code; keep the
server as the sole authority over game state (never trust a client-submitted belief-state value);
keep fog-of-war belief-state updates computed server-side and diffed minimally before pushing over
the WebSocket transport; keep turn-change notifications ordered and idempotent against a dropped
or duplicated message.

### Step 6 — Run the permanent gates (G5) and the full suite

Run the app's build/start command and the full automated test suite, using the exact commands
`07-implementation-planning` recorded from the confirmed toolchain (this skill does not invent
them). Both must succeed cleanly.

(If a genuine toolchain defect blocks a local run, that's a finding for `00-intake`, not a fix to
make here outside the package's own scope.)

### Step 7 — Fix only defects this package introduced

A failure caused by this package's changes is in scope — fix it. A pre-existing, unrelated
failure is an Outstanding Issue (named, with the failing check), never a rider fix.

### Step 8–9 — Documentation and traceability

Update exactly the locations the package's Documentation Updates names — for this project that
routinely includes `CLAUDE.md`'s architecture/data-layout/Known Good Behavior sections and
`memory.md`'s quick-reference tables once those exist, when the change moves an interface, adds an
asset type, or changes observable behavior. Then update the RTM: every Requirements Covered ID
now traces to the real file(s)/test(s) this run produced, replacing `UNASSIGNED`.

### Step 10–11 — Ledger, summary, stop

Set the package `COMPLETE` (never `VERIFIED`); update downstream packages' blocking notes without
auto-promoting them past the `VERIFIED`-dependency rule. Present the **Implementation Summary**:
Package Implemented · Files Modified · Files Created · Tests Added · Tests Passed (full-suite
counts — never a partial run presented as the whole) · Requirements Implemented · Documentation
Updated · Traceability Updated · Outstanding Issues. **Stop** — no second package, even if one
just became eligible.

## Blocking conditions

Stop immediately — no partial workarounds — when: the package fails eligibility/authorization ·
its cited files/interfaces have materially drifted · executing it as written would require
redesigning architecture or changing a requirement · a dependency doesn't exist · the toolchain
this package's Verification Checklist relies on is unconfirmed or doesn't match the recorded ADR.
Produce a **Blocking Report** (Reason · Missing dependency · Required action · Recommended owner),
set the package `BLOCKED` with a pointer, and end the run — no consolation package.

## Quality checklist (before presenting `COMPLETE`)

- [ ] Status was `READY`, dependencies `VERIFIED`, authorization cleared with its basis cited.
- [ ] Every touched file appears in the package's file lists (or is an implied test), and the
      content-peer seam (mission-set/asset-type/effect-definition data templates) was not
      crossed.
- [ ] App builds/starts cleanly; full test suite passes; every Tests to Add item exists and
      passes.
- [ ] Every Requirements Covered ID traces to real files/tests in the RTM.
- [ ] Documentation Updates locations updated; nothing unrelated touched.
- [ ] Master Build Plan shows `COMPLETE`; no downstream package auto-promoted.
- [ ] The Implementation Summary matches the actual diff.
- [ ] No server-authority or fog-of-war boundary was crossed by accident (client trusted with a
      value the server should own, or a hidden-state field leaked to the wrong player).

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 08 — Package Execution** of the documentation-driven-development pipeline
(see [`.claude/skills/README.md`](../README.md)). Peer: `08-content-authoring` (mission-set/asset/
effect data). Upstream: `07-implementation-planning`. Downstream: `09-package-verification` (the
only skill that may write `VERIFIED`).

The Implementation Summary carries the run's factual record; in the same closing message,
additionally state:

1. **Recommendations** — every Outstanding Issue with its suggested owner (a follow-up package
   via `07`, an upstream artifact owner, or the owner).
2. **Next step** — after `COMPLETE`, always `09-package-verification` on this same package
   (ideally in a fresh session, for independence) — never another implementation run first;
   after a Blocking Report, whatever its Required action/Recommended owner names.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
