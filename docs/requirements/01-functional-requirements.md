# Functional Requirements — v1 Baseline

- **Owned by:** `04-requirements-engineering` · **Status:** ✅ Authored, 2026-08-21
- **Sources:** GDS-01 through GDS-09 (`docs/architecture/`), ADR-0001, R-203, SOR §7/§10 (via
  `docs/seed/STATEMENT_OF_REQUIREMENTS.md`)
- **Priority scale:** `Must` (v1 cannot ship without it) / `Should` (v1-scoped, degradable
  gracefully if descoped) / `Could` (nice-to-have within v1, first to cut under schedule pressure)

**Numeric tuning values decided in this pass** (SOR §14 explicitly defers these here — each cited
inline at its point of use, not carried forward from any upstream illustrative placeholder):

| Value | v1 baseline | Rationale |
|---|---|---|
| AP allotment per turn | **5 AP** | Sized so the single most expensive v1 action (kinetic/RPO effector deployment, 4 AP) is affordable in one turn alongside at least 1 AP of margin, while keeping a turn's total spend small enough to "resolve in seconds" (SOR §1). |
| AP carryover | **None — unspent AP is lost at turn end** | Simplest economy; avoids stockpiling turns into one overwhelming turn, which would work against the "legible turn-by-turn tension" goal (G-2). |
| Maneuver command cost | **1 AP** (flat, regardless of distance) | AP is the *decision* cost; the real differentiator between maneuvers is `Propagator`'s transfer-time-in-turns and fuel-analog budget, not AP — keeping AP flat avoids double-taxing distance. Per-regime-pair transfer-time/fuel values are left to `06-feature-specification`'s finer per-asset-template tuning, per this stage's scope. |
| Sensor tasking cost | **1 AP** | Matches maneuver's flat decision cost; keeps the "tempo" of a turn legible (a turn is "how many of my 5 AP-worth of decisions do I make"). |
| Asset deploy cost / time-to-online (v1 baseline, AP-denominated per FR-2005) | Radar: 1 AP / 1 turn · Tracking array: 2 AP / 2 turns · Space-based SDA sensor: 3 AP / 3 turns · Optical (ground): 2 AP / 2 turns · Optical (space): 3 AP / 3 turns · Kinetic/RPO effector: 4 AP / 4 turns · EW/jamming effector: 2 AP / 1 turn | Preserves SOR §7.5's required ground/space cost-time asymmetry (ground variants cheaper/faster; space variants costlier/slower) while keeping every single value ≤ the 5-AP allotment (affordable in one turn). EW/jamming is deliberately fast-to-online (1 turn) matching its "reversible, push-off-mission" role (SOR §7.8). |
| Mission-denial win threshold | **6 consecutive elapsed turns** with the King continuously in a qualifying denial state (any combination of Disrupt/Deny/Degrade) | Long enough that a single lucky jam can't win the game outright (requires sustained effort matching the doctrinal "push off mission" framing); short enough to stay commensurate with the AP/turn-cost economy above (roughly 3 full round-trips). |
| Max session length / tiebreak | **60 total elapsed turns** (30 per player); tiebreak = the player whose opponent's King accumulated more total denial-state turns wins (closer to the mission-denial win condition); exactly equal → draw | Gives a hard ceiling per SOR §7.9/OQ-07 without inventing a second win-condition mechanic — the tiebreak reuses the mission-denial tracker FR-4005 already requires, rather than adding a new scoring system. |

These are v1 first-guess values, not battle-tested — tag them in code/config as tunable per this
project's own placeholder convention (Strategic Assumptions Register risk table) so they're never
mistaken for final balance.

---

## FR-1000 — Session & Game Flow

### FR-1100 — Session creation and joining

