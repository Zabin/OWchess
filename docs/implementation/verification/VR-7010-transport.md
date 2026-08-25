# VR-7010 — Server-Authoritative WebSocket Transport

- **Owned by:** `09-package-verification` · **Date:** 2026-08-23

## Package

- **ID:** IP-7010 · **Title:** Server-Authoritative WebSocket Transport · **Source:** FS-107
- **Commit verified:** `2e319e2` ("feat(transport): implement IP-7010, server-authoritative
  WebSocket transport"). Dependencies IP-0010 (`VERIFIED`, VR-0010), IP-1010 (`VERIFIED`,
  VR-1010-v2), IP-6010 (`VERIFIED`, VR-6010) are all satisfied as of this session's start.
- **Independence:** this session performed no implementation work on IP-7010 or any of its
  dependencies. `2e319e2` predates this session. Tree actions this session took: read-only
  inspection; two throwaway diagnostic test files
  (`server/src/transport/__tests__/_vr7010_live_exercise.test.ts`,
  `_vr7010_probe2.test.ts`), each written, run with `npx vitest run`, and deleted before this
  report — never committed; and the ledger/report writes this skill is authorized to make.
  `git pull` at session start reported already up to date; `git status` was clean both before and
  after the diagnostic files were removed. No sibling-session files
  (`docs/implementation/verification/VR-4011-*.md`, `server/src/content/effects/`,
  `server/src/engine/EffectDefinitionRegistry.ts`) were read or touched. Independence is clean, no
  caveat needed.

## Result

**RETURNED** — 2 findings serious enough to fail the Definition of Done / Verification Checklist
as actually written (not merely non-blocking notes). IP-7010 stays `COMPLETE`.

## Definition of Done audit

| Item | Evidence | Pass/Fail |
|---|---|---|
| All 4 Implementation Tasks complete; two-independently-computed-views test is a named, passing regression test | `websocketServer.test.ts:58` ("an accepted action produces two independently-computed StateDeltaMessages") passes; `websocketServer.ts:32-50` (`broadcastStateDelta`) confirmed by reading to call `beliefState.computeOpponentView` once per player with that player's own `PlayerState` as `observerState`, building a fresh `StateDeltaMessage` object per recipient | **Fail** — Task 3's own claimed effect ("session ends with `outcome: 'cancelled'`") is not implemented; see Finding F2. Tasks 1, 2, 4 hold as literally coded, but Task 4's reconnect-to-nonexistent-session path is unguarded; see Finding F1. |
| No grace-period timer anywhere in the disconnect path | `grep -rn "setTimeout\|setInterval" server/src/transport/` re-run independently: zero matches | **Pass** |

## Verification Checklist audit

