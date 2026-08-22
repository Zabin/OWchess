# FS-105 — Effect Resolution (the Five D's)

- **Feature ID:** FS-105 (from **FEAT-4000**, `docs/feature-planning/03-feature-catalog.md`)
- **Status:** ✅ Authored, 2026-08-22 · **Owned by:** `06-feature-specification` · **Epic:** EP-1000 (Core Game Engine)
- **Implemented by:** [IP-4010](../implementation/packages/IP-4010-effect-resolver.md) (mechanism,
  COMPLETE, awaiting `09-package-verification`), [IP-4011](../implementation/packages/IP-4011-effect-content.md) (content, not yet started). Note: `BeliefState.applyDeception` lives in [IP-6010](../implementation/packages/IP-6010-fog-of-war-enforcement.md), assigned there during implementation planning.

## Purpose

Resolve an engagement into one of the Five D's, correctly, including cumulative Degrade and the
mission-denial duration tracker — carried forward verbatim from FEAT-4000's Purpose.

## Scope

*Applying* an effect: gating engagement on targeting-quality data, dispatching to the correct
effect-kind handling (Deceive/Destroy structurally distinct from Disrupt/Deny/Degrade, per GDS-04/
07), cumulative Degrade stacking, and the consecutive-denial-turn tracker FR-1420's timeout-
tiebreak and FR-1405's destruction-win both read. Excludes reading whether an engagement is legal
in the first place (that's FEAT-2000's belief-state precision, consumed here) and excludes the win
check itself that consumes this Feature's tracker output (FEAT-1000/FS-101).

## Requirements Implemented

FR-4100, FR-4200, FR-4300, FR-4400.

