---
name: 10-integration-review
description: Review a set of VERIFIED Implementation Packages together — an epic, a release bucket, or an explicitly named package set — for cross-package integration defects that per-package verification cannot see: interface mismatches between packages (Propagator contract drift, WebSocket message-schema mismatches, mission-set/asset-type ID collisions, effect-parameter conflicts), violated load-bearing invariants (server-authoritative state, fog-of-war non-leakage, turn-alternation strictness, one-job-per-module boundaries), duplicated or contradictory behavior, seams left half-wired (e.g. an effect that's computed but never wired to the board's rendering or the win-condition check), and documentation/index incoherence across the set. Produces an Integration Report under docs/reviews/. Use when asked to "run the integration review," "check that the verified packages work together," or after 09-package-verification closes the last package of a tranche. Read-only with respect to code, packages, specs, and requirements — it reports and routes findings, never fixes them. Do not use it to verify a single package (09-package-verification) or to make the release go/no-go call (11-release-readiness).
---

# Integration Review

Reviews **a set of `VERIFIED` packages as a whole** — the seams *between* packages that no
single-package pass can see. Strictly downstream of stage 09 (every package in scope must be
`VERIFIED`); strictly upstream of `11-release-readiness`. Pure review: it observes, exercises,
and reports; it changes nothing but its own report.

## Scope selection

An **Epic** (per `docs/feature-planning/02-epic-catalog.md`), a **release bucket** (per
`01-release-plan.md`), or an **explicit package list**. Every package in scope must be `VERIFIED`
on the Master Build Plan — if any isn't, stop and report which, rather than reviewing around the
hole.

## What to check (the review dimensions)

1. **Interface consistency** — where two packages touch the same contract (the `Propagator`
   interface between the orbital-math boundary and the game engine, a WebSocket message schema
   between server and client, mission-set/asset-type ID namespaces, effect-parameter shapes), do
   both sides agree as shipped? Exercise the real seam: rebuild/start, drive the affected flows
   through the app.
2. **Invariant sweep** — the load-bearing invariants hold *across* the set: the server remains the
   sole authority over game state everywhere (no client-trusted value found anywhere in the
   set); fog-of-war belief-state is never computed or exposed client-side beyond what the server
   sent; strict turn alternation holds across every reviewed flow; no module took on a second job;
   mission-set/asset-type/effect ID namespaces are collision-free.
3. **Behavioral coherence** — no two packages implement the same behavior divergently; no
   player-visible workflow that spans packages dead-ends at a seam (e.g. an effect one package
   computes that no package ever wires to the board's rendering, or to the win-condition check).
4. **Traceability coherence** — RTM, feature catalog, Master Build Plan, package index tell the
   same story about what this set delivered; cross-references bidirectional and unbroken.
5. **Documentation coherence** — `CLAUDE.md`'s architecture/data-layout/Known Good Behavior
   sections, `memory.md`'s quick-refs, and the affected `INDEX.md` files reflect the integrated
   result, not per-package snapshots.
6. **Module-reachability sweep (mandatory, G6.1)** — the dimension that distinguishes this review
   from a sum of per-package ones. For **every module in the reviewed set**, ask: *is it called
   from the running application?* Enumerate each module's public entry points and grep for a
   production (non-test) caller. Then walk the composition root — whatever wires the app together
   — and confirm every module the architecture names is actually constructed and invoked there,
   including turn/lifecycle hooks. **A module whose only callers are tests has not been
   integrated**, regardless of how green its own suite is or how `VERIFIED` its package is.

   Report the sweep as a table — module → entry point → production call site (file:line) — with
   "none found" stated explicitly where it is true. A clean sweep must show its work; the absence
   of a finding is not evidence of reachability.

   *Why this dimension exists (and why dimension 3 alone was not enough):* dimension 3 already
   said "no player-visible workflow dead-ends at a seam — e.g. an effect one package computes that
   no package ever wires to the board's rendering, **or to the win-condition check**." Two
   integration reviews cited that dimension and passed clean while `checkWinConditions`, the event
   log and `Propagator.advance()` all had zero production callers. The failure was one of
   **method**: both reviews checked the seams *between the packages in scope* rather than asking
   whether each module was reachable at all. Dimension 3 states the goal; this dimension states
   the procedure — run the greps, walk the composition root, put the file:line in the table.

## Output

**`docs/reviews/integration-review-<scope>.md`**: scope + package list (commit hash reviewed),
evidence per dimension, and findings as one row each — `Finding | Packages/artifacts involved |
Description | Severity | Recommended owner` — Critical/High/Medium/Low. A clean review states
what was actually exercised. Full gates (app build/start + full test suite) run against the
reviewed commit, results recorded.

## Quality gate

- [ ] Every package in scope confirmed `VERIFIED` before the review began.
- [ ] All six dimensions actually exercised — a clean dimension says what was checked.
- [ ] **Reachability table produced** (dimension 6): every module → entry point → production
      call site, with "none found" stated explicitly where true. Not inferred from dimension 3.
- [ ] App rebuild/**start** run against the reviewed commit — the real process launched and a real
      client connected (G5), not merely compiled — plus the full suite, results recorded.
- [ ] Every finding has a severity and a concrete recommended owner; none fixed in-pass.
- [ ] Nothing but the report (and tracker rows) was written.

## Pipeline position & completion summary (mandatory, every run)

This skill is **Stage 10 — Integration Review** of the pipeline (see
[`.claude/skills/README.md`](../README.md)). Upstream: `09-package-verification` /
`09-content-review`. Downstream: `11-release-readiness`.

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — the Integration Report written (path), scope reviewed, headline result
   (clean / N findings by severity).
2. **Recommendations** — each finding with its recommended owner: integration defects in shipped
   code → `07-implementation-planning` (remediation package) then stage 08; stale
   documentation/traceability → its owning artifact's skill; upstream design flaws →
   `03-architecture-design-synthesis` / `04-requirements-engineering`.
3. **Next step** — no Critical/High findings: advance to `11-release-readiness` for the release
   this scope belongs to; Critical/High findings: `07-implementation-planning` to package the
   remediation and loop 07→08→09 until a re-run of this review is clean.

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