| Item | Evidence | Pass/Fail |
|---|---|---|
| G5 gate: build clean; full suite passes (79 total: 1 shared + 78 server) | `npm run build` clean (shared/server/client, tsc -b + vite build); `npm run test` → shared 1/1, server 78/78 (16 files, including `websocketServer.test.ts` ×4, `disconnectFlow.test.ts` ×5), client 15/15 — all re-run fresh this session | **Pass** (counts match the DoD's claim exactly) |
| FS-107 Acceptance Criteria mapped to passing tests | AC1 (latency)/AC3 (disconnect notify+choice)/AC4 (reconnect delivers full state) have direct passing tests. AC5 ("WebSocket disconnection is surfaced... never a silent freeze") is **not** satisfied for the W4 edge case the same spec names explicitly (reconnect to a nonexistent `sessionId`) — no test exercises it, and live-exercising it myself shows it fails; see Finding F1. AC2 (optimistic override) is explicitly the client's job per FS-107's own text ("that rendering treatment itself is FEAT-8000's job"), so not this package's obligation — correctly out of scope, not a gap. | **Fail** (AC5 partially unmet, uncaught by the suite) |
| NFR-1100's turn-latency budget soft-measured | `websocketServer.test.ts:86-91` asserts `elapsedMs < 3000` for a real in-memory action dispatch through `handleActionMessage` → `GameEngine.handleAction` → `broadcastStateDelta`; re-run, passes (sub-millisecond in practice) | **Pass**, with the same in-memory caveat the package itself discloses (no real network measured) |

## Requirements audit

| Requirement | Where implemented | Where tested | RTM cell | Pass/Fail |
|---|---|---|---|---|
| FR-7100 (WS push, no polling) | `websocketServer.ts` `broadcastStateDelta`/`broadcastToOne` push proactively on action-accept and on connect; no poll endpoint anywhere in `server/src` | `websocketServer.test.ts` (initial-push + post-action-push tests) | `FS-107 → IP-7010 → websocketServer.test.ts` — accurate | **Pass** |
| FR-7200 (server sole authority) | `handleActionMessage` routes every action through `GameEngine.handleAction`; no client-supplied state is ever written directly | `websocketServer.test.ts` two-independent-views case | `FS-107 → IP-7010 → websocketServer.test.ts (two-independent-views case)` — accurate | **Pass** |
| FR-7300 (disconnect/reconnect, no winner on cancel, distinct from resignation) | `handleDisconnect`/`handleDisconnectResponse` in `websocketServer.ts` | `disconnectFlow.test.ts` | `FS-101/FS-107 → IP-7010 → disconnectFlow.test.ts` — test itself is accurate for what it checks (`phase === 'ended'`, `winner` null), but the requirement's own text ("distinct from resignation") is only accidentally true (see F2) — the RTM cell is not wrong about what's tested, but the underlying claim it certifies is incomplete | **Fail** (see F2) |
| NFR-1100 (3s latency budget) | round-trip test in `websocketServer.ts`'s exercised path | `websocketServer.test.ts` round-trip test | accurate | **Pass** (with disclosed in-memory caveat) |
| NFR-7200 (graceful WS degradation, no silent failure) | `DisconnectNotification` push on close; **not** implemented for the reconnect-to-nonexistent-session path (silent no-op) | `disconnectFlow.test.ts` covers the close-path only; no test covers the nonexistent-session reconnect path | RTM: `IP-7010 (transport half)/IP-8010 (client half, pending)` | **Fail** for the transport half's own named edge case (F1) |

No RTM cells were edited — the trace targets named are all real and exist; the failures found are
in what the shipped code actually does, not in whether the RTM points at the right file.

## Test run

- `npm ci` (clean install) → `npm run build` (all three workspaces, `tsc -b` + `vite build`) →
  clean, no errors.
- `npm run test` (all three workspaces via `vitest run`):
  - `shared`: 1 file, 1 test, pass.
  - `server`: 16 files, 78 tests, pass (matches the package's own claimed count exactly; includes
    `websocketServer.test.ts` ×4 and `disconnectFlow.test.ts` ×5).
  - `client`: 4 files, 15 tests, pass.
- Total 94 tests across the repo, 79 in shared+server as the package's DoD specifically claims —
  confirmed exact.

## Scope audit

Diff for `2e319e2` stays entirely inside the package's declared file set:
`server/src/transport/websocketServer.ts`, `server/src/transport/connectionRegistry.ts`,
`server/src/transport/__tests__/websocketServer.test.ts`,
`server/src/transport/__tests__/disconnectFlow.test.ts`, plus the FS-107 metadata line and the
package's own status/Documentation Updates housekeeping. No excursion into `server/src/engine/`,
`shared/src/`, or any file the stage-08 content peer or a sibling package owns. `connectionRegistry.ts`
introduces no session/player-ID generation of its own — it only stores and looks up the
`SessionId`/`PlayerId` values it is handed by the caller (`websocketServer.ts`, ultimately from
`SessionStore`), so it neither reintroduces nor bypasses VR-1010's `BL-0023` fix.

## Live-exercise: security-critical claims (independent, hand-constructed — not a re-run of the
committed suite)

**1. `broadcastStateDelta` two-independently-derived-views claim.** Constructed a fresh session
(alice: `satcom`/`GEO-EQUATORIAL`; bob: `isr`/`LEO-POLAR` — deliberately distinct true regimes so
any leak would be unmistakable), wired two `FakeConnection`s, dispatched one real action through
`handleActionMessage`, and inspected the exact JSON strings each fake socket received:

- Each socket's `ownState.playerId` matched only that socket's own player.
- Alice's true regime string (`GEO-EQUATORIAL`) does not appear anywhere in Bob's message; Bob's
  true regime string (`LEO-POLAR`) does not appear anywhere in Alice's message.
- Bob's `opponentView` is not equal to Alice's `ownState` (and vice versa) — confirming it is
  Bob's own independently-computed belief view, not a reference to or copy of Alice's true state.
- The two `StateDeltaMessage` JSON strings sent to the two sockets are not the same object/string
  — genuinely separate computations, not one shared payload reused.
- Bob's own `ownState` JSON does not contain the substring `"alice"` anywhere.

