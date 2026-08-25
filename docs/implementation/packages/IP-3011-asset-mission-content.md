# IP-3011 — Mission-Set & Asset-Type Content Templates

- **Package ID:** IP-3011 · **Status:** COMPLETE (2026-08-22) · **Owning stage-08 peer:**
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

- [x] All 9 template files exist (7 asset types incl. the two optical variants, 3 mission sets),
      schema-valid, cross-referenced correctly (mission set ↔ asset type — every mission set's
      `assetTypeIds` resolves to a real asset template, test-verified).
- [x] Ground/space cost-time asymmetry present and directionally correct across the roster
      (test-verified: every ground template has `timeToOnline` ≤1, every space template ≥3).

## Verification Checklist

- [x] **G5 gate:** build clean. **G5 gate:** full test suite passes (29 total: 1 shared + 28
      server, incl. this package's 4 in `contentTemplates.test.ts`).
- [x] Schema validation test passes for every template (via `loadContent` + `TemplateRegistry`'s
      existing validation, IP-3010).
- [ ] Flagged for `09-content-review` after `09-package-verification` — doctrinal-coherence
      judgment is out of this package's own verification scope (mechanical only).

## Deviation / known-gap note

`loadContent.ts` reads the JSON templates via `fs.readdirSync`/`readFileSync` relative to its own
`__dirname` at runtime, not as TypeScript-imported modules — `tsc -b` type-checks it cleanly but
does **not** copy the `.json` files into `server/dist/`, so a built-and-packaged server (not yet
exercised by any package — `IP-7010`'s transport work is the first to actually start the server
for real) would not find its content at the expected `dist/content/...` path without an added
build step (e.g. a small copy script). Filed as BL-0027 for whichever package first needs the
server to run from its built output, not this one (this package's own G5 gate — build + `npm
test`, which runs against source, not `dist/` — is unaffected and genuinely green).

## Dependencies

IP-3010 (`COMPLETE`, not yet `VERIFIED` — proceeded pragmatically since the schema is stable/
tested and blocking on ledger status alone would idle real, available work; `09-package-
verification` will independently re-confirm both).

## Risks

Low-Medium — the actual doctrinal grounding for exact AP-cost numbers depends on
`02-research-domain` (R-1xx tier, not yet authored, BL-0017); proceeded with reasoned,
labeled-as-provisional costs consistent with FS-102's asymmetry rule.

## Rollback Considerations

Pure data files — a bad template is corrected and re-validated with no migration concern.
