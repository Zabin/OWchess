# FS-107 — Server-Authoritative Transport

- **Feature ID:** FS-107 (from **FEAT-7000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 · **Owned by:** `06-feature-specification` · **Epic:** EP-2000 (Trust Boundary & Transport)

## Purpose

Push turn-change and resolved-action state to both clients reliably, with the server always the
final authority — carried forward verbatim from FEAT-7000's Purpose.

## Scope

Getting state from server to client and back, reliably: WebSocket push (no polling), server
overriding any client-side optimistic prediction, and disconnect/reconnect handling per FS-101
§W7's owner-decided policy (notify-and-choose, no grace period). Excludes what the state
*contains* (every other Feature) — this is pure transport/session-continuity.

## Requirements Implemented

FR-7100, FR-7200, FR-7300, NFR-1100, NFR-7200.

## User Workflows

**W1 — Push a resolved action's state-delta**
1. Any Feature's action resolves (FS-101–105).
2. The server constructs a `StateDeltaMessage` per client (own state direct, opponent view via
   FS-106's `computeOpponentView`) and pushes it over each client's open WebSocket connection —
   no client polls or requests it.

**W2 — Optimistic client action (own actions only)**
1. A client may render its own submitted action as "pending" immediately, before the server's
   `StateDeltaMessage` confirming it arrives.
2. When the confirming (or rejecting) message arrives, the client's rendered state is overwritten
   to match — the server's resolution always wins, per FR-7200.

**W3 — Disconnect notification** *(specifies FS-101 §W7's transport mechanism)*
1. The server detects one player's WebSocket connection closing while `phase: 'active'`.
2. A new message type, `DisconnectNotification` (not one of GDS-09's original three — this
   spec adds it, consistent with GDS-09's own note that a needed-but-missing interface is
   recorded here rather than invented silently upstream), is pushed to the still-connected
   client, prompting the wait/cancel choice FS-101 §W7 specifies.
3. The connected client's response (`{choice: 'wait' | 'cancel'}`) is sent back over the same
   connection; the server acts per FS-101 §W7 (no action on 'wait'; ends the session on 'cancel').

**W4 — Reconnect**
1. A disconnected player's client reconnects using the same `sessionId`.
2. The server sends a full current-state `StateDeltaMessage` (own state + opponent view) so the
   reconnecting client is caught up, and normal play resumes.

## System Behaviour

| Workflow step | Normal path | Edge case(s) |
|---|---|---|
| W1 | Both clients receive the delta within the latency budget. | Message delivery genuinely fails (network partition, not just slow): this spec treats it the same as a disconnect (W3) — the server doesn't distinguish "slow" from "gone" beyond the WebSocket connection's own close event. |
| W2 | Optimistic render matches server confirmation, no visible correction. | Server rejects or resolves differently than the client's optimistic guess: client's rendered state is corrected to match — visibly distinct from a confirmed action per FS-101/GDS-08's own optimistic-vs-confirmed rendering distinction (that rendering treatment itself is FEAT-8000's job, not this Feature's). |
| W3 | Connected player is notified, responds, server acts accordingly. | The connected player never responds (e.g. they also become unreachable, or simply don't answer): per FS-101 §W7's own edge case, the session just remains `'active'` and stalled — no timeout on the *choice* itself, consistent with the no-timeout policy applying throughout. |
| W4 | Reconnecting client is caught up and can resume acting on its next legal turn. | Reconnect with a `sessionId` that no longer exists (session already ended via W3's cancel path, or naturally): rejected with a clear "session no longer exists" response, not a silent hang. |

## Module Responsibilities

WS transport layer — owns the actual push/receive mechanics (all of W1–W4's message delivery).
`GameEngine` — decides *when* a push is needed (after any action resolves) and *what* the
disconnect/reconnect response should be (per FS-101 §W7's policy); the transport layer carries
messages, it doesn't decide game-state consequences.

## Interfaces Used

- `StateDeltaMessage`, `ActionMessage`, `RejectedActionMessage` (GDS-09, existing).
- **`DisconnectNotification`** (new, this spec) — `{type: 'disconnect-notification'}` pushed to
  the connected client; response `{type: 'disconnect-response', choice: 'wait' | 'cancel'}`. This
  is the one new interface FS-101's own Risks section flagged as needed and left for this Feature
  to add — done here, not silently invented at FS-101's own layer.

## Data Model Changes

None new beyond `SessionState.phase`'s `'cancelled'` outcome value (already introduced by FS-101,
not by this spec) — this Feature is pure message transport over existing GDS-07 state.

## State Changes

None owned by this Feature directly — `phase` transitions on the `'cancelled'` path are FS-101's
own state machine (§W7); this Feature only carries the messages that inform and act on it.

## Error Handling

- **Message delivery failure indistinguishable from disconnect** (W1 edge case): treated
  identically — see System Behaviour.
- **Reconnect to a nonexistent session** (W4 edge case): rejected with a clear response, not a
  silent hang, consistent with NFR-7200's "clear error state, not silent failure" requirement.

## Performance Considerations

NFR-1100 (3-second turn-notification latency budget) is this Feature's direct obligation for W1 —
the primary performance-bearing workflow in the entire Feature catalog. NFR-7200 (graceful
degradation) governs W1's failure mode and W3's detection.

## Integrity Considerations

This Feature carries FS-106's already-filtered `opponentView` — it must never itself construct or
modify that field's contents (a transport-layer bug that mutated or bypassed the filtered payload
would be exactly the kind of leak FS-106 exists to prevent). FR-7200 (server sole authority) is
this Feature's own core integrity property: W2's optimistic-render override is the concrete
mechanism by which "client prediction is never authoritative" is enforced, not merely stated.

## Acceptance Criteria

1. Every resolved action's `StateDeltaMessage` reaches both clients within 3 seconds under normal
   broadband conditions (NFR-1100), without either client polling.
2. A client's optimistic render of its own pending action is always overwritten by the server's
   actual resolution when it differs.
3. On disconnect, the connected client receives a `DisconnectNotification` and can respond with
   `'wait'` (no further action) or `'cancel'` (session ends, per FS-101 §W7).
4. A reconnecting client receives full current state and can resume acting on its next legal turn.
5. WebSocket disconnection is surfaced to the affected client as a clear state, never a silent
   freeze.

## Verification Plan

Test — latency-budget measurement (once a harness exists), optimistic-override behavior, the
full disconnect/notify/choice/cancel-or-wait/reconnect sequence end to end.

## Dependencies

FS-101 (the disconnect/reconnect *policy* this Feature transports), FS-106 (the `opponentView`
payload this Feature carries unmodified).

## Risks

Low-Medium (per the catalog's own rating) — WebSocket reconnection semantics are a known, bounded
problem space; the one design element genuinely new here (the `DisconnectNotification` exchange)
is small and fully specified by this pass, not left ambiguous.

## Open Questions

None — FS-101 §W7 already resolved the policy this Feature needed to transport; this spec's own
addition (the `DisconnectNotification` message shape) is fully specified, not left open.

## Related ADRs

ADR-0001 (WebSocket transport choice).