All five checks held. Reading `BeliefState.computeOpponentView` (already `VERIFIED` under
VR-6010) confirms why: it returns only `{playerId: trueOpponentState.playerId, beliefEntries:
Array.from(observerState.beliefOfOpponent.values())}` — structurally incapable of embedding the
true opponent `PlayerState`. `broadcastStateDelta`'s per-player loop calls it once per player with
that player's own `observerState`, so the network-edge composition genuinely reuses IP-6010's
already-proven filter rather than re-deriving or bypassing it. **This claim holds — no leak
found.**

**2. Disconnect notify/choice flow (FS-107 §W7).** Live-exercised beyond the committed suite:
confirmed `grep` shows zero timer primitives in `server/src/transport/`; confirmed
`handleDisconnect` sends exactly one `DisconnectNotification` to the still-connected player and
takes no other action; confirmed `'wait'` leaves `phase` at `'active'` with no other side effect;
confirmed `'cancel'` sets `phase` to `'ended'`. **However**, constructing the adjacent case the
spec itself calls out — cancelling a session whose `turnNumber` has already passed the 60-turn
timeout cap — shows `GameEngine.checkWinConditions` reports
`{ winner: null, reason: 'timeout-tiebreak' }` for that cancelled session, because
`checkWinConditions` has no concept of a cancellation at all and falls through to its
timeout/tiebreak branch. This is Finding F2, live-reproduced, not merely inferred from reading.

**3. `SessionStore` session-ID generation.** Confirmed unchanged from VR-1010-v2's fix:
`generateSessionId()` (`server/src/engine/SessionStore.ts:65`) still reads
`` `session-${randomBytes(16).toString('base64url')}` `` — 128 bits of `crypto.randomBytes`
entropy, not a sequential counter. `connectionRegistry.ts` never generates or derives an ID of its
own; it only indexes by the `SessionId`/`PlayerId` values `websocketServer.ts` passes through from
`SessionStore`/`GameEngine`. No reintroduction, no bypass, at the transport layer.

## Findings

| # | Description | Severity | Recommended owner |
|---|---|---|---|
| F1 | `handleConnection`'s reconnect path silently drops the connection when the presented `sessionId` no longer exists: `broadcastToOne` returns early (`if (!session) return;`) with **no message sent at all** to that socket. This is the exact edge case FS-107's own System Behaviour table (W4) and NFR-7200 name explicitly: "Reconnect with a sessionId that no longer exists ... rejected with a clear 'session no longer exists' response, not a silent hang." Live-reproduced: connecting a fresh `FakeConnection` with a made-up `sessionId` yields zero sent messages. No test in `websocketServer.test.ts`/`disconnectFlow.test.ts` exercises this path — the Verification Checklist's "FS-107 Acceptance Criteria mapped to passing tests" claim is inaccurate for AC5 in this specific, spec-named scenario. | **High** | `08-code-implementation` (add an explicit rejection message in `handleConnection`/`broadcastToOne` when the session is missing) |
| F2 | FS-101 §W7 requires that a cancelled session get "a distinct outcome value (e.g. `'cancelled'`) from `'resigned'`/`'destroyed'`/`'denied'`/`'timeout'`, so the event log and any future stats correctly distinguish 'the game was called off' from an actual win/loss." `SessionState` (`shared/src/types.ts`) has no `outcome`/`winner`-persisted field at all — only `phase: 'deploying'\|'active'\|'ended'`. `handleDisconnectResponse`'s `'cancel'` branch only sets `session.phase = 'ended'`; it records no distinguishing value anywhere. IP-7010's own Definition of Done/Implementation Tasks literally claim "`'cancel'` → session ends with `outcome: 'cancelled'`" — that value does not exist anywhere in the shipped code or schema. Live-reproduced a concrete consequence: cancelling a session whose `turnNumber` already exceeds the 60-turn timeout cap causes `GameEngine.checkWinConditions` to report `{winner: null, reason: 'timeout-tiebreak'}` for that cancelled session — an actively mislabeled outcome, not merely an absent one. The committed `disconnectFlow.test.ts` only asserts `phase === 'ended'` and `winner == null`, which is too weak to catch either the missing-field gap or the mislabeling case (its fixture never advances `turnNumber` past 60). | **High** | `07-implementation-planning` (the `outcome`/`SessionState` schema gap is upstream of this package — GDS-07/IP-1010's shape has no field for it) with `08-code-implementation` for IP-7010's own wiring once the field exists |

Both findings are hand-verified against the live tree (not inferred from the package's own prose),
and both concern named, load-bearing acceptance criteria (FS-107 AC5 / FS-101 §W7's own explicit
distinct-outcome requirement) rather than cosmetic gaps — hence `RETURNED` rather than `VERIFIED`
with non-blocking notes.

## Independence caveat

None — this session did no implementation work this session on IP-7010 or its dependencies.
