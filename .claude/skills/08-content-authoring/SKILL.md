---
name: 08-content-authoring
description: Implement exactly one approved, eligible content-scoped Implementation Package — the JSON/YAML data templates for mission sets (SATCOM, ISR, PNT-lite), asset types (wide-area SDA radar, ground tracking array, space-based SDA sensor, optical/imaging sensor, kinetic/RPO effector, EW/jamming effector), and effect definitions (the Five D's — Deceive, Disrupt, Deny, Degrade, Destroy) — plus the tests that verify them, build/start the app, run the full suite, and advance the package on the Master Build Plan. Use when asked to implement a content package ("add the new mission-set template," "define the new asset type," "add an effect-definition entry," "implement IP-####" where the package names this skill). Peer of 08-code-implementation, which owns engine/transport/client logic; this skill never edits engine, transport, or UI logic beyond the data-registration hook its package explicitly names. Verification to VERIFIED belongs to 09-package-verification; qualitative review belongs to 09-content-review.
---

# Content Authoring

The stage-08 peer that owns OW Chess's **data content**: mission-set definitions, asset-type
definitions, and effect-definition templates — the curated, structured data (JSON/YAML) the game
engine reads and applies at runtime. Same discipline as `08-code-implementation` — one approved,
eligible package per invocation, faithful to the package, full suite green after — with a
content-shaped write surface and content-shaped verification.

Note the seam this peer sits on: the *rules engine* that applies an effect, resolves a mission
constraint, or scores a win condition is runtime logic and belongs to `08-code-implementation`.
This skill owns the *curated data* that engine consumes and selects from — a mission set's
required assets, an asset's declared capabilities, an effect's declared parameters — not the
resolution logic. A package that blurs this line should have been split at stage 07; if it
wasn't, implement only this skill's half and file the seam problem as an Outstanding Issue.

## Write scope (G1)

- Mission-set data templates (SATCOM/ISR/PNT-lite definitions: required/associated asset types,
  win-relevant properties).
- Asset-type data templates (the six-asset roster's declared capabilities per mission/effect
  relevance — never the F2T2E resolution logic that consumes them).
- Effect-definition data templates (the Five D's — parameters, applicability conditions — never
  the resolver logic).
- The test suite's checks verifying the new content (schema validation, cross-reference integrity
  against the engine's expected shape), extending the existing suite pattern.
- A data-registration hook in engine/build code **only if** the package explicitly names it (e.g.
  a registration call wiring a new mission-set file into the loaded set) — the surrounding logic
  stays out of scope.

Everything else — resolution logic, transport, session state, UI — is
`08-code-implementation`'s surface. A package needing both surfaces should have been split at
stage 07; if it wasn't, implement only this skill's half and file the seam problem as an
Outstanding Issue.

## Workflow (mirrors the code peer; differences below)

1. **Select & gate** exactly as `08-code-implementation` Steps 0–1 (status `READY`, dependencies
   `VERIFIED`, G3 authorization cleared). The package must name this skill as its owner.
2. **Read the package + spec + the content quick-refs** — `memory.md`'s asset/mission/effect
   index and GDS-07/GDS-04 once authored — before drafting any data. Verify claimed IDs/slots are
   actually free and referenced schema fields exist.
3. **Mark `IN PROGRESS`**, then author the content per the package:
   - **Mission sets:** the established schema shape (required/associated asset types, win-relevant
     properties) — curated static data, not selection logic.
   - **Asset types:** capability declarations in the established schema shape; register in the
     content-registration hook the package names.
   - **Effect definitions:** the Five D's parameter shapes, applicability conditions, in the
     established schema shape the resolver consumes.
   - **Numeric fields:** any AP/action cost, asset cost, or effect-duration value in the content
     must cite the FR/NFR/FS baseline it refines — a number with no upstream citation is a defect,
     not this skill's decision to make.
4. **Verify (G5 + eyes):** run the app's build/start and the full test suite, **and** exercise the
   affected mission set/asset/effect through the app (or a scripted scenario) to confirm the data
   actually produces the intended in-game effect — content work is not done on green checks
   alone; captured evidence (a scenario walkthrough, a screenshot if the UI renders it) goes in
   the Implementation Summary for `09-content-review` to judge.
5. **Docs & traceability:** update `memory.md`'s mission/asset/effect quick-refs and any
   Documentation Updates the package names; fill the RTM cells for Requirements Covered.
6. **Ledger, summary, stop:** package → `COMPLETE`; Implementation Summary (same fields as the
   code peer, plus the exercised-scenario evidence); no second package.

## Blocking conditions & quality checklist

Identical in kind to `08-code-implementation` (drift, eligibility, authorization → Blocking
Report; full-suite green, scope discipline, traceability, honest summary) — plus:

- [ ] New content registered via the package's named hook and recorded in `memory.md`'s
      mission/asset/effect index.
- [ ] Every numeric value in the content cites its upstream FR/NFR/FS baseline.
- [ ] Evidence of the content's exercised in-game effect captured and referenced in the summary.

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 08 — Package Execution (content peer)** of the pipeline (see
[`.claude/skills/README.md`](../README.md)). Upstream: `07-implementation-planning`. Downstream:
`09-package-verification` (ledger verification) and `09-content-review` (qualitative review of
the resulting in-game behavior).

End every run with the Implementation Summary plus:

1. **Recommendations** — Outstanding Issues with suggested owners.
2. **Next step** — after `COMPLETE`: `09-package-verification` on this package, then
   `09-content-review` for the exercised result (both before any dependent package builds on it);
   after a Blocking Report: whatever it names.

Never end a run without naming the next step.
