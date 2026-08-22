# FS-103 — Sensing & the F2T2E Chain

- **Feature ID:** FS-103 (from **FEAT-2000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 · **Owned by:** `06-feature-specification` · **Epic:** EP-1000 (Core Game Engine)

## Purpose

Let a player advance their knowledge of the opponent through sensor tasking, gated by asset
capability, decaying if not maintained — carried forward verbatim from FEAT-2000's Purpose.

## Scope

The mechanics of gaining/losing knowledge: tasking a sensor, precision advancement along find→
fix→track→target, staleness decay, and surfacing precision/staleness to the UI. Excludes the
*enforcement* that nothing beyond that knowledge ever reaches a client — that invariant belongs
to FEAT-6000 (Fog-of-War Enforcement), which reads this Feature's output (`BeliefStateEntry`
records) but is specified separately so its centrally-tested security boundary isn't diluted by
this Feature's own content logic.

## Requirements Implemented

FR-2100, FR-2200, FR-2300, FR-2400.

## User Workflows

**W1 — Task a sensor**
1. During an active turn, the player selects one of their online sensors (per FS-102's
   `deployState`) and a target: a regime, an existing track, or an unresolved contact.
2. Server deducts 1 AP (per the requirements baseline's flat tasking cost) and records the
   tasking against that sensor for this turn.

**W2 — Precision advances, gated by capability**
1. The tasking resolves against the sensor's `chainRoles` (from its template, FS-102) — a
   Find-only sensor can only ever produce a `'find'`-level reading; a Track-capable sensor can
   push an existing entry from `'fix'` to `'track'`, etc.
2. `BeliefState.applyTasking` updates (or creates) the relevant `BeliefStateEntry`: subject,
   new precision (never higher than the sensor's own capability ceiling), `lastUpdatedTurn`,
   `sourceAssetId`.

**W3 — Staleness decay**
1. Once per turn-advance, `BeliefState.decayStaleEntries` runs for the belief-holding player.
2. Any entry not refreshed within the (currently undecided — see Open Questions) staleness window
   has its precision reduced one level, or is flagged stale, per FR-2300's mechanism.

**W4 — View current intel**
1. The player's intel panel (FEAT-8000, out of this Feature's scope to render) reads this
   Feature's `BeliefStateEntry` set — filtered, at the wire level, through FEAT-6000's
   enforcement boundary before ever reaching a client — and displays precision + staleness.

## System Behaviour

| Workflow step | Normal path | Edge case(s) |
|---|---|---|
| W1 | AP deducted, tasking recorded. | Insufficient AP: rejected before mutation (same discipline as FS-102's deploy action — this Feature's tasking action is gated the same way). Tasking an offline sensor (FS-102's pre-online block): rejected, per FR-3500 (cross-Feature dependency, not re-specified here). |
| W2 | Precision advances up to the sensor's capability ceiling. | Tasking a Find-only sensor repeatedly: precision never exceeds `'find'`, regardless of how many turns are spent — this is the doctrinal core of the F2T2E gating (SOR §7.3), not a bug to fix later. Tasking against a target already at the sensor's ceiling: no-op (the reading is refreshed — `lastUpdatedTurn` updates — but precision doesn't change), which matters because a player might re-task purely to reset staleness (W3), a legitimate strategy this spec doesn't forbid. |
| W3 | Stale entries degrade by one precision level. | An entry already at `'find'` (the floor) that goes stale: this spec does not specify whether it degrades further to "no entry at all" (the contact reverts to fully unknown) or floors at `'find'` indefinitely — flagged as an Open Question, since it changes what the intel panel shows for a long-neglected contact. |
| W4 | Precision/staleness rendered accurately. | N/A for this Feature (FEAT-8000's own rendering correctness is that Feature's contract, not this one's — this Feature's contract ends at producing a correct `BeliefStateEntry`). |

## Module Responsibilities

`BeliefState` — owns all of W1–W3 (tasking resolution, precision gating, decay). This is the same
module FEAT-6000 uses for its enforcement half (`computeOpponentView`) — GDS-03 already notes
this dual role is correct (deriving belief-state *is* `BeliefState`'s one job), not a boundary
violation.

## Interfaces Used

- `BeliefState.applyTasking(observer, sourceAsset, targetRegime, turnNumber)` (GDS-09) — W1/W2.
- `BeliefState.decayStaleEntries(observer, currentTurn)` (GDS-09) — W3.
- `GameEngine.handleAction(...)` — the tasking action's entry point, same single-entry-point
  discipline as every other Feature's actions.

No new interface needed; GDS-09's existing `BeliefState` contract already covers this Feature's
full scope.

## Data Model Changes

Reads and writes `BeliefStateEntry` (`subject`, `precision`, `lastUpdatedTurn`, `sourceAssetId`,
`apparentRegime`) per GDS-07. No new fields. Reads `Asset.chainRoles`/`deployState` (FS-102's
domain) to determine tasking legality and precision ceiling — a read-only cross-Feature
dependency, not a modification of FS-102's own data ownership.

## State Changes

`BeliefStateEntry.precision`: advances (W2) or degrades (W3) by exactly one level per event; never
jumps more than one level in either direction in a single operation (a design implication of the
gated-by-capability/gated-by-decay-rate model, not stated as a separate requirement but necessary
for FR-2200/2300 to compose correctly — flagged in Risks as an assumption worth confirming at `07`).
`BeliefStateEntry.lastUpdatedTurn`: set on every successful tasking (W1/W2), read by W3.

## Error Handling

- **Insufficient AP / offline sensor** (W1 edge case): rejected, same pattern as FS-102.
- **Tasking a sensor whose `chainRoles` don't cover the requested chain step at all** (e.g. an
  effector, which has no sensing `chainRoles`): rejected — this spec treats "no matching
  `chainRoles`" as a distinct rejection reason from "capability ceiling reached," since the first
  is a category error (wrong asset type) and the second is a legitimate refresh action (W2's
  no-op case) — the UI (FEAT-8000) should be able to distinguish these for a clear player-facing
  reason, per NFR-4001's "UI is the rules reference" discipline.

## Performance Considerations

`decayStaleEntries` (W3) runs once per turn-advance per player — bounded by the number of that
player's `BeliefStateEntry` records, which is itself bounded by the small v1 roster size; well
within NFR-1200's per-turn compute budget.

## Integrity Considerations

This Feature produces the data FEAT-6000's `computeOpponentView` filters — it does not itself
decide what crosses the client boundary (that's FEAT-6000's job exclusively, per GDS-06). This
Feature's own integrity obligation is narrower: `BeliefStateEntry.precision` must never exceed
what the sourcing sensor's `chainRoles` actually support (W2) — a content-correctness invariant,
distinct from FEAT-6000's transport-security invariant, and tested separately from it.

## Acceptance Criteria

1. Tasking a sensor deducts 1 AP and records/updates the correct `BeliefStateEntry`.
2. Precision never exceeds the tasking sensor's `chainRoles` ceiling, regardless of repeated
   tasking.
3. An entry not refreshed for the (TBD) staleness window degrades by one precision level per
   decay cycle.
4. Tasking an offline sensor, or one with no relevant `chainRoles`, is rejected with a
   distinguishable reason from a legitimate ceiling-reached no-op.

## Verification Plan

Test — deterministic given a fixed tasking sequence (consistent with NFR-2100/NFR-8100's
coverage bar, which explicitly names "the F2T2E gating chain" as a required test surface).

## Dependencies

FS-101 (turn/AP gate), FS-102 (asset templates/online state — `chainRoles` is this Feature's
primary read dependency on that spec).

## Risks

- **Precision-jump assumption** (see State Changes) — this spec assumes single-level
  advance/degrade per event; if a future requirement wants multi-level jumps (e.g. an especially
  capable sensor skipping `'fix'` straight to `'track'` in one tasking), that would need a
  requirements-level change, not a quiet reinterpretation here.
- Otherwise low — this Feature's logic is well-bounded and the catalog already rates it Medium
  complexity for exactly the reason named in Open Questions (the decay rate, not the mechanism).

## Open Questions

- **CR-01** (carried from `04-requirements-engineering`): the exact staleness/decay window (how
  many turns before a downgrade). Matters because W3 cannot be fully specified numerically without
  it. Resolved by: `06-feature-specification` per its own numeric-tuning-refinement scope — since
  this spec is itself `06`'s output, recommend the owner supply this number now (same posture as
  CR-02 was resolved) rather than leaving it open past this stage, given it's the last blocking
  gap in this Feature's own completeness.
- **Floor behavior at `'find'`** (new, this spec): whether a stale `'find'`-level entry degrades
  to no-entry-at-all or floors indefinitely at `'find'`. Matters for what the intel panel shows for
  a long-neglected contact. Resolved by: `06-feature-specification` (a small addendum once CR-01's
  numeric window is set) or `07-implementation-planning` if genuinely low-stakes enough not to need
  another owner round-trip — recommend bundling this with CR-01's resolution rather than a
  separate question.

## Related ADRs

None beyond ADR-0001.
