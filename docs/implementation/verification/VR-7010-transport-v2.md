# VR-7010-v2 — Server-Authoritative WebSocket Transport (re-verification)

- **Owned by:** `09-package-verification` · **Date:** 2026-08-23

## Package

- **ID:** IP-7010 · **Title:** Server-Authoritative WebSocket Transport · **Source:** FS-107
- **Commit verified:** `fd6b412` ("fix(transport): IP-7010 remediation for VR-7010's 2 High
  findings"), on top of `2e319e2` (the original implementation, previously `RETURNED` by
  [VR-7010](VR-7010-transport.md)). Dependencies IP-0010, IP-1010 (`VERIFIED`, VR-1010-v2), IP-6010
  (`VERIFIED`, VR-6010) remain satisfied.
- **Independence:** this session performed no implementation work on IP-7010, its remediation
  commit, or any of its dependencies — `fd6b412` predates this session. Tree actions this session
  took: read-only inspection; one throwaway diagnostic test file
  (`server/src/transport/__tests__/_vr7010v2_live_exercise.test.ts`), written, run with
  `npx vitest run`, and deleted before this report — never committed. `git pull` at session start
  reported already up to date; `git status` was clean before, and clean again after the diagnostic
  file was removed. Independence is clean, no caveat needed.

## Result

**VERIFIED** — both High findings from the original VR-7010 pass are genuinely fixed, independently
re-derived against the live tree (not just the committed regression tests), and no new defect was
introduced. IP-7010 flips `COMPLETE` → `VERIFIED`.

## Definition of Done audit

| Item | Evidence | Pass/Fail |
|---|---|---|
| All 4 Implementation Tasks complete; two-independently-computed-views test passing | `websocketServer.test.ts:58` passes; `broadcastStateDelta` (`websocketServer.ts:32-50`) confirmed unchanged from the already-`VERIFIED`-track reading in VR-7010 | **Pass** |
| No grace-period timer anywhere in the disconnect path | `grep -rn "setTimeout\|setInterval" server/src/transport/` re-run independently: zero matches | **Pass** |
| F1 fixed: reconnect to a nonexistent `sessionId` sends an explicit rejection (`action-rejected`, `reason: 'session no longer exists'`), never a silent drop | `websocketServer.ts:115-137` (`broadcastToOne`): when `store.getSession(sessionId)` is `undefined`, builds and sends a `RejectedActionMessage` with that exact reason string before returning. Independently live-exercised (see Live-exercise §1) with a hand-constructed `FakeConnection` presenting a `sessionId` that was never created in the store at all — received exactly one message, `type: 'action-rejected'`, `reason` containing "no longer exist". Committed regression test (`websocketServer.test.ts:93-100`) asserts the same and passes. | **Pass** |
| F2 fixed: `SessionState.cancelled` exists, is set on cancel, and `checkWinConditions` returns `{winner: null, reason: 'cancelled'}` for a cancelled session, including the past-timeout-cap case | `shared/src/types.ts:119` adds `cancelled?: boolean` (optional/additive); `websocketServer.ts:85` sets `session.cancelled = true` in the `'cancel'` branch; `GameEngine.ts:88-92` checks `session.cancelled` **first**, before resignation/destruction/denial/timeout, returning `{winner: null, reason: 'cancelled'}` immediately. Independently re-derived VR-7010's exact hand-reproduced scenario myself (see Live-exercise §2), plus a control case proving the timeout-tiebreak branch really is reachable and really would have fired absent the cancellation check (see Live-exercise §3). Committed regression test (`disconnectFlow.test.ts:74-88`) asserts the same and passes. | **Pass** |
| Full G5 gate (build + full suite) re-run green after both fixes: 96 tests total (1 shared + 80 server + 15 client) | `npm ci` (clean install, all `node_modules` removed first) → `npm run build` (tsc -b × 3 + vite build): clean. `npm run test`: shared 1/1, server 16 files/80 tests, client 4 files/15 tests = 96/96 | **Pass** (counts match exactly) |

## Verification Checklist audit

| Item | Evidence | Pass/Fail |
|---|---|---|
| G5 gate: build clean; full suite passes (96 total) | See above — independently rebuilt from a clean `node_modules` (not an incremental cache) | **Pass** |
| FS-107 Acceptance Criteria mapped to passing tests | AC1 (latency), AC3 (disconnect notify+choice), AC4 (reconnect delivers full state) as before. **AC5** ("WebSocket disconnection is surfaced... never a silent freeze") — the W4 edge case (reconnect to a nonexistent `sessionId`) that VR-7010 found unmet is now covered: `websocketServer.test.ts:93-100` plus this session's independent re-derivation both confirm an explicit, non-silent response. AC2 (optimistic override) remains correctly out of scope (client's job, FEAT-8000). | **Pass** |
| NFR-1100's turn-latency budget soft-measured | `websocketServer.test.ts:86-91`, re-run, passes (sub-millisecond in-memory) — unaffected by this remediation | **Pass** |

