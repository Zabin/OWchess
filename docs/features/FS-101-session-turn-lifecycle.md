# FS-101 — Session & Turn Lifecycle

- **Feature ID:** FS-101 (from **FEAT-1000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 · **Owned by:** `06-feature-specification` · **Epic:** EP-1000 (Core Game Engine)

## Purpose

Get two players from "create a link" to "a resolved game," enforcing strict turn alternation
throughout — carried forward verbatim from FEAT-1000's Purpose.

## Scope

Everything in FR-1xxx: session creation/join, secret simultaneous King deployment, the AP-driven
turn loop (grant/spend/pass/exhaust), and all four win-condition paths (destruction, denial,
resignation, timeout/tiebreak). Excludes the *content* of what an action does — maneuver mechanics
(FS for FEAT-5000), tasking mechanics (FEAT-2000), effect application (FEAT-4000), and asset
deploy content (FEAT-3000) are specified elsewhere; this Feature owns *whose turn it is and what
ends the game*, consuming their outputs (e.g. FR-1405 reads FEAT-4000's Destroy result) without
owning how those outputs are produced.

## Requirements Implemented

FR-1110, FR-1120, FR-1121, FR-1130, FR-1210, FR-1220, FR-1230, FR-1310, FR-1320, FR-1330, FR-1340,
FR-1350, FR-1405, FR-1410, FR-1420, NFR-2100, NFR-2200, NFR-3200, NFR-6100. (NFR-5200/8100/9100
are process-level bookkeeping entries per the catalog's own note — no player-visible behavior in
this spec implements them; they constrain how this Feature is *built and verified*, addressed in
`07`/`08`/`09`, not in the workflows below.)

## User Workflows

**W1 — Create and share a session**
1. Player A requests a new session.
2. Server generates a session ID (NFR-3200) and returns a join URL.
3. Session enters `phase: 'deploying'` with one player slot filled.

**W2 — Join a session**
1. Player B opens the join URL.
2. Server assigns Player B the remaining slot.
3. Once both slots are filled, both clients are prompted to deploy their King (W3). A third join
   attempt at any point after both slots fill is rejected (FR-1121).

**W3 — Secret simultaneous King deployment**
1. Both clients independently submit a King mission-set + orbital-regime selection.
2. Server holds each submission unrevealed to the other player.
3. Once both arrive, server resolves both placements in the same step, flips `phase` to
   `'active'`, and grants Player A (arbitrarily, the session creator) the first turn.

**W4 — A turn**
1. `TurnManager` grants the active player 5 AP (FR-1310).
2. The active player's client receives the current legal-action set (produced by the modules that
   own each action type — this Feature only gates on turn/AP, per FR-1320's cross-module
   dependency).
3. The active player submits zero or more actions; each is checked for turn/AP legality here
   before being dispatched to its owning module (maneuver → FEAT-5000, tasking → FEAT-2000, deploy
   → FEAT-3000, engage → FEAT-4000).
4. After each action resolves, the win-condition check runs (W6).
5. The player passes, or AP reaches 0; the turn advances to the opponent.

**W5 — Resignation**
1. Either player submits resign at any point during `phase: 'active'`.
2. Server ends the game immediately; the resigning player's opponent is recorded as winner.

**W6 — Win-condition check (runs after every resolved action, not only at turn boundaries)**
1. Check King destruction (reads FEAT-4000's effect-resolution output) — FR-1405.
2. Check mission-denial duration (reads FEAT-4000's consecutive-turn tracker, FR-4400) against the
   6-turn threshold — FR-1420 shares this tracker.
3. Check the 60-turn session cap; if reached with no other win condition met, resolve the tiebreak
   (FR-1420).
4. If any condition fires, set `phase: 'ended'` and record the winner (or draw).

**W7 — Disconnect mid-game** *(added 2026-08-22, resolving CR-02)*
1. The server detects one player's WebSocket connection closing while `phase: 'active'`.
2. The still-connected player's client is notified of the disconnect and presented two options:
   **keep waiting** or **cancel the session**.
3. If they choose to wait: nothing else happens — no timer starts, the session simply stays
   `'active'` with the disconnected player's turn (if it was theirs) unresolved, exactly as if
   they were thinking. If the disconnected player reconnects, play resumes normally.
4. If they choose to cancel: the server ends the session. This is **not** a resignation (FR-1410)
   — no winner is recorded, since the connected player chose to stop rather than the disconnected
   player conceding. `phase` becomes `'ended'` with a distinct outcome value (e.g. `'cancelled'`)
   from `'resigned'`/`'destroyed'`/`'denied'`/`'timeout'`, so the event log and any future stats
   correctly distinguish "the game was called off" from an actual win/loss.

## System Behaviour

| Workflow step | Normal path | Edge case(s) |
|---|---|---|
| W1 | Returns a unique session ID and URL. | N/A — session creation cannot fail under normal operation. |
| W2 | Second client joins, deployment begins. | A third/later join attempt is rejected with a clear reason (FR-1121), never silently ignored. No second player ever joins: session sits in `'deploying'` indefinitely — no forced start, no pre-start timeout (explicitly not required, SOR §10 FR-1003 names no such timeout). |
| W3 | Both submissions arrive, resolved together. | Only one submission arrives: `phase` stays `'deploying'`; the submitted selection must not be observable to the other client in any state read before both arrive (FR-1210's non-leak requirement — verified alongside FEAT-6000's fog-of-war test surface, since a premature reveal here is exactly the kind of leak that boundary exists to prevent). |
| W4 | Player spends AP across 1+ actions, then passes or exhausts AP. | The non-active player submits any action: rejected outright (FR-1330), no partial effect, active player's state unaffected. A submitted action would cost more AP than remains: rejected (a legality check this Feature owns, distinct from the action's own domain-level legality checked by its owning module). |
| W5 | Game ends, opponent wins. | Resignation submitted by a player not in the session, or after `phase: 'ended'`: rejected (guarded by ordinary session/phase validation, not a new mechanic). |
| W6 | Exactly one win condition fires per check (destruction and denial-duration are mutually exclusive within one check, since destruction removes the King the denial tracker was tracking). | Two win conditions could theoretically be satisfiable in the same check (e.g. destruction fires exactly when the 60-turn cap is also reached) — destruction takes precedence, since it is checked first (W6 step 1) and immediately sets `phase: 'ended'`, short-circuiting the later checks. This ordering is this spec's own decision, not yet stated upstream — flagged in Open Questions for confirmation at `07`. |
| W7 | The disconnected player reconnects before the connected player decides anything; play resumes with no visible interruption beyond the notification having been shown and dismissed. | The connected player chooses to cancel: session ends as `'cancelled'`, no winner. Both players disconnect simultaneously (or in close succession): no one is present to receive the "still-connected player" notification or make the wait/cancel choice — the session simply sits `'active'` and stalled until *either* reconnects and is offered the same choice about the other. |

## Module Responsibilities

- **`GameEngine`** — owns session lifecycle (create/join/phase transitions), dispatches an
  accepted action to its owning module, runs the win-condition check after every resolution
  (GDS-03).
- **`TurnManager`** — owns `activeTurn`, `apRemaining`, and the turn/AP legality gate; the *only*
  module permitted to reject an action for being out-of-turn or over-AP (GDS-03, GDS-09).

No new module is introduced by this spec.

## Interfaces Used

- `GameEngine.handleAction(sessionId, actingPlayer, action)` — the single entry point this
  Feature's W4 routes every submitted action through (GDS-09).
- `GameEngine.checkWinConditions(sessionId)` — invoked per W6 (GDS-09).
- `TurnManager.activePlayer()`, `TurnManager.apRemaining()`, `TurnManager.submitAction(...)`,
  `TurnManager.advanceTurn()` — the full turn/AP gate surface (GDS-09).
- `StateDeltaMessage`/`ActionMessage`/`RejectedActionMessage` (GDS-09's WebSocket schema) — this
  Feature is the primary producer of `StateDeltaMessage.activeTurn` and consumer/producer of
  rejections; the transport mechanics themselves belong to FEAT-7000/FS for that Feature.

## Data Model Changes

Reads and writes `SessionState.phase`, `SessionState.activeTurn`, `SessionState.turnNumber`,
`PlayerState.apRemaining`, `PlayerState.king` (per GDS-07). No new fields beyond what GDS-07
already defines — this spec adds no schema.

## State Changes

`SessionState.phase`: `'deploying'` → `'active'` (W3) → `'ended'` (W5, W6, or W7's cancel path).
`'ended'` carries an outcome value distinguishing `'resigned'`/`'destroyed'`/`'denied'`/
`'timeout'` (all have a recorded winner) from `'cancelled'` (W7, no winner).
`SessionState.activeTurn`: flips on every `TurnManager.advanceTurn()` call (W4 step 5).
`PlayerState.apRemaining`: reset to 5 at the start of each of that player's turns (no carryover,
per the requirements baseline's tuning table); decremented by each accepted action's AP cost
(costs owned by the acting action's own module, not this Feature).

## Error Handling

- **Over-capacity join** (W2 edge case): rejected with a stated reason, per FR-1121.
- **Out-of-turn action** (W4 edge case): rejected, per FR-1330; the rejection is visible to the
  submitting client (`RejectedActionMessage`) so it isn't mistaken for a dropped message.
- **Disconnect mid-game** *(resolved 2026-08-22, owner decision — see W7 and CR-02's disposition
  below)*: **no grace period, no automatic forfeit or auto-pass, no timeout of any kind.** On
  detecting a disconnect (WebSocket close on either connection), the server notifies the *still-
  connected* player and offers them a choice: keep waiting (indefinitely — matches this project's
  own no-pre-start-timeout precedent, applied consistently to mid-game as well) or cancel the
  session. Only the connected player's choice matters here — the disconnected player has, by
  definition, no way to respond. The turn loop's "stalled" state (GDS-01) is this notification,
  not a hidden timer.
- **Session with no second joiner**: not an error — an indefinite, valid `'deploying'` state
  (SOR explicitly names no pre-start timeout as a requirement) — the mid-game disconnect policy
  above is the same philosophy applied consistently after the game has started.

## Performance Considerations

Win-condition checks (W6) must complete within the same resolution step as the action that
triggered them — no observable gap where a destroyed King still "counts" (FR-1405's own acceptance
criteria). This has no separately-stated NFR of its own; it is implied by NFR-2100 (deterministic
resolution: the same action sequence must produce the same final `phase`/winner every time, which
requires the check to run synchronously with resolution, not on a separate schedule).

## Integrity Considerations

- **NFR-6100 (server-authoritative state):** every phase/turn/AP mutation in this Feature
  originates in `GameEngine`/`TurnManager` from a validated action — no client message ever writes
  `SessionState` directly.
- **NFR-2100 (deterministic resolution):** the turn loop's own state machine (phase, active turn,
  AP) must be fully determined by the action sequence — no hidden randomness, no wall-clock
  dependency in the logic itself (wall-clock time may gate a future disconnect policy, per CR-02,
  but does not affect the *deterministic-replay* property this NFR requires of the core loop).
- **NFR-3200 (unguessable session IDs):** W1's session-ID generation is this Feature's only
  security-relevant output; per the requirements baseline, at least 122 bits of entropy.
- **FR-1210's non-leakage requirement** during W3 is this Feature's one direct fog-of-war-adjacent
  obligation — verified alongside FEAT-6000's centrally-tested boundary, not independently
  re-implemented here.

## Acceptance Criteria

1. A created session has a unique, ≥122-bit-entropy ID and starts in `phase: 'deploying'` with one
   slot filled.
2. A second join fills the remaining slot; a third join attempt is rejected.
3. Both King selections remain unobservable to the opponent until both have been submitted, at
   which point both resolve in the same step and `phase` becomes `'active'`.
4. The active player is granted exactly 5 AP at turn start, with no leftover from the prior turn.
5. Any action from the non-active player is rejected without affecting the active player's state.
6. Pass or AP exhaustion advances the turn.
7. Resignation immediately ends the game with the opponent as winner.
8. King destruction, the 6-turn denial threshold, and the 60-turn cap/tiebreak each correctly end
   the game exactly once, with destruction taking precedence if multiple conditions are
   simultaneously satisfiable (this spec's own W6 ordering decision — see Open Questions).

## Verification Plan

Test (primary, per the requirements baseline's own Verification Method fields for FR-1xxx) — a
deterministic-core test suite exercising: session create/join/reject-over-capacity, simultaneous
King-deployment non-leakage, the full turn loop (grant/spend/reject-out-of-turn/pass/exhaust), and
all four win-condition paths, per NFR-8100's coverage bar. Lands in the same central test suite
FEAT-6000's fog-of-war tests run in, for the W3 non-leakage criterion specifically (shared test
infrastructure, not a duplicated suite).

## Dependencies

None upstream (FEAT-1000 is foundational, per the catalog). This spec's W6 reads FEAT-4000's
Destroy result and consecutive-denial-turn tracker as external outputs — those are FEAT-4000's own
FS's responsibility to produce correctly; this spec only consumes them.

## Risks

- **Integration risk with FEAT-4000/FEAT-5000:** W6's correctness depends on those Features'
  outputs being available and correctly shaped by the time this Feature's code is built — a
  sequencing risk the release plan's recommended build order already accounts for (FEAT-4000
  builds before FEAT-8000 but this Feature builds first of all; `07-implementation-planning`
  should ensure FEAT-1000's win-check code isn't exercised end-to-end until FEAT-4000 exists, or
  is stubbed/tested with fakes until then).
- **W7's notification/choice UI** relies on FEAT-7000's transport layer being able to push a
  disconnect notification to the *other* client — a small, new WebSocket message shape (not one
  of GDS-09's existing three) that FEAT-7000's own spec needs to add. Flagged for that Feature's
  FS to pick up, not invented here.

## Open Questions

- ~~**CR-02** — disconnect/reconnect policy~~ **Resolved 2026-08-22 by owner decision:** no grace
  period, no automatic forfeit/auto-pass/timeout. On disconnect, notify the still-connected player
  and let them choose to keep waiting (indefinitely) or cancel the session (ends `'cancelled'`,
  no winner — distinct from resignation). See W7 above.
- **Win-condition check ordering** (new, this spec): when destruction and the timeout/tiebreak
  could both fire in the same check, this spec assigns destruction precedence (checked first, W6
  step 1) as a reasonable but not upstream-mandated default. Matters because a different ordering
  (e.g. tiebreak-first) would change the recorded winner in a genuinely rare edge case (destruction
  landing exactly on the 60th turn). Resolved by: confirm at `07-implementation-planning`, or treat
  this spec's ordering as settled if no objection — low-stakes enough not to need a separate owner
  round-trip, but named here rather than silently assumed.

## Related ADRs

ADR-0001 (tech stack — `GameEngine`/`TurnManager` are TypeScript modules per that decision).
