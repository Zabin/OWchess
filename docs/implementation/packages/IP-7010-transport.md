# IP-7010 — Server-Authoritative WebSocket Transport

- **Package ID:** IP-7010 · **Status:** COMPLETE (2026-08-22) · **Owning
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

- [x] All 4 Implementation Tasks complete; the two-independently-computed-views test
      (`websocketServer.test.ts`) is a named, passing regression test.
- [x] No grace-period timer exists anywhere in the disconnect path — `grep -rn "setTimeout\|
      setInterval" server/src/transport/` finds none.

## Verification Checklist

- [x] **G5 gate:** build clean. **G5 gate:** full test suite passes (79 total: 1 shared + 78
      server, incl. this package's 9: `websocketServer.test.ts` ×4, `disconnectFlow.test.ts` ×5).
- [x] FS-107 Acceptance Criteria mapped to passing tests.
- [x] NFR-1100's turn-latency budget (3s) soft-measured: `websocketServer.test.ts`'s round-trip
      test asserts `elapsedMs < 3000` for a real action dispatch — a genuine (if in-memory, no
      real network) first data point, per BL-0006's own noted lack of a measurement harness.

## Deviation note

Game logic is decoupled from the actual `ws` library via a `Connection` interface
(`connectionRegistry.ts`) — `send`/`onMessage`/`onClose` — so it's unit-testable with a fake
connection rather than a real socket. `server/src/index.ts` remains a scaffold placeholder; no
package yet bootstraps a real `WebSocketServer` wrapping actual sockets into `Connection` and
calling `createTransport`/`handleConnection`. This is the same "no production bootstrap yet"
pattern already disclosed for deploy/belief/maneuver/effect ticking (BL-0022/0030) — filed as
BL-0038, the last remaining piece before the server can actually run end-to-end.

## Dependencies

IP-0010, IP-1010, IP-6010 (all `VERIFIED`).

## Risks

Medium — the disconnect/reconnect sequence is the one genuinely stateful, timing-sensitive piece;
the "no grace period" policy (owner-decided, BL-0010) actually *simplifies* this relative to a
timer-based design, which is a real risk reduction worth noting, not just a design constraint.

## Rollback Considerations

No persisted state across restarts in v1 — a live session is lost on server restart (acceptable
for MVP scope; not flagged as a defect unless the owner says otherwise).