## Requirements audit

| Requirement | Where implemented | Where tested | RTM cell | Pass/Fail |
|---|---|---|---|---|
| FR-7100 (WS push, no polling) | `websocketServer.ts` `broadcastStateDelta`/`broadcastToOne` | `websocketServer.test.ts` | `FS-107 → IP-7010 → websocketServer.test.ts` — accurate | **Pass** |
| FR-7200 (server sole authority) | `handleActionMessage` routes every action through `GameEngine.handleAction` | `websocketServer.test.ts` two-independent-views case | accurate | **Pass** |
| FR-7300 (disconnect/reconnect, no winner on cancel, distinct from resignation) | `handleDisconnect`/`handleDisconnectResponse`, now also setting `session.cancelled` | `disconnectFlow.test.ts`, including the new F2 regression case | accurate — the "distinct from resignation/timeout" half of this requirement, previously only accidentally true (VR-7010's F2), is now genuinely enforced by `checkWinConditions`'s `cancelled`-first check | **Pass** (was **Fail** under VR-7010) |
| NFR-1100 (3s latency budget) | round-trip test path, unaffected | `websocketServer.test.ts` round-trip test | accurate | **Pass** |
| NFR-7200 (graceful WS degradation, no silent failure) | `DisconnectNotification` on close, **plus** the new explicit rejection on reconnect-to-nonexistent-session | `disconnectFlow.test.ts` (close-path) + `websocketServer.test.ts` (F1 reconnect-path, new) | RTM cell still reads `IP-7010 (transport half)/IP-8010 (client half, pending)`, pointing at `disconnectFlow.test.ts` only — technically incomplete (doesn't also name `websocketServer.test.ts`'s new F1 case) but not wrong; left as-is per this skill's "only correct cells the audit proved wrong" rule | **Pass** for the transport half (was **Fail** under VR-7010) |

No RTM cells were edited — none were proved wrong; the NFR-7200 cell's incompleteness (not naming
the new F1 test alongside `disconnectFlow.test.ts`) is noted as a Low finding below rather than
silently "corrected," since the trace target it does name is still accurate.

## Test run

- `rm -rf node_modules server/node_modules client/node_modules shared/node_modules` then `npm ci`
  (genuinely clean install, not an incremental rebuild) → `npm run build` (all three workspaces,
  `tsc -b` + `vite build`): clean, no errors.
- `npm run test` (all three workspaces via `vitest run`):
  - `shared`: 1 file, 1 test, pass.
  - `server`: 16 files, 80 tests, pass (includes `websocketServer.test.ts` ×5 — one more than
    VR-7010's original 4, the new F1 regression case — and `disconnectFlow.test.ts` ×6, one more
    than the original 5, the new F2 regression case).
  - `client`: 4 files, 15 tests, pass.
- Total 96 tests, matching the package's own claimed count exactly (up from 94 under VR-7010, +2
  for the two new regression tests).

## Scope audit