- **FR-1110** — **Create session.** The system shall allow a player to create a new game session and receive a shareable join link.
  - *Rationale:* GDS-01 §Session lifecycle step 1; SOR FR-1001. *Priority:* Must. *Inputs:* none. *Outputs:* `sessionId`, join URL. *Preconditions:* none. *Postconditions:* a `SessionState` exists with `phase: 'deploying'` and one player slot filled. *Acceptance Criteria:* Given no existing session, when a player requests one, then a unique, sufficiently unguessable (NFR-2002) session identifier is returned. *Dependencies:* none. *Verification:* Test. *Source:* GDS-01 §Session lifecycle; GDS-02 §Session lifecycle. *Related ADRs:* ADR-0001. *Notes:* none.
- **FR-1120** — **Join session.** The system shall allow a second player to join an existing session via its join link.
  - *Rationale:* GDS-01 step 2; SOR FR-1002. *Priority:* Must. *Inputs:* `sessionId`. *Outputs:* player slot assignment. *Preconditions:* session exists, one slot open. *Postconditions:* both player slots filled. *Acceptance Criteria:* Given a session with one open slot, when a second client requests to join, then that client is assigned the remaining `PlayerId` and no further joins are accepted. *Dependencies:* FR-1110. *Verification:* Test. *Source:* GDS-01; GDS-02. *Related ADRs:* none. *Notes:* A third join attempt shall be rejected (FR-1121).
- **FR-1121** — **Reject over-capacity join.** The system shall reject any join attempt once both player slots are filled.
  - *Rationale:* MSTR-001 C1 (exactly two players). *Priority:* Must. *Acceptance Criteria:* Given both slots filled, when a third client attempts to join, then the attempt is rejected with a clear reason, not silently ignored. *Dependencies:* FR-1120. *Verification:* Test. *Source:* MSTR-001 §3 C1; SOR §5.1.
- **FR-1130** — **Withhold start until both joined.** The system shall not begin King deployment or the turn loop until both player slots are filled.
  - *Rationale:* SOR FR-1003. *Priority:* Must. *Acceptance Criteria:* Given only one slot filled, when time passes with no second join, then the session remains in `phase: 'deploying'` indefinitely (no forced start, no timeout in v1 — an explicit non-requirement, since the SOR names no pre-start timeout). *Dependencies:* FR-1110, FR-1120. *Verification:* Test. *Source:* SOR §10 FR-1003.

### FR-1200 — King deployment

