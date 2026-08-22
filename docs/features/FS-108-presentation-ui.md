# FS-108 — Presentation / UI

- **Feature ID:** FS-108 (from **FEAT-8000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 · **Owned by:** `06-feature-specification` · **Epic:** EP-3000 (Player Experience)
- **Implemented by:** [IP-8010](../implementation/packages/IP-8010-presentation-ui.md)

## Purpose

Render every other Feature's state legibly, with no dead menu entries and no fog-of-war leakage
in the render layer itself — carried forward verbatim from FEAT-8000's Purpose.

## Scope

Rendering and input submission only, per GDS-08's six-panel layout (orbital board, action menu,
asset tray, mission/King status, intel panel, event log), grounded in the confirmed ZabOW visual
reference (MSTR-001 §4). Never computes game truth or belief-state itself — that would violate
FEAT-6000. Excludes what any panel's underlying data *means* (every other Feature owns its own
content); this Feature owns only how it's shown and how input is submitted.

## Requirements Implemented

FR-8100, FR-8200, FR-8300, FR-8400, FR-8500, NFR-4100, NFR-4200, NFR-7100.

## User Workflows

**W1 — Initial render on session start**
1. Once `phase: 'active'` (FS-101), the client renders all six panels per GDS-08's composition
   table, populated from the client's own `PlayerState` and initial `OpponentView`.

**W2 — Turn-change and action-menu update**
1. On receiving a `StateDeltaMessage` (FS-107) that changes `activeTurn`, the action menu's
   enabled/disabled state updates immediately (GDS-08's "persistent, non-modal" turn-change UX).
2. The action menu is **pre-filtered client-side** using the bounded, read-only legality-rule copy
   GDS-08 specifies (resolving BL-0004) — only currently-legal actions are enabled, each with the
   AP/precision/online-state precondition it needs, generated from the same shared-types package
   as the server (ADR-0001).

**W3 — Render contacts by fog-of-war status**
1. The orbital board renders the player's own assets at full fidelity, and the opponent's assets
   only via the current `OpponentView`/`BeliefStateEntry` set (FEAT-2000's output, filtered by
   FEAT-6000) — visually distinguished per GDS-08's palette convention (own/known/unknown).

**W4 — Deploy asset tray**
1. The asset tray lists every template (FS-102) the player can currently afford, showing its AP
   cost and time-to-online before the player commits.

**W5 — Event log**
1. Each resolved action's `EventRecord` (carried in `StateDeltaMessage`, per GDS-09) appends a
   human-readable entry to the event log panel, in order.

## System Behaviour

| Workflow step | Normal path | Edge case(s) |
|---|---|---|
| W1 | All six panels render correctly populated. | Reconnect mid-session (FS-107 §W4): same initial-render logic runs against the caught-up state, not a special "resume" render path — this spec treats reconnect as producing the same input (a full current `StateDeltaMessage`) that W1 already knows how to render. |
| W2 | Menu accurately reflects server-computed legality. | The rare race GDS-08 already names (opponent action changes legality between the client's last delta and the player's click): the client-side pre-filter can be briefly stale; the server's own validation is the safety net (NFR-4200's one permitted exception) — this spec's contract is that the *client* pre-filter matches the *last-known* server state exactly, not that it's never stale relative to a change in flight. |
| W3 | Own/known/unknown markers render distinctly. | A belief-state entry expires entirely (FS-103 §W3's `'find'`-removal case): the contact simply disappears from the board — no special "fading out" animation is required by any requirement, though `07`/`08` may choose one as a presentation nicety not gated by this spec. |
| W4 | Tray shows affordable and unaffordable templates, cost/time visible for all. | A template the player cannot currently afford (insufficient AP): shown but disabled with a stated reason (AP-legality discipline, same as W2's action menu), not hidden — consistent with FR-1320's "no dead menu entries, disabled-with-reason" rule extended to the tray. |
| W5 | Entries append in order, human-readable. | A very long game (approaching the 60-turn cap): no requirement caps event-log length or requires pruning/scrolling virtualization — left as an implementation detail for `07`/`08`, not a behavioral gap this spec needs to resolve. |

## Module Responsibilities

Client UI — owns all rendering and input-submission for W1–W5. Holds the bounded legality-rule
copy (W2) as read-only, generated data — it does not independently decide game truth, per GDS-02's
client-architecture constraint.

## Interfaces Used

`StateDeltaMessage` (own state + `opponentView`, GDS-09) — the client's sole source of truth for
everything it renders. `ActionMessage` — how it submits player input. No new interface.

## Data Model Changes

None — this Feature only renders GDS-07's existing types (`PlayerState`, `OpponentView`,
`EventRecord`), it introduces no new entity.

## State Changes

Client-local UI state only (which panel is focused, optimistic-pending visual flags per FS-107
§W2) — not `SessionState`/`PlayerState`, which this Feature never mutates directly (all mutation
happens server-side, per NFR-6100, consumed here only as already-resolved state).

## Error Handling

- **WebSocket disconnect** (FS-107 §W3): the client shows a clear connectivity-lost state
  (NFR-7200) — not merely freezing; the specific "notify and offer wait/cancel" UI for the *other*
  player's disconnect (FS-107's `DisconnectNotification`) is this Feature's rendering
  responsibility for that message.
