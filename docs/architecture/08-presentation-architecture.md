# GDS-08 — Presentation Architecture

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-09

Board/UI composition, grounded directly in the ZabOW `ORBITAL COMMAND` reference confirmed at the
`01-vision` gate (MSTR-001 §4) — this level is not starting from a blank placeholder. Also resolves
BL-0004 (the NFR-4002-vs-server-authority tension flagged at GDS-06).

## Panel composition (from SOR §9.2, mapped onto the real ZabOW reference)

| Panel | Purpose | ZabOW precedent |
|---|---|---|
| Orbital board | Primary view: radial regime rendering (R-203's 9-value taxonomy — altitude bands as concentric rings, plane-class as angular/visual grouping), own assets at full fidelity, opponent assets only at earned belief-state precision | Concentric dashed LEO/MEO/GEO rings around a central planet, diamond asset markers |
| Action menu | Every currently-legal action (SOR §7.10) — no dead/disabled-without-reason entries | Bottom action-button row (SCAN/MOVE/ENGAGE/JAM-equivalent) |
| Asset tray | Deployable assets with cost/time-to-online shown before commit | (New — no direct ZabOW precedent; ZabOW's single-player campaign has no deploy-before-commit economy) |
| Mission/King status | Own King's mission set, effect-state, AP economy | Top-left/top-right corner status panels (threat counters, friendly/threat ratio) |
| Intel panel | Everything earned about the opponent, with staleness indicated | Bottom-left selected-asset detail panel, adapted to show belief-state precision + staleness rather than full true state |
| Event log | Human-readable resolved-action/effect log | (New — ZabOW has no persistent log; this project's SOR §8.3 event log needs its own panel) |

Palette and type: dark near-black background (`#000814`-class), glowing cyan/blue for friendly
assets and UI chrome, warm red/orange reserved for hostile/uncertain contacts and alert states,
monospace/uppercase labels — adopted directly from ZabOW's `styles.css` (MSTR-001 §4), not
re-derived.

## Turn-change notification UX

On receiving a state-delta (GDS-02's push channel) that flips `activeTurn` to this client's
player, the UI must make the turn-change unmissable but non-disruptive to a player mid-thought —
a persistent, distinct-from-alert visual state change (e.g. the action menu's own enable/disable
state, not a modal interrupt) rather than a dialog the player must dismiss. Optimistic UI (GDS-02,
FR-6002) for the acting player's own pending action shows immediately but is visually distinct
from server-confirmed state until the confirming delta arrives, so a rejected/overridden action is
never confused with a resolved one.

## Fog-of-war rendering — no leakage by construction

Following GDS-07's `OpponentView` type (structurally distinct from `PlayerState`): the client
component that renders opponent assets is only ever given `OpponentView`/`BeliefStateEntry[]`
data — it has no code path that could accept a `PlayerState`-shaped object, so a fog-of-war leak
would have to be a type error at the client/server boundary, not merely a missed UI check. Unknown
contacts render with the ZabOW reference's own dim/orange "RECON"-style marker convention; known-
but-imprecise contacts show their current `precision` level and staleness visibly (SOR §7.7,
FR-3006) rather than as a uniform "known" state.

## Resolving BL-0004 — NFR-4002 vs. server authority

**Decision:** the client holds a **bounded, read-only copy of the legality *rules*** (which action
types require which precision/AP/regime preconditions — a pure function of already-known public
data: the roster's cost/time-to-online, the F2T2E precision-gating rules, current AP) generated
from the same shared-types package ADR-0001 establishes, and uses it to pre-filter the action menu
**before** submission — never to decide an action's actual outcome, and never fed anything the
server hasn't already sent (own true state, own AP, the current `OpponentView`). This satisfies
NFR-4002 (nothing shown as available that the server would then reject) without requiring the
client to hold any hidden information, and without weakening server authority: the server still
independently validates every submitted action and is free to reject one if the client's copy of
the rules is ever stale (e.g. a race where the opponent's action changed legality between the
client's last state-delta and the player's click) — that rejection path still exists as a safety
net, it's just expected to be rare rather than the primary mechanism.

## Merge gate

- [x] Every SOR §9.2 panel has a stated composition, cross-linked to its ZabOW precedent where one
      exists and marked "new" where none does.
- [x] Palette/type convention adopted from the real ZabOW reference, not re-invented.
- [x] BL-0004 resolved with a concrete mechanism (bounded client-side legality-rule duplication
      via the shared-types package), not silently dropped.
- [x] Fog-of-war rendering shown to follow from GDS-07's type distinction, not a separate UI-layer
      promise.
- [x] No numeric tuning value invented; no literal component/file names beyond what's needed
      (GDS-09's job).

**Merge decision:** GDS-04/07 remain authoritative for entity/data shape; this document is
authoritative for how they're rendered and interacted with, feeding GDS-09's client-side interface
surface.

**Gate:** closed 2026-08-21. BL-0004 → `DONE` (resolved above). No new Open Questions. Next:
GDS-09 (Interface Specification).