- **FR-1210** — **Secret King selection.** The system shall require both players to secretly select their King's mission set and orbital regime before the game begins, revealing neither selection to the opponent.
  - *Rationale:* SOR §7.1; FR-1004. *Priority:* Must. *Inputs:* `missionSetId`, `OrbitalRegimeLabel` (R-203's 9-value taxonomy), per player. *Outputs:* none observable to the opponent. *Preconditions:* both slots filled. *Postconditions:* both players' King selections held server-side, unrevealed. *Acceptance Criteria:* Given both players submit a King selection, when either client requests current game state before both submissions arrive, then neither the opponent's selection nor its absence is distinguishable from "not yet decided" (no partial leak). *Dependencies:* FR-1120. *Verification:* Test. *Source:* GDS-01 §Session lifecycle step 3; SOR §7.1, FR-1004.
- **FR-1220** — **Simultaneous resolution.** The system shall resolve both Kings' deployments simultaneously once both are submitted, then begin the turn loop.
  - *Rationale:* SOR FR-1005. *Priority:* Must. *Acceptance Criteria:* Given both King selections submitted, when the second submission arrives, then `phase` transitions from `'deploying'` to `'active'` and `TurnManager` grants the first turn within the same resolution step (no observable gap where one player's King exists and the other's doesn't). *Dependencies:* FR-1210. *Verification:* Test. *Source:* SOR §10 FR-1005; GDS-01.
- **FR-1230** — **King immutability.** The system shall not allow a King's mission set to be changed after deployment; only maneuver actions may alter its orbital state thereafter.
  - *Rationale:* SOR §7.1 ("cannot be redeployed"). *Priority:* Must. *Acceptance Criteria:* Given a King has been placed, when any action attempts to change its `missionSet`, then the action is rejected. *Dependencies:* FR-1220. *Verification:* Test. *Source:* SOR §7.1; GDS-04 §King.

### FR-1300 — Turn loop and action economy

- **FR-1310** — **Grant AP allotment.** The system shall grant the active player exactly 5 AP at the start of their own turn, with no carryover from the prior turn.
  - *Rationale:* this pass's tuning decision (table above). *Priority:* Must. *Acceptance Criteria:* Given a turn begins, when `apRemaining` is read, then it equals 5 regardless of the previous turn's unspent amount. *Dependencies:* FR-1220. *Verification:* Test. *Source:* GDS-01 §Turn loop step 1; GDS-07 §PlayerState; this document's tuning table.
- **FR-1320** — **Enumerate legal actions.** The system shall present only currently-legal actions to the active player, given current AP, asset states, and game phase — no action shown as available that would then be rejected under normal play.
  - *Rationale:* SOR §7.10; FR-1007; NFR-4002; GDS-08's BL-0004 resolution. *Priority:* Must. *Acceptance Criteria:* Given a player's current AP/asset/phase state, when the action menu is rendered, then every enabled entry is one the server would currently accept, and every disabled entry states why. *Dependencies:* FR-1310. *Verification:* Test + Inspection (menu content vs. server legality function, byte-for-byte agreement). *Source:* SOR §7.10, FR-1007; GDS-06 (NFR-4002); GDS-08 (BL-0004 resolution).
- **FR-1330** — **Reject out-of-turn actions.** The system shall reject any action submitted by the non-active player.
  - *Rationale:* FR-1009. *Priority:* Must. *Acceptance Criteria:* Given player B is not active, when player B submits any action, then the server rejects it and player A's turn state is unaffected. *Dependencies:* FR-1220. *Verification:* Test. *Source:* GDS-03 §`TurnManager`; GDS-09 §`submitAction`; SOR FR-1009.
- **FR-1340** — **Pass ends turn.** The system shall allow a player to pass, ending their turn immediately regardless of remaining AP.
  - *Rationale:* SOR FR-1008. *Priority:* Must. *Acceptance Criteria:* Given any `apRemaining` ≥ 0, when the active player submits pass, then the turn advances to the opponent and the passing player's remaining AP is discarded (FR-1310). *Dependencies:* FR-1310. *Verification:* Test. *Source:* SOR §10 FR-1008; GDS-01.
- **FR-1350** — **AP-exhaustion ends turn.** The system shall automatically advance the turn when the active player's AP reaches 0 and no further action is submitted.
  - *Rationale:* GDS-01 §Turn loop step 5. *Priority:* Must. *Acceptance Criteria:* Given `apRemaining = 0`, when the active player takes no further action, then the turn advances without requiring an explicit pass. *Dependencies:* FR-1310. *Verification:* Test. *Source:* GDS-01.

### FR-1400 — Game end

- **FR-1405** — **Destruction win.** The system shall end the game with the opposing player declared winner immediately upon a King's Destroy effect resolving.
  - *Rationale:* SOR §7.9 win condition 1; GDS-01 §Session lifecycle step 5 ("Losing the King... ends the game"). *Priority:* Must. *Acceptance Criteria:* Given a King is the target of a resolving Destroy effect, when `EffectResolver` applies it, then `GameEngine.checkWinConditions` fires within the same action-resolution step (no observable gap where a destroyed King still counts toward play), and the King's owner's opponent is recorded as winner. *Dependencies:* FR-4200. *Verification:* Test. *Source:* SOR §7.9; GDS-01 §Session lifecycle; GDS-04 §King.
- **FR-1410** — **Resignation.** The system shall allow either player to resign at any time, ending the game with the opponent declared winner.
  - *Rationale:* SOR FR-1010. *Priority:* Must. *Acceptance Criteria:* Given an active session, when either player submits resign, then `phase` becomes `'ended'` and the resigning player's opponent is recorded as winner. *Dependencies:* FR-1220. *Verification:* Test. *Source:* SOR §7.9, FR-1010.
- **FR-1420** — **Timeout/tiebreak.** The system shall end the game at 60 total elapsed turns if no other win condition has fired, and resolve the winner via the tiebreak rule (this document's tuning table).
  - *Rationale:* SOR FR-1011, §7.9, OQ-07 (this pass's resolution). *Priority:* Must. *Acceptance Criteria:* Given `turnNumber` reaches 60 with no destruction/denial/resignation win, then the player whose opponent's King accumulated more total denial-state turns (FR-4005's tracker) is declared winner; if equal, the game ends in a draw. *Dependencies:* FR-4400. *Verification:* Test. *Source:* SOR §7.9; this document's tuning table.

---

## FR-2000 — Sensing & the F2T2E Chain

- **FR-2100** — **Task a sensor.** The system shall allow a player to task an owned sensor at a target regime, track, or contact, at a cost of 1 AP.
  - *Rationale:* SOR FR-3005; this pass's tuning table. *Priority:* Must. *Acceptance Criteria:* Given an online sensor and ≥1 AP, when the player submits a tasking action, then 1 AP is deducted and the tasking is recorded against that sensor for this turn. *Dependencies:* FR-1310, FR-3xxx (asset online). *Verification:* Test. *Source:* SOR §7.3, §10 FR-3005; GDS-09 §`BeliefState.applyTasking`.
- **FR-2200** — **Precision gated by asset capability.** The system shall only allow a tasking action to advance belief-state precision to a level the tasking sensor's `chainRoles` supports (e.g., a Find-only sensor cannot produce a Track-level reading).
  - *Rationale:* SOR §7.3; FR-3003. *Priority:* Must. *Acceptance Criteria:* Given a sensor whose `chainRoles` includes only `'find'`, when tasked, then the resulting `BeliefStateEntry.precision` never exceeds `'find'` regardless of repeated tasking. *Dependencies:* FR-2100. *Verification:* Test. *Source:* GDS-04 §Asset roster; GDS-09 §`BeliefState`.
- **FR-2300** — **Belief-state staleness/decay.** The system shall degrade a `BeliefStateEntry`'s confidence if not refreshed by continued tasking within 5 turns of its last update, reducing precision by one level; an entry already at `'find'` that goes stale is removed entirely (reverts to fully unknown) rather than degrading further.
  - *Rationale:* SOR §7.7; FR-3004; owner decision 2026-08-22 (resolving what was CR-01), see FS-103 §W3. *Priority:* Must. *Acceptance Criteria:* Given a belief entry last updated at turn N, when N+5 turns elapse without re-tasking, then the entry's precision is reduced by one level, or the entry is removed entirely if it was already at `'find'`. *Dependencies:* FR-2100. *Verification:* Test. *Source:* SOR §7.7; GDS-07 §BeliefStateEntry; FS-103 §W3.
- **FR-2400** — **Reflect precision/staleness to the UI.** The system shall display each belief-state entry's current precision level and staleness to the belief-holding player.
  - *Rationale:* SOR FR-3006. *Priority:* Must. *Acceptance Criteria:* Given a belief entry exists, when the intel panel renders, then its precision level and last-updated turn are both visible. *Dependencies:* FR-2300. *Verification:* Test + Demonstration. *Source:* SOR §9.2, FR-3006; GDS-08 §Intel panel.

## FR-3000 — Assets & Mission Sets

- **FR-3100** — **Data-driven asset templates.** The system shall define asset and mission-set templates in a schema-validated, data-driven format such that adding a new one requires no game-logic code change.
  - *Rationale:* FR-2001; NFR-5001; G-4. *Priority:* Must. *Acceptance Criteria:* Given a new template file conforming to the schema, when it is added, then it is playable without a code change to `GameEngine`/`Propagator`/`EffectResolver`. *Dependencies:* none. *Verification:* Inspection (a template addition PR touches no engine module). *Source:* SOR §8.4, §12, FR-2001; GDS-04.
- **FR-3200** — **v1 roster support.** The system shall support the v1 roster: mission sets SATCOM/ISR/PNT-lite; asset types wide-area SDA radar, ground tracking array, space-based SDA sensor, optical/imaging sensor (ground/space variant), kinetic/RPO effector, EW/jamming effector.
  - *Rationale:* SOR §7.4/§7.5, FR-2002/2003. *Priority:* Must. *Acceptance Criteria:* Given a new session, when either player deploys, then all listed types are selectable and functionally distinct per GDS-04's `chainRoles`/`basing` tags. *Dependencies:* FR-3100. *Verification:* Test. *Source:* SOR §7.4, §7.5; GDS-04.
- **FR-3300** — **Ground/space cost-time asymmetry.** The system shall enforce, for every asset in the roster, the deploy cost/time-to-online values in this document's tuning table, which are cheaper/faster for ground-basing and costlier/slower for space-basing.
  - *Rationale:* SOR FR-2004, §7.5. *Priority:* Must. *Acceptance Criteria:* Given the roster's ground vs. space variants, when their cost/time-to-online is compared, then every ground-basing entry is ≤ its nearest space-basing counterpart on both dimensions (per the tuning table). *Dependencies:* FR-3200. *Verification:* Inspection (table) + Test (deploy deducts the stated values). *Source:* this document's tuning table; SOR §7.5.
- **FR-3400** — **Deploy with cost deduction.** The system shall allow a player to deploy a new asset, deducting its AP cost and beginning its time-to-online countdown.
  - *Rationale:* FR-2005. *Priority:* Must. *Acceptance Criteria:* Given sufficient AP, when a deploy action is submitted, then AP is deducted per the tuning table and `Asset.deployState.turnsUntilOnline` is set to that asset's value. *Dependencies:* FR-3300. *Verification:* Test. *Source:* SOR FR-2005; GDS-07 §Asset.
- **FR-3500** — **Block pre-online use.** The system shall prevent any tasking/maneuver/engagement use of an asset before its time-to-online has elapsed.
  - *Rationale:* FR-2006. *Priority:* Must. *Acceptance Criteria:* Given `deployState.turnsUntilOnline > 0`, when any action targets that asset, then the action is rejected. *Dependencies:* FR-3400. *Verification:* Test. *Source:* SOR FR-2006.

## FR-4000 — Effectors & Engagement (the Five D's)

- **FR-4100** — **Require targeting-quality data.** The system shall require the target have a `'target'`-precision belief entry before an engagement action against it becomes legal.
  - *Rationale:* FR-4002. *Priority:* Must. *Acceptance Criteria:* Given a target with precision below `'target'`, when an engagement is attempted, then it is rejected. *Dependencies:* FR-2200. *Verification:* Test. *Source:* SOR §7.3, FR-4002; GDS-09 §`EffectResolver.resolveEngagement`.
- **FR-4200** — **Apply the correct effect.** The system shall apply exactly the effect (Deceive/Disrupt/Deny/Degrade/Destroy) the engaging effector's template specifies, to the target's true state (or the observer's belief-state, for Deceive).
  - *Rationale:* FR-4003; GDS-04's Deceive/Destroy structural distinction. *Priority:* Must. *Acceptance Criteria:* Given a successful engagement, when the effect resolves, then Destroy removes the asset, Deceive corrupts the relevant `BeliefStateEntry`, and Disrupt/Deny/Degrade add an `EffectStateEntry` to the target — never the wrong shape for the effect kind. *Dependencies:* FR-4100. *Verification:* Test. *Source:* GDS-04; GDS-07 §EffectStateEntry; GDS-09.
- **FR-4300** — **Cumulative Degrade.** The system shall allow Degrade effects to stack (increment `stackCount`) where the asset template specifies it.
  - *Rationale:* FR-4004. *Priority:* Must. *Acceptance Criteria:* Given an asset already under Degrade, when a second qualifying Degrade engagement resolves, then `stackCount` increments rather than replacing the existing entry. *Dependencies:* FR-4200. *Verification:* Test. *Source:* SOR FR-4004; GDS-07.
- **FR-4400** — **Consecutive denial-turn tracking.** The system shall track, per King, the number of consecutive turns any qualifying Disrupt/Deny/Degrade state has persisted, for the mission-denial win condition (6 turns, per this document's tuning table). This count is **total elapsed game turns** (both players' turns combined, since a continuously-active effect state persists in real time regardless of whose turn is active) — **not** the mover's-own-turns convention FR-5400 uses for maneuver transfer time; the two mechanisms are unrelated and must not be conflated.
  - *Rationale:* FR-4005; this pass's tuning decision. *Priority:* Must. *Acceptance Criteria:* Given a King under a qualifying effect, when it persists for 6 consecutive turns without a clean turn in between, then the mission-denial win condition fires for the opposing player. *Dependencies:* FR-4200. *Verification:* Test. *Source:* SOR FR-4005, §7.9; this document's tuning table.

## FR-5000 — Orbital Mechanics & Maneuver

- **FR-5100** — **Real propagation.** The system shall propagate every asset's true position using real two-body Keplerian orbital mechanics (the v1 baseline per MSTR-001 C4, amended v0.3 — not the "Kepler+J2-minimum" wording this leaf originally carried), regardless of what precision is exposed to either player. J2 is an explicit later addition (OQ-14), not part of the v1 baseline this leaf requires.
  - *Rationale:* FR-5001; SOR §7.6; MSTR-001 C4 v0.3. *Priority:* Must. *Acceptance Criteria:* Given any asset, when a turn advances, then `Propagator.advance` updates its true orbital elements per two-body Keplerian math, independent of either player's belief-state. *Dependencies:* none. *Verification:* Test (deterministic given fixed elements) — two-body motion has closed-form/canonical reference solutions (e.g. Vallado), so cross-verification no longer depends on R-201/202 the way the J2 formula did (BL-0005). *Source:* SOR FR-5001; GDS-03 §`Propagator`; R-203 (amended); MSTR-001 §8 v0.3.
- **FR-5200** — **Discrete regime presentation.** The system shall present orbital state to players as one of R-203's 9 named regimes, never raw orbital elements.
  - *Rationale:* FR-5002; SOR §7.6. *Priority:* Must. *Acceptance Criteria:* Given any client-bound message containing regime information, when inspected, then it contains only a `OrbitalRegimeLabel` value, never a numeric inclination/altitude. *Dependencies:* FR-5100. *Verification:* Inspection (message schema) + Test. *Source:* SOR FR-5002; GDS-07/09; R-203.
- **FR-5300** — **Maneuver within budget.** The system shall allow a player to maneuver an owned asset to a target regime at a flat cost of 1 AP, subject to the asset's fuel-analog budget (exact per-asset budget: `06-feature-specification`).
  - *Rationale:* FR-5003; this pass's tuning table. *Priority:* Must. *Acceptance Criteria:* Given ≥1 AP and remaining fuel budget, when a maneuver is submitted, then 1 AP is deducted and `Propagator.planManeuver` begins tracking `turnsRequired`. *Dependencies:* FR-1310. *Verification:* Test. *Source:* SOR FR-5003; GDS-09.
- **FR-5400** — **Turn-scale maneuver completion, mover's-own-turns counting.** The system shall count a maneuver's transfer time in the mover's own turns only (GDS-03's OQ-11 resolution), completing at the start of the mover's turn N+`turnsRequired`.
  - *Rationale:* FR-5004; GDS-03's resolved OQ-11. *Priority:* Must. *Acceptance Criteria:* Given a maneuver begun on the mover's turn N with `turnsRequired = k`, when the mover's own turn N+k begins, then `maneuverComplete` returns true, regardless of how many opponent turns fell in between. *Dependencies:* FR-5300. *Verification:* Test. *Source:* GDS-03 §Resolving BL-0001/OQ-11.
- **FR-5500** — **`Propagator` interface isolation.** The system shall implement all orbital propagation behind the `Propagator` interface (GDS-09), such that no other module holds a reference to its internals.
  - *Rationale:* FR-5005; NFR-5003. *Priority:* Must. *Acceptance Criteria:* Given the codebase, when searched for direct access to `Propagator`-internal state from `GameEngine`/`BeliefState`/client code, then none is found. *Dependencies:* FR-5100. *Verification:* Inspection. *Source:* SOR FR-5005; GDS-03; GDS-09.

## FR-6000 — Fog-of-War / Belief-State

- **FR-6100** — **Server-only ground truth.** The system shall hold both players' true state exclusively server-side; no client shall ever compute or store opponent ground truth.
  - *Rationale:* NFR-2001. *Priority:* Must. *Acceptance Criteria:* Given the client codebase, when inspected, then no code path accepts or derives a `PlayerState`-shaped object for the opponent. *Dependencies:* none. *Verification:* Inspection. *Source:* GDS-02 §Client architecture; GDS-08 §Fog-of-war rendering.
- **FR-6200** — **Belief-filtered outbound messages only.** The system shall route every opponent-facing piece of information through `BeliefState.computeOpponentView` before it reaches a client.
  - *Rationale:* NFR-2001; FR-3002. *Priority:* Must. *Acceptance Criteria:* Given any `StateDeltaMessage`, when its `opponentView` field is inspected, then it originates only from `computeOpponentView`'s return value, never a direct `PlayerState` reference. *Dependencies:* FR-6100. *Verification:* Test + Inspection. *Source:* GDS-06 §Security; GDS-09.

## FR-7000 — Server-Authoritative Session & Transport

- **FR-7100** — **WebSocket push notifications.** The system shall push turn-change and resolved-action notifications to both clients over WebSocket without requiring either client to poll.
  - *Rationale:* FR-6001. *Priority:* Must. *Acceptance Criteria:* Given a resolved action, when the server processes it, then a `StateDeltaMessage` is sent to both clients within the latency budget (NFR-1001) without either client having issued a request. *Dependencies:* FR-1330. *Verification:* Test. *Source:* SOR §8.1, FR-6001; GDS-02; ADR-0001.
- **FR-7200** — **Server sole authority.** The system shall treat client-side prediction, where implemented, as never authoritative — the server's resolution always overrides a pending client-side action.
  - *Rationale:* FR-6002. *Priority:* Must. *Acceptance Criteria:* Given a client shows an optimistic pending state, when the server's actual resolution differs, then the client's rendered state is overwritten to match the server's. *Dependencies:* FR-7100. *Verification:* Test. *Source:* SOR FR-6002; GDS-02; GDS-08.
- **FR-7300** — **Disconnect/reconnect handling.** The system shall allow a player to reconnect to an in-progress session without corrupting game state. **No grace period or automatic forfeit/auto-pass/timeout exists** (owner decision, 2026-08-22, resolving what was CR-02): on detecting a disconnect, the server notifies the still-connected player and lets them choose to keep waiting indefinitely or cancel the session; canceling ends the session with no winner recorded (distinct from resignation, FR-1410).
  - *Rationale:* FR-6003; owner decision 2026-08-22 (see FS-101 §W7). *Priority:* Must. *Acceptance Criteria:* Given a player's connection drops mid-session, when that player reconnects with the same `sessionId`, then their client receives the current authoritative state and can resume acting on their next legal turn. Given a disconnect persists, when the still-connected player is notified, then they can choose to keep waiting (no timer starts) or cancel (session ends with outcome `'cancelled'`, no winner). *Dependencies:* FR-1220. *Verification:* Test. *Source:* SOR FR-6003; FS-101 §W7.

## FR-8000 — Presentation / UI

- **FR-8100** — **Render the panel set.** The system shall render the six panels GDS-08 specifies: orbital board, action menu, asset tray, mission/King status, intel panel, event log.
  - *Rationale:* FR-7001. *Priority:* Must. *Acceptance Criteria:* Given an active session, when the client renders, then all six panels are present and populated per their GDS-08 definitions. *Dependencies:* FR-1220. *Verification:* Demonstration. *Source:* SOR §9.2, FR-7001; GDS-08.
- **FR-8200** — **Visual distinction of contact types.** The system shall visually distinguish own assets, known-opponent assets (at earned precision), and unknown/uncertain contacts.
  - *Rationale:* FR-7002. *Priority:* Must. *Acceptance Criteria:* Given the orbital board renders, when own/known/unknown contacts are present, then each uses a visually distinct marker/color per GDS-08's palette convention. *Dependencies:* FR-8100. *Verification:* Demonstration. *Source:* SOR FR-7002; GDS-08.
- **FR-8300** — **Cost/time-to-online shown before commit.** The system shall show, for every deployable asset, its AP cost and time-to-online before the player commits to deploying it.
  - *Rationale:* FR-7003. *Priority:* Must. *Acceptance Criteria:* Given the asset tray renders, when a deployable asset is shown, then its cost and time-to-online (per this document's tuning table) are visible before the deploy action is submitted. *Dependencies:* FR-3300, FR-8100. *Verification:* Demonstration. *Source:* SOR FR-7003; GDS-08.
- **FR-8400** — **Current AP always visible.** The system shall show current AP and (implicitly, since there is no accrual beyond the flat per-turn grant) the fixed per-turn allotment at all times during an active game.
  - *Rationale:* FR-7004. *Priority:* Must. *Acceptance Criteria:* Given an active turn, when the mission/King status panel renders, then `apRemaining` is visible and updates immediately on each AP-spending action. *Dependencies:* FR-1310. *Verification:* Demonstration. *Source:* SOR FR-7004.
- **FR-8500** — **Visible event log.** The system shall log resolved actions and effects to a human-readable, visible event log.
  - *Rationale:* FR-7005. *Priority:* Must. *Acceptance Criteria:* Given any resolved action, when the event log panel renders, then a human-readable entry for it is present, in order. *Dependencies:* FR-8100. *Verification:* Demonstration. *Source:* SOR FR-7005; GDS-07 §EventRecord.

## Candidate Requirements (untraceable to a fixed number, or genuinely deferred — NOT baselined)

| ID | Statement | Why not baselined |
|---|---|---|
| ~~CR-01~~ | ~~Belief-state decay rate (turns before a precision downgrade)~~ | **Resolved 2026-08-22 — see FR-2300.** Owner decided: 5-turn window, `'find'`-level entries removed rather than floored. No longer a candidate — promoted into the FR-2300 baseline above. |
| ~~CR-02~~ | ~~Disconnect/reconnect grace-period duration and forfeit-on-timeout policy~~ | **Resolved 2026-08-22 — see FR-7300.** Owner decided: no grace period/forfeit at all; notify-and-choose (wait indefinitely or cancel) instead. No longer a candidate — promoted into the FR-7300 baseline above. |
| CR-03 | Per-regime-pair maneuver fuel-analog budget and transfer-time-in-turns table | FR-5300/5400 establish the mechanism; the actual numbers depend on R-201/202 (not yet authored) for real two-body delta-v figures (per MSTR-001 C4 v0.3). Owner: `02-research-orbital-and-tooling` (grounding) then `06-feature-specification` (adoption). |