- **Action rejected** (`RejectedActionMessage`): shown with the reason, distinguishing a
  server-side rejection from a client-side pre-filtered "not shown as available" case (the two
  should read differently to the player, since one is an unexpected race and the other never
  happened at all).

## Performance Considerations

None beyond NFR-1100 (already FS-107's obligation to deliver within) — this Feature's own render
cost (updating six panels from an already-received message) is a standard UI-responsiveness
concern, not separately budgeted by any NFR.

## Integrity Considerations

This Feature is the client-side enforcement point for FEAT-6000's guarantee actually being
*visible* correctly: it must render only from `OpponentView`, never attempt to reconstruct or
infer opponent ground truth locally (GDS-02's client-architecture constraint, restated here as
this Feature's own obligation not to violate it). NFR-4200's exception (the rare race) is the only
permitted gap between "shown as legal" and "server accepts" — anything wider would be a defect in
this Feature specifically.

## Acceptance Criteria

1. All six panels render per GDS-08's composition on session start and on reconnect.
2. The action menu shows only currently-legal actions (per the client-side pre-filter), matching
   the server's own legality computation as of the last received state.
3. Own assets, known-opponent assets, and unknown contacts are visually distinguished per GDS-08's
   palette convention.
4. Every deployable template shows cost/time-to-online before commit; unaffordable templates are
   shown disabled with a reason, not hidden.
5. Resolved actions/effects append to the event log in order, human-readably.

## Verification Plan

**Demonstration** (primary — per the Requirements Review's own RF-04 finding, this is the
justification that finding asked for): visual/UX correctness (panel composition, palette
adherence, marker legibility) is fundamentally a human-judgment verification for this first pass,
since no component/snapshot-testing harness exists yet and the ZabOW reference this Feature
follows is itself a visual, not behavioral, specification. **Test** applies specifically to the
action-menu pre-filter's *logical* correctness (does it match server legality — a pure function,
testable independent of rendering) and to the fog-of-war rendering boundary (does the component
ever accept a `PlayerState`-shaped prop — a type-level/unit-testable property). This resolves
BL-0008: the split between Demonstration (visual) and Test (logical/type-level) is the missing
justification that finding asked for.

## Dependencies

Every other Feature (FS-101 through FS-107) — this is the pure presentation layer over all of
their already-defined data shapes.

## Risks

Low-Medium (per the catalog) — mostly implementation volume (six panels, many states), not open
design uncertainty, substantially de-risked by the confirmed ZabOW reference.

## Open Questions

None new — BL-0008 (verification-method justification) is resolved above; no other Feature left
an open question whose resolution depends on this Feature specifically.

## Related ADRs

ADR-0001 (React client).
