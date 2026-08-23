# IP-7010 — Server-Authoritative WebSocket Transport

- **Package ID:** IP-7010 · **Status:** COMPLETE, RETURNED 2026-08-23 for remediation (see
  `Remediation (VR-7010)` below) — not yet re-submitted · **Owning stage-08 peer:**
  `08-code-implementation`
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

## Remediation (VR-7010, 2026-08-23)

`docs/implementation/verification/VR-7010-transport.md` returned this package with 2 High
findings, both live-reproduced against the shipped tree, not merely inferred from reading. This
section plans their fix — `08-code-implementation` executes it, then re-submits for a fresh
`09-package-verification` pass.

**F1 (BL-0044) — silent drop on reconnect to a nonexistent session.** `handleConnection`'s
reconnect path currently returns early with no message sent at all when the presented `sessionId`
doesn't exist in `SessionStore`, instead of the "clear session-no-longer-exists response" FS-107's
own W4 edge case and NFR-7200 name explicitly.

- **Files to Modify:** `server/src/transport/websocketServer.ts` (`handleConnection`).
- **Task:** when a reconnect attempt's `sessionId` doesn't resolve to a live session, send that
  socket a `RejectedActionMessage`-shaped response (reusing the existing rejection message type —
  no new wire message needed, since this isn't an in-session action rejection but the same "tell
  the client clearly, don't just drop it" contract) with a reason string identifying the session as
  no longer existing, then close or leave the connection registry untouched for that socket (no
  session to associate it with). Do not introduce a new message type unless
  `RejectedActionMessage`'s shape genuinely cannot carry this (check `shared/src/messages.ts`
  first — it's a general-purpose one-way rejection, this should fit).
- **Test to add:** `websocketServer.test.ts` — a connection presenting a `sessionId` with no
  matching session receives exactly one rejection-shaped message and is not silently dropped;
  distinguish this from the legitimate first-connection (`phase: 'deploying'`, no existing session
  expected) case, which must not be affected.

**F2 (BL-0045) — no field distinguishes a cancelled session's outcome.** `SessionState`
(`shared/src/types.ts`, GDS-07) has `phase: SessionPhase` (`'deploying' | 'active' | 'ended'`) but
nothing else — no `outcome`/cancellation marker at all, despite this package's own Task 3 and
Definition of Done literally claiming `'cancel'` produces `outcome: 'cancelled'`. VR-7010
live-reproduced the consequence: cancelling a session whose `turnNumber` has already passed the
60-turn timeout cap causes `GameEngine.checkWinConditions` (`shared/src/interfaces.ts`,
`WinResult`/`WinReason`; `server/src/engine/GameEngine.ts`) to fall through to its
timeout/tiebreak branch and report `{winner: null, reason: 'timeout-tiebreak'}` — an actively
mislabeled outcome, not merely an absent field.

- **Files to Modify:**
  - `shared/src/types.ts` — add `cancelled?: boolean` to `SessionState` (additive, optional,
    non-breaking for any existing consumer that doesn't set it). This is a small, targeted field
    addition in the same spirit as BL-0021's `totalDenialTurns`/`destroyed` additions to `Asset` —
    `03-architecture-design-synthesis`/GDS-07 should formally adopt it in GDS-07's own next touch,
    same as BL-0021/28/33/36's disclosed-deviation pattern; it is not blocking for this fix.
  - `shared/src/interfaces.ts` — add `'cancelled'` to the `WinReason` union
    (`'destruction' | 'denial' | 'resignation' | 'timeout-tiebreak' | 'cancelled'`), so
    `checkWinConditions` can return `{winner: null, reason: 'cancelled'}` using the existing
    `WinResult` shape rather than inventing a parallel return type.
  - `server/src/transport/websocketServer.ts` (`handleDisconnectResponse`'s `'cancel'` branch) —
    set `session.cancelled = true` alongside `session.phase = 'ended'`.
  - `server/src/engine/GameEngine.ts` (`checkWinConditions`) — check `session.cancelled` **first**,
    before the existing resignation check (a cancelled session should never be re-derived as a
    resignation, destruction, denial, or timeout win/loss — cancellation is terminal and
    unconditional, matching FS-101 §W7's "no winner recorded" policy exactly): if
    `session.cancelled`, return `{ winner: null, reason: 'cancelled' }` immediately.
- **Test to add:** `disconnectFlow.test.ts` — reproduce VR-7010's exact hand-constructed scenario:
  a session with `turnNumber` already past the 60-turn cap, then cancelled via
  `DisconnectResponse: 'cancel'`; assert `checkWinConditions` returns
  `{ winner: null, reason: 'cancelled' }`, not `'timeout-tiebreak'`. Keep the existing
  `phase === 'ended'`/`winner == null` assertions too — they're correct, just insufficiently
  specific on their own (that's exactly what let this gap ship unnoticed).

**Definition of Done additions:**
- [ ] F1 fixed: reconnect to a nonexistent `sessionId` sends an explicit rejection, never a silent
      drop; regression test passes.
- [ ] F2 fixed: `SessionState.cancelled` exists, is set on cancel, and `checkWinConditions` returns
      `{ winner: null, reason: 'cancelled' }` for a cancelled session — including the past-timeout-
      cap case VR-7010 hand-reproduced; regression test passes.
- [ ] Full G5 gate (build + full suite) re-run green after both fixes.

**Verification Checklist addition:** re-submit to `09-package-verification` for a fresh,
independent pass once both fixes land — the previous `VERIFIED`-track claims for Tasks 1/2/4 and
the two-independently-computed-views test are unaffected by this remediation and don't need
re-proving, but the whole package still needs a fresh VR per this project's standing methodology
(no package is marked `VERIFIED` on a partial re-check).

## Dependencies

IP-0010, IP-1010, IP-6010 (all `VERIFIED`).

## Risks

Medium — the disconnect/reconnect sequence is the one genuinely stateful, timing-sensitive piece;
the "no grace period" policy (owner-decided, BL-0010) actually *simplifies* this relative to a
timer-based design, which is a real risk reduction worth noting, not just a design constraint.

## Rollback Considerations

No persisted state across restarts in v1 — a live session is lost on server restart (acceptable
for MVP scope; not flagged as a defect unless the owner says otherwise).
