# GDS-04 — Domain Model

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-05, GDS-06, GDS-07

The conceptual entities and their relationships — not a literal schema (GDS-07's job) or a numeric
tuning table (`04-requirements-engineering`/`06-feature-specification`'s job per MSTR-001 C6/C7).

## Core entities

### King

A distinguished `Asset` instance, exactly one per player, created only during the deploy phase
(GDS-01) and never again — it cannot be redeployed, only maneuvered (SOR §7.1). Has a fixed
`MissionSet` and an initial `OrbitalRegime`, both secret until the opponent's belief-state earns
visibility. Losing the King (destroyed, or held in a qualifying denial-state past the win
threshold) ends the game — the King is the only entity whose loss is itself a game-ending event;
every other asset can be lost without ending play.

### Asset (base concept)

Anything with true orbital state that either player owns: the King, plus every deployed sensor
and effector. Common attributes, conceptually: an owning player, a `MissionSet` (King only —
sensors/effectors are typed by asset-role instead, see below), a `Basing` (ground | space), a
current true `OrbitalRegime` (via `Propagator`), a deployment/time-to-online state, and — for
effect-bearing assets — any active Five D's state currently applied to it.

### MissionSet

`SATCOM | ISR | PNT-lite` (SOR §7.4) — the King's only typed attribute beyond regime. Each is
marked King-eligible in v1 (all three are); the schema (GDS-07) should not hard-code "exactly
these three are the only valid values forever" — SOR §5.3/R1 already names roster expansion as a
candidate later phase, so `MissionSet` is a lookup against the data-driven template library
(FR-2001), not a fixed enum baked into game logic.

### Asset roster (sensors and effectors)

Six v1 types (SOR §7.5), each tagged with a `ChainRole` (which F2T2E step(s) it can perform) and
a `Basing`:

| Asset type | ChainRole | Basing |
|---|---|---|
| Wide-area SDA radar | Find | Ground |
| Ground-based tracking array | Track, Target | Ground |
| Space-based SDA sensor | Fix, Track | Space |
| Optical/imaging sensor | Fix | Ground or space variant |
| Kinetic/RPO effector | Engage (Deny/Destroy) | Space |
| EW/jamming effector | Engage (Disrupt/Degrade) | Ground |

Like `MissionSet`, this is a data-driven template set (FR-2001/NFR-5001), not a hard-coded type
switch — `GameEngine`/`EffectResolver` dispatch on `ChainRole` and `Basing`, not on a per-asset
`if` chain, so a seventh asset type (R1: PNT, ELINT/SIGINT missions; dazzle, cyber effectors) is a
template addition, not a code change.

### OrbitalRegime

The discrete, chess-legible presentation of continuous orbital state (SOR §7.6) — a named
altitude band (LEO/MEO/GEO-analog) crossed with a small number of inclination/plane classes. The
**exact taxonomy (how many bands, how many plane classes) is not decided at this level** — SOR §14
explicitly defers it to `03-architecture-design-synthesis` grounded in research, which this
document notes as still owed: **OQ-13** (new, entry stage `02`/`03` — the concrete band/plane-class
count needs `02-research-orbital-and-tooling` grounding on what a real Kepler+J2 propagation
naturally clusters into before this document can pin the taxonomy down further than "LEO/MEO/GEO-
analog crossed with a small number of plane classes"). `Propagator` is the only module that
translates between continuous elements and this discrete presentation (GDS-03).

### BeliefStateEntry

Per SOR §8.4: one entry per player, per subject (a specific opposing asset, or an unresolved
"unknown contact"). Fields, conceptually: subject reference (or unknown-contact placeholder), a
`Precision` level (`find | fix | track | target`, matching the F2T2E chain — SOR §7.3), a
last-updated turn number (for staleness/decay, SOR §7.7), and the source sensor that produced it.
**Derived, not independently stored** — `BeliefState` computes this from `GameEngine`'s true state
plus the belief-holder's own sensor-tasking history each time it's needed or refreshed; there is no
persisted "opponent's belief of me" object a player's own actions write to directly.

### Effect state (the Five D's)

`Deceive | Disrupt | Deny | Degrade | Destroy` (SOR §7.8), reused directly from
`ZabSpaceExercise`'s taxonomy. `Deceive` and `Destroy` are qualitatively different from the middle
three: `Deceive` has no physical effect on the target's true state (it corrupts what the *opposing*
player's belief-state computation would otherwise show — a `BeliefState`-side concern, not an
`Asset`-side state flag) and `Destroy` is terminal (removes the asset from play; if applied to a
King, ends the game). `Disrupt`/`Deny`/`Degrade` are asset-side state flags with a duration and,
for `Degrade`, a cumulative/stacking dimension (FR-4004) — conceptually a small ordered set of
active-effect records on the `Asset`, not a single scalar "health" value, since multiple effects
with independent durations can be active on one asset at once.

## Entity relationships

```
Player 1---1 King (an Asset, MissionSet-typed)
Player 1---* Asset (sensors/effectors, roster-typed)
Player 1---* BeliefStateEntry (about the OTHER player's assets)
Asset  *---1 OrbitalRegime (via Propagator, true state)
Asset  1---* EffectState (active Five D's instances, Disrupt/Deny/Degrade only)
BeliefStateEntry *---1 Asset-or-unknown-contact (the subject)
```

No entity in this model is shared between players — even the notion of "the same regime" is a
label both players' true assets can occupy, not a shared mutable object either player's action
touches directly. This is the domain-model expression of GDS-02/03's server-authority principle:
every mutation happens through `GameEngine`/`Propagator`/`EffectResolver` against one player's
owned entities; a player's action never directly writes anything on the opponent's side except
indirectly, through `EffectResolver` applying an engagement's result.

## What this level deliberately does not fix

- **Exact orbital-regime/slot taxonomy** (OQ-13, new this run) — routed to `02-research-orbital-
  and-tooling` before `04-requirements-engineering`/`06-feature-specification` can use it.
- **Numeric values** — asset costs, time-to-online, AP costs, win-condition thresholds (all
  already tracked as OQ-05/06/07/10) — this model defines *what* has a cost/duration, not *how
  much*.
- **The literal data schema** (field types, validation rules) — GDS-07's job, building on the
  entities named here.

## Merge gate

- [x] Every entity SOR §7.1/§7.4/§7.5/§7.7/§7.8/§8.4 names has a corresponding concept here, with
      its relationships to other entities stated.
- [x] No entity hard-codes the v1 roster as permanently fixed — `MissionSet`/asset-type dispatch
      is explicitly data-driven (FR-2001/NFR-5001), consistent with G-4/R1.
- [x] `Deceive` and `Destroy`'s qualitative difference from `Disrupt/Deny/Degrade` stated, so
      GDS-07 doesn't model all five as one uniform "effect flag" shape.
- [x] No numeric tuning value invented; OQ-13 (regime taxonomy) raised rather than guessed.

**Merge decision:** GDS-01 remains authoritative for the operational concept; this document is
authoritative for entity shape and relationships, feeding GDS-05/06/07 directly.

**Gate:** closed 2026-08-21. One new Open Question raised: **OQ-13** (exact orbital-regime/plane-
class taxonomy), entry stage `02-research-orbital-and-tooling` then `03`/`04` — does not block
GDS-05/06 (functional/non-functional requirements can proceed citing "a discrete regime taxonomy,
exact count TBD"), but should be resolved before GDS-07 (Data Model) needs a concrete schema for
it. Next: GDS-05 (Functional Requirements level).
