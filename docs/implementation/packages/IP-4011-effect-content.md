# IP-4011 — Five D's Effect-Definition Content

- **Package ID:** IP-4011 · **Status:** BLOCKED (on IP-4010) · **Owning stage-08 peer:**
  `08-content-authoring`
- **Source:** FS-105 (`docs/features/FS-105-effect-resolution.md`), FEAT-4000 — data portion.
- **Authorization (G3):** Covered by the release plan.

## Objective

Author the Five D's effect-definition data: Deceive, Disrupt, Deny, Degrade, Destroy parameter
sets (duration, stacking behavior, which effector asset types can apply which effect), consistent
with FS-105's pinned durations (Disrupt/Deny 3 turns, Degrade 4 turns) and the 6-turn
mission-denial threshold already baselined upstream.

## Requirements Covered

FR-4300, FR-4400 (data-content aspects of the same FR set IP-4010 covers mechanically).

## Architecture Components

Data only — populates `EffectResolver`'s effect-definition table.

## Interfaces

None new — conforms to whatever `EffectDefinition` shape IP-4010 exposes for this content to
populate (IP-4010 Task 1 defines the parameter fields this package's data must match).

## Files to Create

- `server/src/content/effects/deceive.json`, `disrupt.json`, `deny.json`, `degrade.json`,
  `destroy.json`
- `server/src/content/__tests__/effectDefinitions.test.ts`

## Implementation Tasks

1. Encode each Five D's effect's duration (Disrupt/Deny: 3 turns; Degrade: 4 turns; Destroy:
   terminal/no duration; Deceive: persists until overwritten by a fresh tasking observation, per
   FS-105/GDS-04), and which of IP-3011's 6 asset types (kinetic/RPO effector, EW/jamming
   effector, primarily) may apply which effect.
2. Validate against IP-4010's `EffectDefinition` schema at load time.

## Tests to Add

`effectDefinitions.test.ts`: every effect file parses and validates; durations match FS-105's
pinned values exactly (3/3/4/terminal); no effector asset type references an effect it shouldn't
be able to apply per doctrine (cross-checked against IP-3011's asset-type content).

## Documentation Updates

FS-105 metadata: content half of `**Implemented by:**` line.

## Definition of Done

- [ ] All 5 effect-definition files exist, schema-valid, durations match FS-105 exactly.

## Verification Checklist

- [ ] **G5 gate:** build clean. **G5 gate:** full test suite passes.
- [ ] Schema validation test passes for every effect file.
- [ ] Flagged for `09-content-review` (doctrinal coherence of effector-to-effect mapping) after
      `09-package-verification`.

## Dependencies

IP-4010 (`VERIFIED` — schema must exist before content validates against it).

## Risks

Low — durations are already pinned by FS-105 with stated rationale; the only real content
decision is the effector-to-effect capability mapping, informed by `02-research-domain` (R-1xx,
not yet authored) the same way IP-3011 is.

## Rollback Considerations

Pure data; safe to correct with no migration concern.
