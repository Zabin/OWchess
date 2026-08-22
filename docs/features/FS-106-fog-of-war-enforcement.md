# FS-106 — Fog-of-War Enforcement

- **Feature ID:** FS-106 (from **FEAT-6000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 · **Owned by:** `06-feature-specification` · **Epic:** EP-2000 (Trust Boundary & Transport)

## Purpose

Guarantee, as a single centrally-tested boundary, that no client ever receives more opponent
information than that player has earned — carried forward verbatim from FEAT-6000's Purpose. This
is the project's single highest-priority test surface (NFR-3100/GDS-06).

## Scope

The enforcement boundary only: server-only ground truth (no client-side storage or inference of
opponent state) and routing every outbound opponent-facing message through
`BeliefState.computeOpponentView`. Excludes the mechanics that *produce* belief-state content
(FEAT-2000, which this Feature filters the output of) and excludes *rendering* that content
(FEAT-8000, which only ever receives the already-filtered `OpponentView`). Deliberately thin, by
design (per the catalog's own rationale) so it has its own dedicated, centrally-run test surface.

## Requirements Implemented

FR-6100, FR-6200, NFR-3100.

## User Workflows

This Feature has no player-initiated workflow of its own — it is a pure enforcement layer other
Features' actions pass through. Its "workflow" is the invariant it holds on every message:

**W1 — Every outbound state-delta is constructed through one function**
1. Whenever `GameEngine` needs to send a `StateDeltaMessage` to a client (after any other
   Feature's action resolves — FS-101 through FS-105), it calls
   `BeliefState.computeOpponentView(observer, trueOpponentState, turnNumber)` for the `opponentView`
   field.
2. No other code path in the system constructs an `OpponentView`-shaped object. `ownState` (the
   recipient's own full true state) is sent directly — only the opponent-facing half goes through
   this gate.

**W2 — Client never holds ground truth**
1. The client codebase has no type, no code path, and no server message that could populate an
   opponent `PlayerState` — only `OpponentView` (GDS-07's structurally distinct type).

## System Behaviour

| Workflow step | Normal path | Edge case(s) |
|---|---|---|
| W1 | Every `StateDeltaMessage.opponentView` originates from `computeOpponentView`. | A future Feature's implementation attempts to bypass this (e.g. directly serializing a `PlayerState` for convenience): this is exactly the failure mode this Feature exists to prevent — caught by the centrally-run fog-of-war test suite (Verification Plan below), not by a per-feature review alone. |
| W2 | Client type system has no path to an opponent `PlayerState`. | N/A — this is a structural (type-level) guarantee once GDS-07's `OpponentView`/`PlayerState` distinction is implemented as stated; there is no runtime edge case, only an implementation-correctness one. |

## Module Responsibilities

`BeliefState` (the enforcement half — distinct from FEAT-2000's content-producing half of the same
module, per GDS-03's note that this dual role is correct) — owns `computeOpponentView`.
`GameEngine` — owns the single-construction-point discipline (calling `computeOpponentView`
exactly once per outbound delta, never constructing an opponent view itself).

## Interfaces Used

`BeliefState.computeOpponentView(observer, trueOpponentState, turnNumber)` (GDS-09) — this
Feature's entire interface surface. No new interface.

## Data Model Changes

None new. This Feature's entire contract is about *which* existing types (`OpponentView` vs.
`PlayerState`, GDS-07) get sent where — it introduces no new field or entity.

## State Changes

None. This Feature is stateless with respect to game state — it is a pure filter/projection
function invoked at message-construction time.

## Error Handling

Not applicable in the normal sense — there is no user-facing failure mode for this Feature.
Its "error" is a defect (a leak), which is a testing/code-review concern, not a runtime error path
with a player-visible contract.

## Performance Considerations

`computeOpponentView` runs once per outbound state-delta — the same frequency as every other
Feature's own message construction, so it adds no separate performance budget beyond NFR-1100's
existing turn-notification latency target (FEAT-7000's concern), which this Feature's own compute
cost is negligible against.

## Integrity Considerations

This entire Feature **is** an integrity consideration — NFR-3100 (fog-of-war non-leakage) is its
sole reason to exist as a separate Feature rather than being folded into FEAT-2000. Every other
Feature's specification (FS-101 through FS-105) already states "this Feature does not itself
decide what crosses the client boundary" — this is the Feature that makes that statement true.

## Acceptance Criteria

1. Every `StateDeltaMessage.opponentView` field, for every message the system ever sends, traces
   to a `computeOpponentView` call — verified by inspecting every code path that constructs a
   `StateDeltaMessage`.
2. No client-side code path accepts, stores, or derives an opponent `PlayerState`-shaped object.
3. A fog-of-war test suite exercises this invariant against the output of every other Feature
   (FS-101–105, and later FS-107/108 for transport/UI) that produces client-bound data — not
   re-verified ad hoc per feature, per GDS-06's explicit instruction.

## Verification Plan

Test — a **single, centrally-run fog-of-war test suite** (not one test per feature) that:
constructs game states covering every other Feature's data (King placement, belief-state entries,
active effects, orbital regimes), calls the real message-construction path, and asserts the
resulting client-bound message never contains a field only derivable from opponent ground truth
beyond what the belief-state entry set actually contains. This is the concrete verification
mechanism NFR-3100/NFR-8100 both call for.

## Dependencies

FS-103 (belief-state content — this Feature filters its output), and implicitly every other
Feature that produces client-bound data (FS-101, FS-102, FS-104, FS-105) — this Feature's test
suite must exercise all of their outputs, though it introduces no build-order dependency (it can
be implemented as soon as GDS-07's `OpponentView` type exists).

## Risks

Structural risk, not implementation risk (per the catalog's own framing): the mechanism itself is
simple, but every future change to any other Feature is a chance to violate it if a developer
bypasses `computeOpponentView` for convenience. Mitigated by the centrally-run test suite
(Verification Plan) rather than by code review alone — a test that would catch the violation is
worth more than a reviewer remembering to check.

## Open Questions

None — this Feature's scope and mechanism are fully specified by GDS-06/07/09 with no remaining
ambiguity.

## Related ADRs

None beyond ADR-0001.
