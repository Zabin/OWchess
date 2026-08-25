# GDS-03 — Architecture

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-04, GDS-06, GDS-07, GDS-09 · **Decision:** [ADR-0001](adr/ADR-0001-tech-stack.md)
  (tech stack)

Module decomposition for the TypeScript full-stack confirmed by ADR-0001. This level also
resolves BL-0001 (OQ-11, transfer-time counting convention) and BL-0002 (OQ-12, passive-detection
mechanic), both raised at GDS-01 and scheduled to ride with this pass.

## Module decomposition (one job per module)

| Module | Job | Notes |
|---|---|---|
| `TurnManager` | Owns whose turn is active, the current AP allotment/spend, and turn-advance (pass / AP-exhaustion). The **only** module allowed to reject an action for being out-of-turn (FR-1009). | Server-side only. |
| `GameEngine` | Orchestrates one session: owns true state for both players' assets/Kings, dispatches an incoming action to the right resolver (`Propagator` for maneuver, `EffectResolver` for engagement, `BeliefState` for tasking), and runs the win-condition check after every resolved action (GDS-01 step 4). | The single entry point for "an action arrived" — nothing else touches true state directly. |
| `Propagator` | The FR-5005 interface boundary. `computePosition(asset, atTurn)` and `planManeuver(asset, targetRegime)`-shaped surface (exact signature: GDS-09). Internally: Kepler+J2-minimum math; externally: maps continuous orbital elements to the discrete regime/slot taxonomy (GDS-04). **Owns the transfer-time counting convention decision below.** | Swappable implementation, per FR-5005 — nothing outside this module knows it's Kepler+J2 rather than SGP4/full-numerical. |
| `BeliefState` | Per-player, derived-not-stored belief-state of the opponent (SOR §8.4). Computes what a tasking action reveals (find/fix/track/target precision per SOR §7.3), applies staleness/decay over turns, and is the **sole** point that decides what a `GameEngine`-held true-state fact is allowed to reach a given client. | This module *is* the fog-of-war boundary (NFR-2001) — not a filter bolted on elsewhere. **Owns the passive-detection decision below.** |
| `EffectResolver` | Applies a Five D's effect (Deceive/Disrupt/Deny/Degrade/Destroy) to a target's true state on a successful engagement (FR-4003), including cumulative/stacking Degrade (FR-4004) and consecutive-turn tracking for the mission-denial win path (FR-4005). | Reads targeting-quality confirmation from `BeliefState` before allowing an engagement to resolve (FR-4002) — does not duplicate that check. |
| WebSocket transport layer | Serializes/deserializes the two GDS-02 channels (action submission, state-delta push); no game logic. | Thin — a message-schema boundary (GDS-09), not a third place decisions get made. |
| Client UI layer | Renders whatever belief-state/state-delta it's been sent; submits actions; never computes legality or opponent state itself (GDS-02). Optimistic UI for the player's own pending actions is permitted (FR-6002) but never authoritative. | GDS-08 owns this in detail. |

**One-job-per-module check:** no module above both *decides* game truth and *decides* what a
client sees, except `BeliefState`, which is correct — deriving belief-state from truth **is** its
one job, not two. `GameEngine` orchestrates but does not itself compute maneuver outcomes, effect
outcomes, or belief-state — it delegates to the three resolver modules, keeping the orchestration
boundary and the domain-logic boundaries separate (this is exactly the seam
`10-integration-review` will later check for drift).

## Resolving BL-0001 / OQ-11 — transfer-time counting convention

**Decision:** maneuver transfer time and asset deployment time-to-online count in **elapsed game-
turns, counting only the owning player's own turns** — i.e., a "3-turn maneuver" started on the
mover's turn N completes and becomes usable at the start of the mover's own turn N+3, regardless
of how many of the opponent's turns fall in between. This is the reading GDS-01 flagged as
ambiguous; the resolution favors this convention because:

- It keeps the transfer-time cost meaningful and comparable regardless of how the opponent plays
  (an opponent who passes quickly every turn shouldn't accelerate the mover's own maneuver, which
  counting-elapsed-game-turns-including-the-opponent's would allow).
- It matches SOR §7.2's own framing that pacing is "fully determined by turns taken," read most
  naturally as *the acting player's* turns taken, not total turns elapsed in the session.
- It is the simpler implementation for `Propagator`/`GameEngine`: each asset's in-progress
  maneuver only needs to decrement on its owner's own `TurnManager` turn-advance event, not on
  every turn-advance in the session.

This becomes FR-5004's concrete behavior at `04-requirements-engineering` — recorded here as the
architecture-level decision, not re-litigated there.

## Resolving BL-0002 / OQ-12 — passive detection

**Decision:** passive detection is **not** a server-computed mechanic in v1 — it is pure human
inference from a player's own earned belief-state (e.g., noticing "I have a track forming on
something in the north" and inferring the opponent is probably searching that regime too, from
one's own game knowledge, not from a server signal telling them so). `BeliefState` and
`EffectResolver` need **no** detectability computation. This keeps the fog-of-war model exactly as
simple as SOR §7.7 already specifies (current-state fog-of-war only, no belief-state-divergence
tooling) — a "your search activity was detected" signal would be a new, non-trivial mechanic
(itself a kind of counter-intelligence sub-system) that no FR in the seed SOR actually requires.
If a future increment wants this as a real feature, it enters via `00-intake` as new scope, not
retrofitted here.

## The `Propagator` boundary, concretely

Per FR-5005/ADR-0001: a TypeScript interface (exact method signatures: GDS-09) that `GameEngine`
and `BeliefState` call without knowing the implementation is Kepler+J2. Internally, the current
implementation propagates true orbital elements turn-by-turn and exposes two things outward: (1)
which discrete regime/slot (GDS-04's taxonomy) an asset currently occupies, for belief-state and
rendering purposes, and (2) whether an in-progress maneuver has completed, per the OQ-11
resolution above. No caller ever receives raw orbital elements — that boundary is what makes a
future higher-fidelity swap (R4, SGP4/TLE) a swap behind the same interface, not a rewrite
(NFR-5003).

## Merge gate

- [x] Every candidate module from GDS-00/01/02's forward references now has a named, one-job
      owner; none left as a placeholder.
- [x] The `Propagator` interface boundary is described concretely enough for GDS-09 to write a
      real method signature from it, without inventing new scope here.
- [x] BL-0001 (OQ-11) and BL-0002 (OQ-12) both resolved with recorded rationale, not silently
      dropped.
- [x] ADR-0001 (tech stack) accepted and cross-linked.
- [x] No numeric tuning value invented (transfer-time *counting convention* was decided; the
      actual turn-counts per asset remain OQ-05/`04`'s job).

**Merge decision:** GDS-01/02 remain authoritative for concept/boundary; this document is
authoritative for module decomposition and the `Propagator` contract's shape (not yet its literal
method signatures — GDS-09's job).

**Gate:** closed 2026-08-21. BL-0001 and BL-0002 → `DONE` (resolved above). Next: GDS-04 (Domain
Model).
