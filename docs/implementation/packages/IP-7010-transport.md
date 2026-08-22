# IP-7010 — Server-Authoritative WebSocket Transport

- **Package ID:** IP-7010 · **Status:** BLOCKED (on IP-0010, IP-1010, IP-6010) · **Owning
  stage-08 peer:** `08-code-implementation`
- **Source:** FS-107 (`docs/features/FS-107-server-authoritative-transport.md`), FEAT-7000
- **Authorization (G3):** Covered by the release plan.

## Objective

Implement the WebSocket push transport: `ActionMessage` ingestion, `StateDeltaMessage` push
(routed through IP-6010's `computeOpponentView`, never a raw `PlayerState`), server-always-wins
override of client-side optimistic prediction, and the disconnect notify/choice/reconnect sequence
(FS-101 §W7's policy: no grace period, notify-and-choose).

## Requirements Covered

FR-7100, FR-7200, FR-7300, NFR-1100, NFR-7200.

## Architecture Components

New transport layer (`server/src/transport/`), sitting between the WebSocket connection and
`GameEngine.handleAction`.

## Interfaces

Consumes `GameEngine.handleAction` (IP-1010) and `BeliefState.computeOpponentView` (IP-6010) to
build each recipient's `StateDeltaMessage`. Implements the `ActionMessage`/`StateDeltaMessage`/
`RejectedActionMessage`/`DisconnectNotification`/`DisconnectResponse` wire handling (GDS-09,
`shared/src/messages.ts` from IP-0010) — no new message types.

## Files to Create

- `server/src/transport/websocketServer.ts`, `server/src/transport/connectionRegistry.ts` (maps
  `PlayerId` ↔ live socket, tracks disconnect state), `server/src/transport/__tests__/
  websocketServer.test.ts`, `server/src/transport/__tests__/disconnectFlow.test.ts`

## Implementation Tasks

1. On `ActionMessage` receipt: call `GameEngine.handleAction`; on accept, build and push a
   per-recipient `StateDeltaMessage` to **both** connected clients — the acting player's own
   `PlayerState` plus their `computeOpponentView` (IP-6010) output; the opponent's own `PlayerState`
   plus *their* `computeOpponentView` output (two different, independently-computed views, never
   the same object reused). On reject, push a `RejectedActionMessage` to the acting player only.
2. Disconnect detection (socket close/error): send the still-connected player a
   `DisconnectNotification`; hold the session open indefinitely (no timer, no grace period, per
   FS-101 §W7) awaiting their `DisconnectResponse`.
3. `DisconnectResponse: 'wait'` → session stays open, waiting for the disconnected player to
   reconnect; `'cancel'` → session ends with `outcome: 'cancelled'`, no winner recorded (matching
   FR-7300 exactly).
4. Reconnect: on a new connection presenting a valid `SessionId`/`PlayerId`, re-associate the
   socket in `connectionRegistry` and push a full current `StateDeltaMessage` (the same shape W1's
   initial render already knows how to consume, per FS-108 §W1's stated contract — no special
   "resume" message type).

## Tests to Add

`websocketServer.test.ts`: an accepted action produces two independently-computed
`StateDeltaMessage`s (opponent-view content differs per recipient, asserted directly — this is the
test that would catch a fog-of-war leak at the transport layer specifically, distinct from
IP-6010's own unit tests); a rejected action produces exactly one `RejectedActionMessage`, to the
acting player only.
`disconnectFlow.test.ts`: disconnect triggers `DisconnectNotification`; `'wait'` keeps the session
open with no timeout firing; `'cancel'` ends the session with `outcome: 'cancelled'` and no winner;
reconnect re-associates and delivers a full state-delta.

## Documentation Updates

FS-107 metadata: `**Implemented by:** IP-7010`.

## Definition of Done

- [ ] All 4 Implementation Tasks complete; the two-independently-computed-views test is a named,
      passing regression test (this package's own strongest fog-of-war-adjacent guarantee).
- [ ] No grace-period timer exists anywhere in the disconnect path (Inspection — a literal search
      for any `setTimeout`/timer construct in `transport/` tied to disconnect handling should find
      none, per FR-7300's explicit "no grace period or automatic forfeit/auto-pass/timeout of any
      kind").

## Verification Checklist

- [ ] **G5 gate:** build clean. **G5 gate:** full test suite passes.
- [ ] FS-107 Acceptance Criteria mapped to passing tests.
- [ ] NFR-1100's turn-latency budget (3s) measured for at least one action round-trip in the test
      suite (even as a soft assertion, per BL-0006's own noted lack of a real measurement harness
      — this package is the first real chance to start grounding that NFR empirically).

## Dependencies

IP-0010, IP-1010, IP-6010 (all `VERIFIED`).

## Risks

Medium — the disconnect/reconnect sequence is the one genuinely stateful, timing-sensitive piece;
the "no grace period" policy (owner-decided, BL-0010) actually *simplifies* this relative to a
timer-based design, which is a real risk reduction worth noting, not just a design constraint.

## Rollback Considerations

No persisted state across restarts in v1 — a live session is lost on server restart (acceptable
for MVP scope; not flagged as a defect unless the owner says otherwise).
