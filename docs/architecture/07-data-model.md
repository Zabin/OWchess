# GDS-07 — Data Model

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-08, GDS-09, `04-requirements-engineering`

Conceptual schema shapes for GDS-04's entities, concrete enough for GDS-09 to write real
TypeScript interfaces from, but still without literal wire-format bytes (GDS-09's job) or numeric
tuning values (`04`/`06`'s job). All state described here is **in-memory, per-session** (GDS-02) —
nothing persists past the session.

## SessionState (the root object)

One instance per session, held only by the server process:

- `sessionId` — the join-link identifier (NFR-2002: sufficiently unguessable).
- `players: [PlayerState, PlayerState]` — exactly two.
- `activeTurn: PlayerId` — whose turn it is (`TurnManager`'s own state).
- `turnNumber: integer` — increments each turn-advance; the unit OQ-11's resolution counts
  transfer-time against (per-player turn count, not global — see GDS-03; `turnNumber` here is a
  global monotonic counter for logging/ordering, while each `Asset`'s own transfer-time countdown
  tracks its owner's turns specifically, a distinct, derived count).
- `eventLog: EventRecord[]` — append-only (SOR §8.3), immutable once written.
- `phase: 'deploying' | 'active' | 'ended'` — deploying = both Kings not yet placed; active = the
  turn loop (GDS-01); ended = a win condition fired.

## PlayerState (true state, one per player, never sent wholesale to either client)

- `playerId`
- `king: Asset` (the distinguished instance, GDS-04)
- `assets: Asset[]` (sensors/effectors owned by this player)
- `apRemaining: integer` (this turn's AP allotment minus spend so far — TurnManager-owned)
- `beliefOfOpponent: Map<AssetId | 'unknown', BeliefStateEntry>` — **derived**, recomputed by
  `BeliefState` as needed, not treated as independently-authoritative stored state (GDS-04's own
  "derived, not independently stored" rule) — modeled here as a cache/projection over true state
  plus tasking history, not a second source of truth.

## Asset

- `assetId`, `ownerId`, `templateId` (references the data-driven template — FR-2001)
- `basing: 'ground' | 'space'`
- `chainRoles: ChainRole[]` (which F2T2E steps this asset can perform — empty for the King itself,
  which has no sensor/effector role)
- `trueRegime: OrbitalRegimeLabel` (one of R-203's 9 recommended values — `Propagator`-owned)
- `maneuverState: { targetRegime: OrbitalRegimeLabel, turnsRemaining: integer } | null` (an
  in-progress maneuver; `turnsRemaining` decrements only on this asset's owner's own turn-advance,
  per OQ-11's resolution)
- `deployState: { turnsUntilOnline: integer } | null` (present only before FR-2006's
  time-to-online has elapsed; absent/null once the asset is usable)
- `activeEffects: EffectStateEntry[]` (Disrupt/Deny/Degrade instances currently applied — see
  GDS-04's note that `Deceive`/`Destroy` are not modeled this way)
- `isKing: boolean`, `missionSet: MissionSetId | null` (present only if `isKing`)

`Deceive` is modeled instead as a flag on the relevant `BeliefStateEntry` (a corrupted/false
reading), not on the `Asset` itself — consistent with GDS-04's observation that `Deceive` has no
physical effect on the deceiving asset's own true state. `Destroy` removes the `Asset` from the
owner's `assets` array entirely (or marks it destroyed and excluded from further play) rather than
adding an "active effect" — it is terminal, not a continuing state.

## BeliefStateEntry

- `subject: AssetId | 'unknown-contact-#N'`
- `precision: 'find' | 'fix' | 'track' | 'target'`
- `lastUpdatedTurn: integer` (for staleness/decay — SOR §7.7; the decay function itself, and its
  numeric rate, is a `04`/`06` tuning question, not fixed here)
- `sourceAssetId: AssetId` (which of the belief-holder's own sensors produced this reading)
- `deceived: boolean` (true if the reading reflects a `Deceive` effect rather than accurate
  ground truth — per the note above)
- `apparentRegime: OrbitalRegimeLabel | null` (present once precision reaches at least `fix`;
  `null` at `find`, per SOR §7.3's "find establishes presence, not characterization")

## EffectStateEntry

- `kind: 'disrupt' | 'deny' | 'degrade'` (the three continuing Five D's; `deceive`/`destroy`
  handled elsewhere per above)
- `appliedTurn: integer`, `durationTurns: integer | 'until-cleared'` (exact duration values:
  `04`/`06`)
- `stackCount: integer` (only meaningful for `degrade`, per FR-4004's cumulative-Degrade
  requirement; always `1` for `disrupt`/`deny`)
- `sourceEffectorAssetId: AssetId`

## EventRecord (the immutable event log, SOR §8.3)

- `turnNumber`, `actingPlayerId`, `actionType`, a structured payload specific to the action
  (maneuver target, tasking target, deploy template, engagement target+effect), and the resulting
  state-delta summary. Exists for debugging and to keep the door open for a future replay feature
  (R3) — not itself a v1-shipped feature (SOR §5.2).

## What crosses the wire vs. what stays server-side

Confirming NFR-2001/GDS-06's boundary concretely: a client only ever receives (a) its own
`PlayerState` in full, and (b) the *other* player's state filtered through
`beliefOfOpponent` — never the opponent's raw `PlayerState.assets`/`king`/`activeEffects` directly.
This is the literal data-shape expression of "only `BeliefState` constructs outbound
belief-filtered messages" (GDS-06) — the client-facing type is structurally a **different shape**
(`OpponentView`, built from `BeliefStateEntry[]`) than the server's internal `PlayerState`, not the
same type with fields hidden — making an accidental full-object leak a type error, not just a
missed filter, once GDS-09 defines both types concretely.

## Merge gate

- [x] Every GDS-04 entity has a corresponding schema shape here.
- [x] `Deceive`/`Destroy`'s qualitative difference (GDS-04) is reflected structurally, not just
      described in prose (deceive → `BeliefStateEntry.deceived`; destroy → removal, not a flag).
- [x] The client-visible shape (`OpponentView`) is named as structurally distinct from the
      server's internal `PlayerState`, giving GDS-06's security NFR a concrete data-level
      enforcement mechanism.
- [x] R-203's 9-value `OrbitalRegimeLabel` recommendation adopted as the schema's regime type.
- [x] No numeric tuning value invented (decay rates, effect durations, AP allotments all marked
      TBD at `04`/`06`).

**Merge decision:** GDS-04 remains authoritative for entity concepts/relationships; this document
is authoritative for their concrete shape, feeding GDS-09's literal interface definitions directly.

**Gate:** closed 2026-08-21. No new Open Questions. Next: GDS-08 (Presentation Architecture).
