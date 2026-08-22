# FS-104 — Orbital Mechanics & the `Propagator` Boundary

- **Feature ID:** FS-104 (from **FEAT-5000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 · **Owned by:** `06-feature-specification` · **Epic:** EP-1000 (Core Game Engine)

## Purpose

Give every asset a real, physically-grounded position, presented to players as a discrete
regime, isolated behind a swappable interface — carried forward verbatim from FEAT-5000's
Purpose.

## Scope

Two-body Keplerian propagation (the v1 baseline per MSTR-001 C4 v0.3 — J2/SGP4 deferred, OQ-14);
the 9-value regime taxonomy (R-203, amended); maneuver budget/cost; turn-scale maneuver completion
counted in the mover's own turns; the `Propagator` interface itself, built as a genuine seam so
J2/SGP4 can be added later without a rewrite. Excludes what a player does with a reached position
(tasking is FEAT-2000, engaging is FEAT-4000).

## Requirements Implemented

FR-5100, FR-5200, FR-5300, FR-5400, FR-5500, NFR-1200, NFR-5300.

## User Workflows

**W1 — Continuous propagation (automatic, every turn-advance, no player action)**
1. On every turn-advance (either player's), `Propagator.advance` updates the true orbital elements
   of every asset in the session using two-body Keplerian motion.
2. This runs regardless of whose turn it is or what either player does — it is a background
   process of the turn loop, not a player-initiated action.

**W2 — Initiate a maneuver**
1. During an active turn, the player selects an owned, online asset and a target regime (one of
   R-203's 9 values).
2. Server checks: 1 AP available (flat cost, per the requirements tuning table), and the asset's
   remaining fuel-analog budget covers the maneuver (exact per-regime-pair cost: **Open Question**,
   below — CR-03).
3. `Propagator.planManeuver` returns `turnsRequired`; 1 AP is deducted; `Asset.maneuverState` is
   set to `{targetRegime, turnsRemaining: turnsRequired}`.

**W3 — Maneuver in progress and completion**
1. Each turn-advance belonging to the *maneuvering asset's owner* (not any turn-advance — GDS-03's
   OQ-11 resolution), `turnsRemaining` decrements.
2. When it reaches 0, `Propagator.maneuverComplete` returns true; `maneuverState` clears;
   `Asset.trueRegime` reflects the new regime.

**W4 — Regime read (consumed by other Features, not a player action)**
1. `Propagator.currentRegime` returns the asset's current discrete regime label — the only
   position information any other module (`BeliefState`, `GameEngine`, the client) may ever read.

## System Behaviour

| Workflow step | Normal path | Edge case(s) |
|---|---|---|
| W1 | Every asset's true elements update deterministically. | No edge case — this is unconditional background processing; NFR-2100 (deterministic resolution) requires it produce identical results given identical prior state and elapsed turns. |
| W2 | AP deducted, maneuver begins, `turnsRequired` set. | Insufficient AP or fuel budget: rejected before mutation (same all-or-nothing discipline as FS-102/103's own gated actions). Maneuvering an offline asset: rejected (FR-3500, cross-Feature dependency on FS-102). |
| W3 | Maneuver completes on schedule, regime updates. | The owner's session ends before completion: same non-issue as FS-102 W3 — a concluded session has no further turns to decrement on. A second maneuver requested while one is already in progress: this spec assumes it is rejected (an asset can only have one `maneuverState` at a time, per GDS-07's schema — a single `maneuverState` field, not an array) — flagged in Risks as an assumption worth confirming, since no FR explicitly forbids queuing a second maneuver. |
| W4 | Returns exactly one of R-203's 9 labels. | N/A — `currentRegime` has no failure mode; it is a pure function of `Propagator`'s internal state. |

## Module Responsibilities

`Propagator` — owns all four workflows: continuous advancement (W1), maneuver planning and
completion tracking (W2/W3), and discrete-regime classification (W4). No other module computes
orbital state or classifies regimes (GDS-03's boundary — enforced here as this Feature's entire
job).

## Interfaces Used

- `Propagator.advance(assets)` (GDS-09) — W1.
- `Propagator.planManeuver(asset, targetRegime)` (GDS-09) — W2, returns `turnsRequired`.
- `Propagator.maneuverComplete(asset)` (GDS-09) — W3.
- `Propagator.currentRegime(asset)` (GDS-09) — W4.

No new interface — GDS-09's existing `Propagator` contract already covers this Feature's full
scope exactly (unsurprising, since GDS-09 was written from this same Feature's GDS-03/04 grounding).

## Data Model Changes

Reads and writes `Asset.trueRegime`, `Asset.maneuverState` (`{targetRegime, turnsRemaining}` or
`null`) per GDS-07. No new fields. This Feature is the sole writer of `trueRegime`.

## State Changes

`Asset.maneuverState`: `null` → `{targetRegime, turnsRemaining: N}` (W2) → decrements per owner-
turn (W3) → `null` again on completion, with `trueRegime` updated to `targetRegime` at that point.

## Error Handling

- **Insufficient AP/fuel budget** (W2 edge case): rejected before mutation.
- **Offline asset** (W2 edge case): rejected, per FR-3500 (FS-102's contract, not re-specified).
- **Concurrent second maneuver** (W3 edge case): this spec's assumption is rejection — see Risks.

## Performance Considerations

NFR-1200 (propagation efficiency, <100ms per turn-advance across the full v1 roster) is this
Feature's direct performance obligation — two-body Keplerian propagation (per MSTR-001 C4 v0.3)
is computationally trivial at this scale (closed-form position update per asset, no iterative
perturbation terms), so this budget should be comfortably met; this spec does not need to propose
any optimization beyond straightforward per-asset computation.

## Integrity Considerations

NFR-5300 (`Propagator` isolation) — no caller may hold a reference to this Feature's internal
orbital-element representation; every external read goes through `currentRegime` (W4), returning
only a discrete label (FR-5200). This is the concrete mechanism by which FR-5200's "never raw
orbital elements" requirement is enforced, not merely stated.

## Acceptance Criteria

1. Every asset's true position updates via two-body Keplerian motion on every turn-advance,
   regardless of whose turn it is.
2. A maneuver deducts 1 AP, checks fuel budget, and sets `turnsRequired` from `planManeuver`.
3. `turnsRemaining` decrements only on the maneuvering asset owner's own turns (not the
   opponent's), completing the maneuver at the correct turn per GDS-03's OQ-11 resolution.
4. `currentRegime` never returns anything but one of R-203's 9 named labels — never a raw
   inclination/altitude value, checked by inspecting every code path that calls it.
5. No module outside `Propagator` computes or classifies orbital position.

## Verification Plan

Test (deterministic given fixed initial elements — NFR-2100) + Analysis (cross-check the two-body
position update against a primary astrodynamics reference, e.g. Vallado, once the numerical
implementation exists — no longer gated on R-201/202 the way a J2 implementation would have been,
per MSTR-001 C4 v0.3's own consequence).

## Dependencies

FS-101 (turn/AP gate; maneuver completion counted against `TurnManager`'s own-turn tracking),
FS-102 (asset online state, per-template maneuver budget).

## Risks

- **Concurrent maneuver assumption** (see System Behaviour/State Changes) — this spec assumes an
  asset can have at most one in-progress maneuver, rejecting a second request. No FR explicitly
  states this; it follows from GDS-07's single-field `maneuverState` schema, but that schema
  choice was GDS-07's, not a requirement — flagged as an Open Question below rather than silently
  treated as settled.
- Otherwise Medium risk overall (per the catalog's revised rating post-MSTR-001-C4-v0.3) — mostly
  ordinary new-module risk, not orbital-mechanics-specific risk anymore.

## Open Questions

- **CR-03** (carried from `04-requirements-engineering`, updated for two-body scope per MSTR-001
  C4 v0.3): the per-regime-pair fuel-analog budget and transfer-time-in-turns table. Matters
  because W2/W3 cannot be assigned concrete numbers without it. Resolved by:
  `02-research-orbital-and-tooling` (R-201/R-202, two-body vis-viva-equation delta-v figures)
  first, then this stage adopts them — **not** recommended for immediate owner resolution the way
  CR-01/CR-02 were, since this one genuinely needs the research grounding first, not just a
  product judgment call.
- **Concurrent maneuver rejection** (new, this spec): whether a second maneuver request while one
  is in-progress is rejected outright, queued, or replaces the first. Matters because it's a real
  player-facing behavior no FR currently states. Resolved by: confirm at `07-implementation-
  planning`, or treat this spec's "rejected outright" as settled if no objection — low-stakes,
  same posture as FS-101's win-condition-ordering question (BL-0012).

## Related ADRs

ADR-0001 (tech stack).
