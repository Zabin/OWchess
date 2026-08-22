# IP-3010 — Asset Roster: Template Registration & Deploy Lifecycle

- **Package ID:** IP-3010 · **Status:** BLOCKED (on IP-0010, IP-1010) · **Owning stage-08 peer:**
  `08-code-implementation`
- **Source:** FS-102 (`docs/features/FS-102-asset-roster-mission-sets.md`), FEAT-3000 — engine
  mechanism portion only (data templates are IP-3011, `08-content-authoring`).
- **Authorization (G3):** Covered by the release plan.

## Objective

Implement the template-registration mechanism, deploy action (cost deduction, time-to-online
lifecycle), and pre-online use-blocking — the *engine* that IP-3011's data templates plug into.
Folds in BL-0013's resolution: **v1 ships with no per-template deploy cap, bounded only by AP
scarcity** (the deliberately-simpler default, consistent with FS-102's own "no source document
mandates a cap" finding — chosen here as the lower-risk, less-scope-adding option for MVP; easy to
add a cap later behind the same registry if playtesting shows it's needed, without a data-model
change).

## Requirements Covered

FR-3100, FR-3200, FR-3300, FR-3400, FR-3500, NFR-5100, NFR-9200.

## Architecture Components

`GameEngine`'s deploy-action handler; a new (FS-102-implied, GDS-07-consistent) `TemplateRegistry`
holding the schema-validated template shapes IP-3011 populates.

## Interfaces

Consumes `TurnManager.submitAction` (IP-1010) for AP/turn legality. Exposes a `deployAsset(
actingPlayer, templateId, targetRegime)` handler `GameEngine.handleAction`'s dispatch shell (IP-
1010) routes `deploy`-type actions to — this package fills in that previously-stubbed case.

## Files to Create

- `server/src/engine/TemplateRegistry.ts` (schema + load/validate, no data yet — IP-3011 adds the
  actual JSON), `server/src/engine/deployAction.ts`
- `server/src/engine/__tests__/deployAction.test.ts`,
  `server/src/engine/__tests__/TemplateRegistry.test.ts`

## Implementation Tasks

1. Define the `AssetTemplate`/`MissionSetTemplate` TypeScript shape (`TemplateRegistry.ts`) that
   IP-3011's JSON data must validate against — schema only, no content.
2. Deploy action: check AP cost (per template), deduct on success, create an `Asset` record in
   `PlayerState` with `onlineAt: currentTurn + template.timeToOnline` (ground vs. space asymmetry
   per FS-102's Purpose), reject if insufficient AP (no other cap — BL-0013's resolution).
3. Pre-online blocking: any action targeting an `Asset` whose `onlineAt` hasn't passed is rejected
   (FR-3500), consumed later by IP-2010/4010/5010's own action handlers via a shared
   `assertOnline(asset, currentTurn)` helper this package exports.
4. Wire `deployAsset` into IP-1010's `handleAction` switch (replacing that case's stub).

## Tests to Add

`TemplateRegistry.test.ts`: schema validation accepts/rejects malformed templates.
`deployAction.test.ts`: successful deploy, insufficient-AP rejection, `onlineAt` computed
correctly for a ground vs. space template, pre-online action rejection via `assertOnline`.

## Documentation Updates

FS-102's metadata: `**Implemented by:** IP-3010 (engine), IP-3011 (content)`. Backlog: BL-0013
flips `DONE`, disposition citing this package's §Objective note.

## Definition of Done

- [ ] Deploy action enforces AP cost and unlimited-bounded-only-by-AP quantity (BL-0013).
- [ ] `onlineAt` lifecycle correct for both ground and space asset variants.
- [ ] Pre-online use blocked for every action type via the shared `assertOnline` helper.

## Verification Checklist

- [ ] **G5 gate:** build clean. **G5 gate:** full test suite passes.
- [ ] FS-102 Acceptance Criteria mapped to passing tests.
- [ ] `TemplateRegistry`'s schema matches exactly the fields IP-3011's data templates will need
      (checked jointly with IP-3011 at that package's authoring time).

## Dependencies

IP-0010, IP-1010 (both `VERIFIED` required).

## Risks

Low-Medium — the ground/space time-to-online asymmetry is the one piece of real domain logic;
otherwise straightforward CRUD-shaped work.

## Rollback Considerations

No persisted state; safe to fix forward.
