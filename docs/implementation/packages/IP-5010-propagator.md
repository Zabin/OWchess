# IP-5010 — `Propagator` (Two-Body Orbital Mechanics)

- **Package ID:** IP-5010 · **Status:** BLOCKED (on IP-0010, IP-1010, IP-3010, IP-3011) ·
  **Owning stage-08 peer:** `08-code-implementation`
- **Source:** FS-104 (`docs/features/FS-104-orbital-mechanics-propagator.md`), FEAT-5000
- **Authorization (G3):** Covered by the release plan.

## Objective

Implement `Propagator`: continuous two-body Keplerian propagation (`advance`), discrete-regime
classification (`currentRegime`, R-203's 9 labels), and maneuver planning/completion
(`planManeuver`/`maneuverComplete`) using FS-104's newly-adopted Maneuver Cost Table (grounded in
R-201), with BL-0014's resolution folded in: **a second maneuver request while one is already in
progress is rejected outright** (FS-104's own assumption, confirmed here as the shipped behavior —
matches GDS-07's single-field `maneuverState` schema; no queuing or replacement).

## Requirements Covered

FR-5100, FR-5200, FR-5300, FR-5400, FR-5500, NFR-1200, NFR-5300.

## Architecture Components

`Propagator` — the sole module computing/holding orbital state (GDS-03's isolation boundary).

## Interfaces

Implements `Propagator.advance`, `.currentRegime`, `.planManeuver`, `.maneuverComplete` (GDS-09) in
full, including the Maneuver Cost Table's altitude-component/plane-component/combined-maneuver
formula (FS-104 §Maneuver Cost Table) inside `planManeuver`.

## Files to Create

- `server/src/engine/Propagator.ts` (two-body propagation, regime classification, maneuver cost/
  time formula), `server/src/engine/__tests__/Propagator.propagation.test.ts`,
  `server/src/engine/__tests__/Propagator.maneuverCost.test.ts`

## Implementation Tasks

1. `advance(assets)`: closed-form two-body position update per asset per turn-tick (no J2 term,
   per MSTR-001 C4 v0.3) — deterministic given fixed initial elements (NFR-2100).
2. `currentRegime(asset)`: classify true inclination/altitude into one of R-203's 9 labels using
   R-203 §5's fixed thresholds (inclination bands centered 0°/45°/90°; altitude bands per R-203
   §3.1) — never expose raw elements past this call.
3. `planManeuver(asset, targetRegime)`: compute fuel cost and `turnsRequired` from FS-104's
   Maneuver Cost Table (altitude component + plane component at the *starting* altitude, minus the
   25% combined-maneuver discount, per the worked example in FS-104); reject (BL-0014) if
   `asset.maneuverState` is already non-null.
4. `maneuverComplete(asset)`: true when `turnsRemaining` (decremented by IP-1010's own-turn-scoped
   turn-advance loop, per GDS-03's OQ-11 resolution) reaches 0; updates `trueRegime`.

## Tests to Add

`Propagator.propagation.test.ts`: deterministic two-body position update given fixed elements;
`currentRegime` never returns a raw numeric value, only one of the 9 labels.
`Propagator.maneuverCost.test.ts`: the FS-104 worked example (`LEO-EQUATORIAL → GEO-POLAR` = 11
fuel / 5 turns) as a named regression test; a same-band plane-only change; a same-plane
altitude-only change; BL-0014's rejection of a second concurrent maneuver.

## Documentation Updates

FS-104 metadata: `**Implemented by:** IP-5010`. Backlog: BL-0014 flips `DONE`.

## Definition of Done

- [ ] All 4 Implementation Tasks complete; the Maneuver Cost Table's worked example passes as a
      named regression test.
- [ ] No caller outside `Propagator` can access raw orbital elements (Inspection).

## Verification Checklist

- [ ] **G5 gate:** build clean. **G5 gate:** full test suite passes.
- [ ] FS-104 Acceptance Criteria mapped to passing tests.
- [ ] **Analysis** (per FS-104's Verification Plan): the two-body position update cross-checked
      against a primary astrodynamics reference (Vallado/Curtis) for at least one worked orbit, not
      only unit-tested against itself.

## Dependencies

IP-0010, IP-1010, IP-3010, IP-3011 (all `VERIFIED` — needs assets with a real maneuver-budget
field from their template).

## Risks

Medium — the one module the vision/architecture historically flagged as architecturally hardest;
the two-body-only v1 baseline (MSTR-001 C4 v0.3) substantially reduces this from the original
J2-inclusive risk rating, but the Maneuver Cost Table's combined-maneuver arithmetic is new,
untested-in-practice logic worth its own dedicated regression test (above).

## Rollback Considerations

No persisted state; safe to fix forward. A cost-table tuning change post-launch is a data/constant
edit inside `Propagator`, not a schema migration.
