# FS-102 — Asset Roster & Mission Sets

- **Feature ID:** FS-102 (from **FEAT-3000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 · **Owned by:** `06-feature-specification` · **Epic:** EP-1000 (Core Game Engine)
- **Implemented by:** [IP-3010](../implementation/packages/IP-3010-asset-roster-lifecycle.md)
  (engine, COMPLETE, awaiting `09-package-verification`), [IP-3011](../implementation/packages/IP-3011-asset-mission-content.md) (content, COMPLETE, awaiting `09-package-verification` and `09-content-review`)

## Purpose

Provide the data-driven content (mission sets, asset types) every other Feature operates on, and
enforce the ground/space cost-time asymmetry — carried forward verbatim from FEAT-3000's Purpose.

## Scope

Schema-validated templates for the three v1 mission sets (SATCOM, ISR, PNT-lite) and six v1 asset
types (wide-area SDA radar, ground tracking array, space-based SDA sensor, optical/imaging sensor
in ground/space variants, kinetic/RPO effector, EW/jamming effector); the deploy action's
cost-deduction and time-to-online lifecycle; blocking use before online. Excludes what a deployed
asset *does* once online — tasking (FEAT-2000), engaging (FEAT-4000), and maneuvering (FEAT-5000)
are specified elsewhere and consume this Feature's templates without this Feature owning their
behavior.

## Requirements Implemented

FR-3100, FR-3200, FR-3300, FR-3400, FR-3500, NFR-5100, NFR-9200.

## User Workflows

**W1 — Template registration (build-time/content-authoring, not a player action)**
1. A content author defines an asset or mission-set template conforming to the schema (fields:
   id, display name, basing, chain roles, cost, time-to-online, effect type(s), regime affinities
   — per SOR §8.4/§12).
2. The template is registered with the game's content registry at startup.
3. No player-facing step here — this workflow exists so FS-102 can state the mechanism its
   player-facing workflows (W2+) depend on.

**W2 — Deploy a new asset**
1. During an active turn (gated by FEAT-1000's `TurnManager`), the player selects a template to
   deploy from those their remaining AP can afford.
2. The server validates: sufficient AP remains (per the template's cost), and the deploying
   player doesn't already violate any per-template limit (none exists in v1 — an unlimited count
   of any asset type is legal, per the absence of any such limit in the requirements baseline;
   flagged as an Open Question below since this seems like a real gap, not a deliberate choice).
3. AP is deducted per the template's cost (FR-3400); a new `Asset` instance is created with
   `deployState.turnsUntilOnline` set to the template's time-to-online value.

**W3 — Asset comes online**
1. Each turn-advance belonging to the deploying player, `deployState.turnsUntilOnline` decrements
   (consistent with GDS-03's OQ-11 resolution: counted in the owner's own turns, the same
   convention as maneuver transfer time).
2. When it reaches 0, `deployState` is cleared and the asset becomes usable by any action type its
   `chainRoles` support.

**W4 — Attempt to use an asset before it's online**
1. A player attempts to task/maneuver/engage with an asset whose `deployState.turnsUntilOnline >
   0`.
2. The action is rejected (FR-3500).

## System Behaviour

| Workflow step | Normal path | Edge case(s) |
|---|---|---|
| W1 | Template validates against the schema and registers cleanly. | A malformed template (missing required field, invalid `chainRoles` value) fails registration at startup, not at first use — a fail-fast contract this spec asserts is necessary for NFR-5100's "addable without code changes" promise to be trustworthy, though the exact validation-failure UX (build error vs. runtime log) is server-operator-facing, not player-facing, and left to `07`/`08`. |
| W2 | AP deducted, asset created with correct time-to-online. | Insufficient AP for the selected template: rejected before any state mutation (consistent with FEAT-1000's own turn/AP gate — this Feature's deploy action is one of the action types that gate checks). |
| W3 | Countdown reaches 0 on schedule, asset usable. | The owning player's session ends (win/resign) before the asset comes online: the countdown simply stops mattering — no special handling needed, since a concluded session has no further turns to decrement on. |
| W4 | N/A (illegal action correctly blocked). | The player retries the same action next turn once online — ordinary legal-action flow, no special "was blocked" state persists. |

## Module Responsibilities

- **Content templates** (data, not engine code, per the catalog's own module note) — hold the
  actual mission-set/asset-type definitions.
- **`GameEngine`** — validates and processes the deploy action (AP deduction, `Asset` creation),
  per GDS-03.

No new module. `Propagator`/`BeliefState`/`EffectResolver` read template fields (`chainRoles`,
regime affinity, effect type) but do not own the templates themselves.

## Interfaces Used

- `GameEngine.handleAction(sessionId, actingPlayer, action)` — the deploy action routes through
  this same single entry point FS-101 already established (GDS-09); this spec adds a deploy
  `Action` variant, not a new entry point.
- No `Propagator`/`BeliefState`/`EffectResolver` interface calls originate in this Feature —
  those modules *consume* template data (basing, chain roles) that this Feature supplies, via the
  `Asset.templateId` reference (GDS-07), not via a call into this Feature.

## Data Model Changes

Reads and writes `Asset.templateId`, `Asset.basing`, `Asset.chainRoles`, `Asset.deployState` (per
GDS-07 — no new fields; this Feature is what actually populates them at deploy time). Introduces
no new entity — `MissionSet`/asset-type templates are already named in GDS-04's domain model as a
data-driven lookup, not a new schema this spec invents.

## State Changes

`Asset.deployState`: created at deploy (`{turnsUntilOnline: N}`) → decrements per owner-turn
(FR-3400/GDS-03's OQ-11 convention) → cleared (`null`) once online. No `SessionState`/`PlayerState`
top-level phase changes — this Feature only touches per-asset state and the deploying player's
`apRemaining` (owned jointly with FEAT-1000's AP gate).

## Error Handling

- **Insufficient AP for deploy**: rejected before any mutation (FR-3400's own cost-deduction
  contract implies an all-or-nothing check).
- **Pre-online use attempt**: rejected (FR-3500), consistent with FS-101's general "no dead menu
  entries" discipline — the asset tray (FEAT-8000) should show a not-yet-online asset as
  visibly unusable, not merely reject it after the fact (NFR-4200), though the actual UI treatment
  is FEAT-8000's own FS to specify.
- **Malformed template at registration** (W1): fails at startup, per the System Behaviour table.

## Performance Considerations

None beyond the general per-turn-advance cost NFR-1200 already covers (this Feature's countdown
decrement is O(1) per asset per turn-advance, negligible against that budget).

## Integrity Considerations

NFR-5100 (data-driven content, no code changes) is this Feature's core promise — verified by
Inspection (a template-only change touches no engine module), consistent with its Verification
Method in the requirements baseline. No fog-of-war implication: deployable-asset cost/time-to-
online (FR-8300) is public roster information, not hidden opponent state, so this Feature has no
belief-state-filtering obligation of its own (confirmed at GDS-05's own cross-check pass — no new
finding here).

## Acceptance Criteria

1. All three mission sets and six asset types are registered and selectable at game start.
2. Deploying an asset deducts its template's AP cost and sets its time-to-online to the template's
   value.
3. An asset becomes usable exactly when its owner has completed that many of their own turns since
   deployment — no earlier, no later.
4. Any action targeting a not-yet-online asset is rejected.
5. Adding a new template (mission set or asset type) requires no change to `GameEngine`,
   `Propagator`, `BeliefState`, or `EffectResolver` — verified by inspection of the diff a template
   addition produces.

## Verification Plan

Test (deploy cost/countdown behavior, pre-online rejection) + Inspection (NFR-5100's
code-change-free extensibility claim, checked against an actual template-addition diff once the
codebase exists).

## Dependencies

FEAT-1000 (deploy is an AP-spending action gated by `TurnManager`; FS-101 already specifies that
gate — this spec adds the deploy action's own content, not a new gate).

## Risks

- **Unbounded deploy count** (see Open Questions) — if genuinely unlimited, a degenerate strategy
  (deploy many cheap radars) could exist; low risk given the small AP budget (5/turn) bounds how
  much any one turn can spend regardless.
- Otherwise low risk — this Feature is schema/data plus a well-bounded lifecycle state machine,
  consistent with the catalog's own Low-Complexity rating.

## Open Questions

- **Per-template deploy limits** (new, this spec): no source document states whether a player may
  deploy an unlimited number of instances of the same asset type, or whether there's a cap (per
  mission-set balance, or a "you can only usefully have N radars" doctrinal limit). Matters because
  it affects both game balance and UI (does the asset tray ever gray out a template for "already
  have enough"?). Resolved by: `04-requirements-engineering`/`06-feature-specification` — if a
  limit is wanted, it's a new numeric-tuning decision in the same spirit as the existing cost/
  time-to-online table; if genuinely unlimited is the intended design (AP scarcity alone as the
  natural brake), that should be stated as a deliberate choice, not left implicit. Recommend the
  owner confirm which, since it's cheap to decide now and changes the acceptance criteria above.

## Related ADRs

None beyond ADR-0001 (tech stack — templates are TypeScript-typed data per that decision).
