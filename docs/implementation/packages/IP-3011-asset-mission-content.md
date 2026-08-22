# IP-3011 — Mission-Set & Asset-Type Content Templates

- **Package ID:** IP-3011 · **Status:** BLOCKED (on IP-3010) · **Owning stage-08 peer:**
  `08-content-authoring`
- **Source:** FS-102 (`docs/features/FS-102-asset-roster-mission-sets.md`), FEAT-3000 — data
  portion (engine mechanism is IP-3010).
- **Authorization (G3):** Covered by the release plan.

## Objective

Author the actual v1 content data: 3 mission-set templates (SATCOM, ISR, PNT-lite) and 6 asset-
type templates (wide-area SDA radar, ground tracking array, space-based SDA sensor, optical/
imaging sensor [ground + space variants], kinetic/RPO effector, EW/jamming effector), each
validating against IP-3010's `TemplateRegistry` schema, with AP cost / time-to-online / plane-
class-affinity fields grounded in `02-research-domain`'s doctrine vocabulary (once authored) and
FS-102's own asymmetry rule (ground assets online faster/cheaper than space assets).

## Requirements Covered

FR-3100, FR-3200, FR-3300, FR-3400 (data-content aspects of the same FR set IP-3010 covers
mechanically).

## Architecture Components

Data only — no new module; populates `TemplateRegistry`.

## Interfaces

None new — conforms to IP-3010's `AssetTemplate`/`MissionSetTemplate` schema exactly.

## Files to Create

- `server/src/content/missionSets/satcom.json`, `isr.json`, `pnt-lite.json`
- `server/src/content/assetTypes/wide-area-sda-radar.json`, `ground-tracking-array.json`,
  `space-based-sda-sensor.json`, `optical-imaging-sensor-ground.json`,
  `optical-imaging-sensor-space.json`, `kinetic-rpo-effector.json`, `ew-jamming-effector.json`
- `server/src/content/__tests__/contentTemplates.test.ts`

## Implementation Tasks

1. For each of the 6 asset types: AP cost, time-to-online (ground: faster/cheaper; space: slower/
   costlier, per FS-102's Purpose), sensor `chainRoles` capability ceiling (find/fix/track/target,
   per FR-3003/GDS-09) or effector Five-D's capability, orbital-regime affinity (which of R-203's
   9 regimes this asset type is doctrinally suited to, per SOR §7.4).
2. For each of the 3 mission sets: which asset types compose it, and its King-placement regime
   affinity (SATCOM → equatorial-GEO; ISR → polar/sun-synchronous-LEO, matching SOR Appendix B's
   worked example and R-203 §4's operational-context guidance; PNT-lite → its own doctrinally
   appropriate regime, per `02-research-domain` once authored).
3. Validate every template against IP-3010's schema at load time (fails loudly on mismatch, not
   silently).

## Tests to Add

`contentTemplates.test.ts`: every template file parses and validates against the schema; every
mission set's referenced asset types actually exist in the asset-type set; no duplicate IDs.

## Documentation Updates

FS-102 metadata: content half of `**Implemented by:**` line. `09-content-review` is the follow-on
qualitative check (doctrinal coherence, not just schema validity) once this package ships.

## Definition of Done

- [ ] All 9 template files exist, schema-valid, cross-referenced correctly (mission set ↔ asset
      type).
- [ ] Ground/space cost-time asymmetry is present and directionally correct across the roster.

## Verification Checklist

- [ ] **G5 gate:** build clean. **G5 gate:** full test suite passes.
- [ ] Schema validation test passes for every template.
- [ ] Flagged for `09-content-review` after `09-package-verification` — doctrinal-coherence
      judgment is out of this package's own verification scope (mechanical only).

## Dependencies

IP-3010 (`VERIFIED` required — schema must exist before content can validate against it).

## Risks

Low-Medium — the actual doctrinal grounding for exact AP-cost numbers depends on
`02-research-domain` (R-1xx tier, not yet authored); this package can proceed with reasoned
placeholder-but-labeled costs consistent with FS-102's asymmetry rule and flag the gap for
`02-research-domain` to ground more precisely before `09-content-review`.

## Rollback Considerations

Pure data files — a bad template is corrected and re-validated with no migration concern.
