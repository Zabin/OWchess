# GDS-00 — Vision (design-facing restatement)

- **Owned by:** `01-vision` · **Status:** 🟢 Gate-confirmed, same gate state as MSTR-001 v0.4 ·
  **Source:** `docs/master/MSTR-001-program-vision.md` v0.4

This is the design-facing restatement of MSTR-001, in the vocabulary the GDS ladder builds on.
MSTR-001 is authoritative for purpose-level statements; this document translates its commitments
into terms `03-architecture-design-synthesis` can build GDS-01…10 from.

## What OW Chess is, in system terms

A single authoritative Node process per game session, running a strict turn-resolution loop:

1. **Join** — two players join a session via a shareable link; the session does not start until
   both have joined (FR-1001–1003).
2. **Deploy (King placement)** — both players secretly select a mission set + orbital regime for
   their King; both selections are held server-side, revealed to neither client, and resolved
   simultaneously once both are submitted (FR-1004–1005).
3. **Turn loop** — the server grants the active player a fixed AP allotment, accepts and validates
   actions against current legality, rejects anything from the non-active player, advances the
   turn on pass/AP-exhaustion, and broadcasts the resulting state delta to each client **filtered
   through that client's own fog-of-war** (FR-1006–1009, FR-3001–3002).
4. **Resolve chain** — sensor tasking advances belief-state precision along find→fix→track→target
   (FR-3003–3006); a targeting-quality track makes an engagement action legal; engagement applies
   one of the Five D's to the target's state (FR-4001–4005).
5. **Win-check** — after each resolved action, check King-destruction, mission-denial-duration,
   resignation, and timeout/tiebreak conditions (FR-1010–1011, §7.9).

Underlying all of this: asset positions are propagated by a real orbital-mechanics model —
**two-body Keplerian motion for the v1 baseline** (MSTR-001 C4, amended v0.3; J2/SGP4 are a later,
deliberate call, not a fixed floor) — isolated behind a `Propagator`-equivalent interface
(FR-5001, FR-5005); the player-facing presentation
never shows raw orbital elements, only discrete named regimes/slots (FR-5002).

There is no simultaneous/concurrent-action resolution to design for — turns are strict
alternating, so the server's only concurrency concern is rejecting the non-active player's
actions, not resolving a race (SOR §7.2). **This reading (OQ-01b) is confirmed by the owner**
(2026-08-21) — `03-architecture-design-synthesis` should design the turn-resolution model on this
basis without further hedging.

## What must be decided at GDS-03 (not guessed here)

Per MSTR-001 C4 (the ground/space cost-time asymmetry) and C6 (win-condition thresholds), several
things are deliberately left undecided for `03-architecture-design-synthesis`/
`04-requirements-engineering` to answer concretely:

- The **exact orbital-regime/slot taxonomy** — how many altitude bands, how many plane/inclination
  classes, and the maneuver-transfer-time formula connecting real delta-v to turn-scale cost
  (SOR §7.6, §14).
- The **AP cadence and action costs** — allotment per turn, whether unspent AP carries over, and
  numeric cost/time-to-online for each asset in the roster (SOR §7.2, §7.5, §14, OQ-05/OQ-10).
- The **mission-denial win threshold** (consecutive turns) and the **maximum session length +
  tiebreak rule** (SOR §7.9, OQ-06/OQ-07).
- The **full asset-template schema** (SOR §8.4, §12) and the concrete `Propagator` interface
  signature.
- The **disconnect/reconnect grace-period behavior** (FR-6003).

## Visual/presentation grounding — resolved, not open

Unlike the items above, GDS-08 (presentation architecture) is **not** starting from a blank
placeholder: MSTR-001 §4 documents a real, directly-inspected style precedent (`ZabOW`'s
`ORBITAL COMMAND`, now on its `main` branch) — a radial LEO/MEO/GEO band layout, corner-anchored
HUD panels, and a dark cyan/red "ops console" palette that maps closely onto this project's own
SOR §9.2 panel inventory. `03-architecture-design-synthesis` should treat this as the concrete
starting point for GDS-08, adapting it for a turn-based (not touch-drag real-time) interaction
model and a 2-player (not single-player campaign) information structure.

## Testability requirement carried down from MSTR-001 §6

Every shipped behavior must be expressible as an automated test: given a fixed sequence of
server-received actions, game-state resolution is deterministic (NFR-3001) and assertable —
specifically, legal-action enumeration, fog-of-war non-leakage, the F2T2E gating chain, and every
win-condition path must each have direct test coverage (SOR §13). This shapes GDS-07 (Data Model):
belief-state and event-log structures need a form the test harness can assert against directly,
not only a form convenient for rendering.

## Open questions this vision surfaces (not decided here)

Per the owner's kickoff instruction, every SOR §16 item was restated with its trigger condition in
the [Strategic Assumptions Register](strategic-assumptions-register.md) rather than being quietly
adopted. OQ-03 (visual style), OQ-01, OQ-01b, OQ-02, and OQ-09 are now resolved (see the register
for exact wording, especially OQ-02's delegation-not-confirmation resolution). OQ-04–OQ-08 and
OQ-10 remain open, proceeding to their originally-named downstream stage unchanged.

**Gate:** closed 2026-08-21. Next: GDS-01 (Concept of Operations) via
`03-architecture-design-synthesis`, including the tech-stack ADR that OQ-02's resolution requires.

## Training corpus as a co-equal product (added v0.4, MSTR-001 C10)

Per MSTR-001 C10, the operator-facing training corpus (`docs/training/` + `docs/manual/`) is a
co-equal deliverable, not incidental documentation. In system terms: it is a second, parallel
artifact stream with its own requirements (a new FR/NFR family, next via
`04-requirements-engineering`), its own authoring/verification pipeline stages (a stage-08 peer of
`08-code-implementation` and a stage-09 peer of `09-package-verification`, to be authored), and its
own currency obligation — every operator-visible capability the game ships must have corresponding,
as-built-verified manual coverage before a release bucket's `11-release-readiness` gate can
recommend GO. This is scoped for OW Chess's actual shape: one symmetric two-player game with no
facilitator/multi-role structure, so the corpus is a single shared player-facing manual, not
per-role manuals (unlike the `ZabSpaceExercise` pattern this is modeled on, which needs White/Blue/
Red-scoped manuals for its facilitated multi-cell exercise format).
