# FS-104 — Orbital Mechanics & the `Propagator` Boundary

- **Feature ID:** FS-104 (from **FEAT-5000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 (revised 2026-08-22 — Maneuver Cost Table added, resolving
  CR-03) · **Owned by:** `06-feature-specification` · **Epic:** EP-1000 (Core Game Engine)

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
   remaining fuel-analog budget covers the maneuver (exact per-regime-pair cost: the Maneuver Cost
   Table below, resolving CR-03).
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

## Maneuver Cost Table (resolves CR-03)

Derived from R-201's real two-body Δv/time-of-flight figures (`docs/research/R-201-keplerian-
elements-two-body-propagation.md`), decomposed into an altitude component and a plane-class
component so the 9×9 regime-pair matrix (72 ordered transitions) doesn't need to be tabulated by
hand — `Propagator.planManeuver` computes a transition's cost/turns from these two components plus
the combined-maneuver discount R-201 §4/§5 calls for.

**Altitude component** (fuel units / turns), independent of plane class, following R-201 §3.2's
relative Δv/time ordering:

| Altitude change | Fuel | Turns |
|---|---|---|
| Same band | 0 | 0 |
| LEO ↔ MEO | 3 | 2 |
| MEO ↔ GEO | 1 | 3 |
| LEO ↔ GEO | 4 | 4 |

**Plane-class component** (fuel units / turns), evaluated **at the asset's current altitude band**
— cheaper the higher the starting altitude, per R-201 §3.3's `Δv = 2v·sin(Δi/2)` figures:

| Plane-class change | at LEO | at MEO | at GEO |
|---|---|---|---|
| Same plane | 0 / 0 | 0 / 0 | 0 / 0 |
| Equatorial ↔ Prograde, or Prograde ↔ Polar | 6 / 2 | 3 / 1 | 2 / 1 |
| Equatorial ↔ Polar | 11 / 3 | 5 / 2 | 4 / 1 |

**Combined maneuver** (both altitude and plane class change in one `planManeuver` call — the
common case, e.g. `LEO-EQUATORIAL → GEO-POLAR`): fuel cost = altitude component + plane component
(plane component priced at the *starting*, lower altitude, before any benefit from the altitude
change) − 25% combined-maneuver discount, rounded down (per R-201 §4's note that a real combined
burn costs less than two sequential burns); turns required = the larger of the two components'
turn counts, +1 (reflecting one combined maneuver, not two sequential ones, while still costing
more turns than either alone). Example: `LEO-EQUATORIAL → GEO-POLAR` = altitude (4/4) + plane at
LEO (11/3) = 15 fuel before discount → 11 fuel (⌊15×0.75⌋) / max(4,3)+1 = 5 turns.

These are this stage's own numeric refinement of CR-03, per this skill's authority to pin
feature-level tuning values the requirements baseline deferred — the *relative* shape (plane
changes cost far more than altitude changes; cheaper at higher altitude; combined maneuvers are
discounted) is R-201's real physics, not invented; the specific fuel-unit/turn scale chosen here
is a game-tuning translation of that shape, open to `07`/`08`'s own balance-pass adjustment without
needing to revisit the underlying physical ordering.

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

Test (deterministic given fixed initial elements — NFR-2100; the Maneuver Cost Table's
altitude/plane/combined arithmetic is a pure function, directly unit-testable against the worked
example above) + Analysis (cross-check the two-body position update against a primary
astrodynamics reference, e.g. Vallado/Curtis, once the numerical implementation exists — no longer
gated on R-201/202 the way a J2 implementation would have been, per MSTR-001 C4 v0.3's own
consequence).

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

- **Concurrent maneuver rejection** (new, this spec): whether a second maneuver request while one
  is in-progress is rejected outright, queued, or replaces the first. Matters because it's a real
  player-facing behavior no FR currently states. Resolved by: confirm at `07-implementation-
  planning`, or treat this spec's "rejected outright" as settled if no objection — low-stakes,
  same posture as FS-101's win-condition-ordering question (BL-0012).

## Related ADRs

ADR-0001 (tech stack).