Diff for `fd6b412` (isolated from `2e319e2`, not the full multi-package history since then) touches
exactly 9 files: `docs/implementation/00-master-build-plan.md`,
`docs/implementation/packages/INDEX.md`, `docs/implementation/packages/IP-7010-transport.md` (all
three ledger/package housekeeping), `server/src/engine/GameEngine.ts`,
`server/src/transport/__tests__/disconnectFlow.test.ts`,
`server/src/transport/__tests__/websocketServer.test.ts`,
`server/src/transport/websocketServer.ts`, `shared/src/interfaces.ts`, `shared/src/types.ts` — this
is exactly the file set the package's own "Remediation (VR-7010)" section named (`websocketServer.ts`,
`shared/src/types.ts`, `shared/src/interfaces.ts`, `server/src/engine/GameEngine.ts`, plus the two
named test files), no excursion. `connectionRegistry.ts` and `BeliefState.ts` are untouched by this
commit (confirmed by re-reading both and by an empty `git diff 2e319e2 fd6b412 --
server/src/engine/BeliefState.ts`). `SessionState.cancelled?: boolean` is additive/optional — every
existing construction site of a `SessionState` literal (`SessionStore.ts`'s `submitKingDeployment`)
still type-checks without setting it, and every existing consumer that doesn't check `cancelled`
(none did, since the field didn't exist until this fix) is unaffected. `WinReason` gaining
`'cancelled'` widens a union type, which is additive for every existing `switch`/`===` consumer
(none of the existing code exhaustively switches over `WinReason` in a way that would now be
non-exhaustive — confirmed by reading every reference to `WinReason`/`WinResult` in `server/src`
and `client/src`; none pattern-match exhaustively).

## Live-exercise: independent re-derivation of both fixes (not a re-run of the committed suite)

**1. F1 — reconnect to a nonexistent session.** Wrote a fresh, hand-constructed `FakeConnection`
and called `transport.handleConnection('totally-bogus-session-id-xyz', 'nobody', stray)` against a
`SessionStore` that never created any session with that ID at all (more hostile than the committed
test, which is otherwise equivalent) — received exactly one message:
`{type: 'action-rejected', reason: 'session no longer exists'}`. Confirmed the control case too: a
real, fully-active session (both players joined, both Kings deployed) still gets a genuine
`state-delta` on connect, unaffected by the fix. **Holds.**

**2. F2 — cancelled-past-timeout-cap mislabeling.** Re-derived VR-7010's exact hand-reproduced
scenario independently: constructed a session, joined both players, deployed both Kings, then set
`session.turnNumber = 200` (well past the 60-turn cap) and, to make the check unambiguous, gave the
two players' Kings deliberately imbalanced `totalDenialTurns` (10 vs. 2) so that if the cancellation
check were *not* checked first, the tiebreak branch would clearly pick a winner rather than
returning null by coincidence. Set `session.phase = 'ended'` and `session.cancelled = true` directly
(bypassing the transport layer entirely, to exercise `GameEngine.checkWinConditions` in isolation)
and called it: result was exactly `{winner: null, reason: 'cancelled'}` — not `'timeout-tiebreak'`,
not a winner from the denial imbalance. **Holds.**

**3. Control case (this session's own addition, not in the committed suite).** Same session state
as #2 but with `cancelled` left unset — confirms the timeout-tiebreak branch is genuinely reachable
and would have fired (result was `{reason: 'timeout-tiebreak'}` as expected), proving #2's "holds"
result is because of the cancellation check specifically, not because the tiebreak branch is
unreachable or coincidentally also returns `null`/`'cancelled'`-shaped output for this player-state
shape.

**4. Fog-of-war non-leak sanity check (unaffected by this remediation).** Re-read
`broadcastStateDelta` and `broadcastToOne` (both untouched by `fd6b412`): both still call
`beliefState.computeOpponentView` once per recipient with that recipient's own `PlayerState` as
`observerState`, building an independent `StateDeltaMessage` per socket — structurally identical to
what VR-7010 already live-exercised and confirmed leak-free. Not a full re-audit (not warranted —
this remediation touched neither `BeliefState.ts` nor the broadcast functions' opponent-view
composition), but confirmed no line in the diff (`fd6b412`) touches this path.

**5. `SessionStore` session-ID entropy sanity check (unaffected by this remediation).** Re-read
`generateSessionId()` (`server/src/engine/SessionStore.ts:64-65`): still
`` `session-${randomBytes(16).toString('base64url')}` `` — 128 bits of `crypto.randomBytes`
entropy, byte-identical to what VR-1010-v2 and VR-7010 already confirmed. `fd6b412`'s diff does not
touch `SessionStore.ts` at all.

## Findings

| # | Description | Severity | Recommended owner |
|---|---|---|---|
| F1 (informational) | A WebSocket connection attempt during a session's `'deploying'` phase (session record exists — both players have joined — but neither/only-one King has been deployed yet, so `SessionStore.getSession()` still returns `undefined` per IP-1010's own data model) now also receives the same `{type: 'action-rejected', reason: 'session no longer exists'}` message as a genuinely nonexistent session — an inaccurate label for a session that legitimately exists but simply hasn't gone `'active'` yet. This is **not a regression introduced by this remediation**: the pre-fix code (`2e319e2`) already hit the identical `if (!session) return;` branch for this case and silently dropped the connection instead — the fix changes that no-op into an actively worded-wrong message rather than creating a new gap. It is not reachable in the current codebase's real usage (the committed test fixtures, both before and after this remediation, always complete both King deployments before ever calling `handleConnection`; the package's own Deviation note discloses that no production WebSocket bootstrap exists yet — BL-0038 — so the real connect-timing relative to King deployment is still an open, unbuilt question). Not blocking this verification: F1/F2 as scoped by the Remediation section are both about genuinely-ended-or-never-existed sessions, and this pre-existing quirk is orthogonal to both. | Low | `07-implementation-planning` (worth a note alongside BL-0038 when the real bootstrap/connect-timing is designed, so `handleConnection`/`broadcastToOne` can distinguish "session record exists but is still `'deploying'`" from "session never existed / already ended") |
| F2 (informational) | The RTM's NFR-7200 cell still names only `disconnectFlow.test.ts` as the test location, not also `websocketServer.test.ts`'s new F1 regression case (which is the test that actually covers NFR-7200's "no silent failure" clause for the reconnect-to-nonexistent-session edge case specifically). The cell is not wrong — `disconnectFlow.test.ts` genuinely does test part of NFR-7200 — just incomplete now that a second, arguably more on-point test exists. | Low | `07-implementation-planning` (RTM housekeeping, next touch) |

Neither finding is a defect in what F1/F2 actually promised to fix, and neither was introduced by
the remediation diff itself (finding 1 predates it; finding 2 is a pointer becoming merely
incomplete, not incorrect). Both are non-blocking.

## Independence caveat

None — this session did no implementation work on IP-7010, its remediation commit, or any of its
dependencies.