**Numeric refinement made in this pass** (per this stage's own scope — SOR/`04` left effect
*durations* unset, only the mission-denial *threshold* (6 turns) was baselined): Disrupt and Deny
each last **3 turns** per application; Degrade lasts **4 turns** per application (each stack has
its own independent countdown, per GDS-07's array-of-instances model). Rationale: kept below the
6-turn mission-denial threshold (FR-4400) so a single application can never win outright — the
"requires sustained effort" reasoning FR-4400's own tuning-table entry already states — while
Degrade's slightly longer duration matches SOR §7.8's "wears down over multiple turns" framing
for that specific effect.

## User Workflows

**W1 — Engage**
1. During an active turn, the player selects an owned, online effector (FS-102) and a target
   asset with a `'target'`-precision belief-state entry (FEAT-2000's output).
2. Server validates the precision gate (FR-4100); if it passes, the effector's template-specified
   effect kind resolves against the target.

**W2 — Effect application (dispatched by kind)**
1. **Destroy**: the target `Asset` is removed from its owner's roster entirely. If the target was
   a King, FR-1405's win check (FS-101) fires in the same resolution step.
2. **Deceive**: `BeliefState.applyDeception` is called instead of mutating the target's own true
   state — the *observing* player's belief entry is corrupted, the target asset itself is
   unaffected (GDS-04's structural distinction, enforced here as a different code path, not a
   flag).
3. **Disrupt / Deny**: a new `EffectStateEntry` (`durationTurns: 3`) is added to the target.
4. **Degrade**: a new `EffectStateEntry` (`durationTurns: 4`) is added; if the target already has
   an active Degrade entry from a *different* prior engagement, both coexist independently
   (`stackCount` reflects the concurrent count, per FR-4300) rather than one replacing the other.

**W3 — Per-turn effect ticking**
1. Once per turn-advance, `EffectResolver.tickActiveEffects` runs for every asset with active
   `EffectStateEntry` records.
2. Each entry's `durationTurns` decrements; entries reaching 0 are removed.
3. For each King, the consecutive-turn tracker (feeding FR-1420's win check) increments if the
   King currently has ≥1 qualifying Disrupt/Deny/Degrade entry active, and resets to 0 the moment
   it has none.

## System Behaviour

| Workflow step | Normal path | Edge case(s) |
|---|---|---|
| W1 | Engagement proceeds to W2. | Target precision below `'target'`: rejected (FR-4100). Engaging with an offline effector: rejected (FR-3500, FS-102's contract). |
| W2 (Destroy) | Asset removed; King destruction triggers FR-1405. | Destroying an already-destroyed/nonexistent asset: not reachable under normal play, since a destroyed asset can no longer be a legal W1 target (it no longer exists to have a belief-state entry against). |
| W2 (Deceive) | Belief entry corrupted, target's true state untouched. | Deceiving a target the observer has no belief-state entry for at all: not reachable — W1's precision gate already requires an existing `'target'`-level entry. |
| W2 (Disrupt/Deny/Degrade) | New `EffectStateEntry` added with the stated duration. | A target already at multiple concurrent Degrade stacks: each stack ticks independently (W3) — the target is not "maxed out," per FR-4300's cumulative design. |
| W3 | Entries decrement and expire on schedule; King denial-streak tracks accurately. | A King loses its last active denial effect mid-way through a turn (e.g. the effect naturally expires the same turn a Destroy also resolves elsewhere): the denial-streak reset (going to 0) and any Destroy-driven win check are independent operations — this spec does not need to sequence them relative to each other, since only FR-1405 (Destroy) can end the game from this Feature's own actions; a denial-streak reset never itself ends anything. |

## Module Responsibilities

`EffectResolver` — owns W1 (the precision gate check, reading FEAT-2000's `BeliefState` output),
W2 (dispatch per effect kind), and W3 (ticking/expiration, denial-streak tracking). Calls
`BeliefState.applyDeception` for the Deceive path (GDS-09) — the only cross-module call this
Feature's own logic makes.

## Interfaces Used

- `EffectResolver.resolveEngagement(effector, target, effect, beliefState)` (GDS-09) — W1/W2.
- `EffectResolver.tickActiveEffects(asset, currentTurn)` (GDS-09) — W3.
- `BeliefState.applyDeception(observer, subject, falseRegime)` (GDS-09) — W2's Deceive path.

No new interface needed.

## Data Model Changes

Reads and writes `Asset.activeEffects` (`EffectStateEntry[]`), removes an `Asset` entirely on
Destroy, per GDS-07. Reads `BeliefStateEntry.precision` (FEAT-2000's data) to gate W1. The King
denial-streak counter (feeding FR-1420/FR-4400) is a derived value computed from `activeEffects`
during W3, not necessarily its own stored field — GDS-07 does not name a separate field for it,
which this spec flags as an Open Question below (store vs. recompute each check).

## State Changes

`Asset.activeEffects`: entries added (W2), decremented and removed on expiration (W3). `Asset`
itself: removed entirely on Destroy (W2). King denial-streak: increments/resets per turn (W3),
per the Open Question on its storage above.

## Error Handling

- **Sub-`'target'`-precision engagement attempt** (W1 edge case): rejected, per FR-4100.
- **Offline effector**: rejected, per FR-3500 (FS-102's contract, not re-specified here).

## Performance Considerations

`tickActiveEffects` (W3) runs once per turn-advance across all assets with active effects —
bounded by the small v1 roster size, well within NFR-1200's per-turn compute budget (same
argument FS-104 makes for its own per-turn processing).

## Integrity Considerations

The Deceive/Destroy structural distinction (GDS-04/07) is enforced here as two genuinely
different code paths (W2), not a shared "apply effect" function with a conditional — this is the
concrete mechanism by which GDS-04's qualitative distinction becomes real, not just documented.
No fog-of-war implication beyond what FEAT-2000/6000 already own: this Feature reads belief-state
precision (a legality check) but does not itself construct any client-facing message.

## Acceptance Criteria

1. Engagement is rejected unless the target has a `'target'`-precision belief-state entry.
2. Destroy removes the target asset; if it was a King, the destruction win check fires in the
   same resolution step.
3. Deceive corrupts the observer's belief-state entry only — the target's own true state is
   unaffected.
4. Disrupt/Deny entries last exactly 3 turns; Degrade entries last exactly 4 turns; multiple
   concurrent Degrade entries on one target coexist and tick independently.
5. A King's consecutive-denial-turn count increments exactly when ≥1 qualifying effect is active,
   and resets to 0 the instant none are.

## Verification Plan

Test — deterministic given a fixed engagement sequence, consistent with NFR-8100's coverage bar
(explicitly names "all win-condition paths," which includes the mission-denial path this
Feature's tracker feeds).

## Dependencies

FS-102 (effector templates/online state), FS-103 (belief-state precision, the W1 gate input).

## Risks

- **Denial-streak storage** (see Data Model Changes) — whether it's a stored field or recomputed
  each check is an implementation choice with no behavioral difference if done correctly, but
  worth settling once before `07` plans packages, to avoid two different implementations assuming
  different storage.
- Otherwise Medium risk (per the catalog), consistent with the Deceive/Destroy dispatch logic
  being the one place a subtle bug (treating Deceive like a normal effect) would be a real
  fog-of-war-adjacent correctness issue, as the catalog itself already flags.

## Open Questions

- **Denial-streak storage** (new, this spec): store as an explicit field (e.g. on `PlayerState` or
  the King `Asset`) vs. recompute from `activeEffects` on every check. Matters for `07`'s data-
  model/package planning, not for this spec's own behavioral contract (both approaches produce
  identical observable behavior). Resolved by: `07-implementation-planning`'s own data-model
  refinement — low-stakes, no owner input needed.

## Related ADRs

None beyond ADR-0001.
