# GDS-01 — Concept of Operations

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-02, GDS-03, GDS-05

The single-page description of what actually happens, moment to moment, once two players are in
a session. GDS-00 established the shape at vision altitude; this level makes it concrete enough
for GDS-02 (System Context) to draw a boundary around and GDS-03 (Architecture) to decompose into
modules.

## Who plays

Exactly two players, no more, no fewer (MSTR-001 C1). Neither authenticates — a session exists
only because a shareable link was generated and both ends of it opened a browser tab. There is no
third role: no facilitator, no spectator, no AI opponent (SOR §5.2). Everything either player sees
is either their own true state or their own earned belief-state of the opponent (GDS-04) — never
a privileged "referee" view of both sides at once, unlike `ZabSpaceExercise`'s white-cell role,
which has no equivalent here.

## Session lifecycle, end to end

1. **Create.** Player A opens the app, creates a session, receives a shareable join link
   (FR-1001). No configuration is offered at this point beyond generating the link — session
   parameters (asset roster, win thresholds) are the same fixed v1 ruleset for every game, not
   per-session options, consistent with G-6's zero-setup goal.
2. **Join.** Player B opens the link, joins (FR-1002). The game does not start until both players
   have joined (FR-1003) — there is no single-player waiting-room gameplay, only a literal wait.
3. **Deploy (King placement).** Both players are simultaneously prompted to secretly select their
   King's mission set and orbital regime (SOR §7.1). Both submissions are held server-side and
   revealed to neither client until both arrive; the server then resolves both placements at once
   and the strictly-alternating turn loop begins (FR-1004–1005). This is the only simultaneous
   moment in the entire game — everything after it is confirmed-alternating (OQ-01b).
4. **Turn loop** (the bulk of play — detailed below).
5. **End.** The game ends by King destruction, mission-denial-by-duration, resignation, or
   timeout/tiebreak (SOR §7.9) — whichever condition is met first, checked after every resolved
   action (not only at turn boundaries), since an action mid-turn can itself trigger a win
   condition (e.g. an engagement that destroys the King).

There is no post-game state to design for at this level — no rematch flow, no persistent stats
(SOR §5.2). The session simply ends; a new session is a new link.

## The turn loop, in detail

On the active player's turn:

1. The server grants a fixed AP allotment (exact value: OQ-10, `04-requirements-engineering`).
2. The player takes zero or more actions, each drawn from the extensible action set named in
   SOR §7.2 — **maneuver**, **task an asset**, **deploy a new asset**, or **pass** — until AP is
   exhausted or the player passes voluntarily. Each action is validated against current legality
   (§7.10) before it's accepted; an illegal action is rejected, never silently ignored or executed
   partially.
3. Each accepted action is resolved immediately, not batched to end-of-turn — a maneuver updates
   the mover's true orbital state at once (subject to the transfer-time modeling in GDS-03/§7.6);
   a sensor-tasking action advances the tasking player's belief-state precision along find→fix→
   track→target (SOR §7.3) at once; an engagement action resolves its Five D's effect at once.
   This matters for GDS-03: there is no "turn-end batch resolution" module to design — resolution
   is per-action, and the server broadcasts each resulting state delta (fog-of-war-filtered) to
   both clients as it happens, not once per turn.
4. After every resolved action, the win-condition check runs (destruction, mission-denial
   duration, resignation, timeout) — see step 5 above.
5. The turn ends when the active player passes or exhausts AP; the server flips the active-player
   flag and the loop repeats for the other player.

**Why this is genuinely turn-scale, not tick-scale:** asset deployment time-to-online and
maneuver transfer time are denominated in turns, not wall-clock time or simulated ticks (SOR
§7.2) — a "3-turn maneuver" completes when 3 of *that player's own* turns have elapsed, not 3
turns of the game overall (open detail for GDS-03/04 to pin down: whether transfer time counts
in the mover's own turns or in elapsed game-turns including the opponent's — this is exactly the
kind of load-bearing assumption an ADS would need to make explicit if it turns out ambiguous
during data-model design; flagged here as **OQ-11**, new, entry stage `03`/`04`).

## The F2T2E chain at player altitude

Both players run the same chain concurrently, against each other, with no shared clock forcing
them to be at the same step: Player A might be at "track" against Player B's King while Player B
is still at "find" against Player A's — the chain's progress is a per-player, per-target belief-
state fact (GDS-04), not a shared game-phase. A player's own turn is the only moment their belief-
state can advance (via a tasking action) or their own true state can change (via maneuver/deploy);
the opponent's turn is when *their* belief-state and true state can change. This confirms GDS-00's
"no concurrent-action race" framing at the operational level: nothing about the chain requires the
two players' chains to be resolved against each other simultaneously — each side's progress reads
purely from the shared, server-held ground truth plus its own sensor tasking history.

## Concurrency the server actually has to handle

Strict alternation removes the concurrent-*action* race GDS-00 already named, but does **not**
remove all concurrency concerns — recorded here as GDS-02/03 inputs:

- **Passive detection is not an action** — SOR Appendix B's worked example (§18, step 7) notes a
  player may notice being searched for. Whether this is (a) purely a human inference from earned
  belief-state with no server mechanic, or (b) a server-computed "your activity was detectable"
  signal, is not decided at this level — it's a genuine design tension for GDS-03/04, noted here
  as **OQ-12** (new, entry stage `03`), since it affects whether `BeliefState`/`EffectResolver`
  need a detectability computation at all.
- **Disconnect mid-turn** — the active player's client can drop mid-AP-spend. FR-6003 already
  defers the exact grace-period behavior to `04`; this level only establishes that the turn loop
  above must have a well-defined "turn is stalled" state the server can be in, distinct from
  "waiting for the opponent's turn" — both look like "nothing is happening" to the other client,
  but need different UI treatment (a stalled opponent turn vs. a normal wait).

## Non-features carried down from MSTR-001 §5

No AI opponent, no spectator/observer connection, no simultaneous order-writing, no mid-game
configuration changes, no persistent cross-session state. If a later increment wants any of
these, it re-enters at `01-vision` (each is a scope change to this concept level, not a
downstream detail).

**Gate:** closed 2026-08-21. Two new Open Questions raised (OQ-11, OQ-12), both entry stage `03`
— they do not block GDS-02 (System Context), which does not depend on their resolution, but must
be resolved before GDS-03 (Architecture) closes its own gate. Next: GDS-02 (System Context).
