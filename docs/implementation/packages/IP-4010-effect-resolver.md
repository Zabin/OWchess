# IP-4010 — `EffectResolver` (the Five D's Mechanism)

- **Package ID:** IP-4010 · **Status:** COMPLETE (2026-08-22) · **Owning stage-08 peer:**
  `08-code-implementation`
- **Source:** FS-105 (`docs/features/FS-105-effect-resolution.md`), FEAT-4000 — mechanism portion
  (effect-definition parameters are IP-4011, `08-content-authoring`).
- **Authorization (G3):** Covered by the release plan.

## Objective

Implement `EffectResolver`: engagement gating on targeting-quality belief-state data, structural
Deceive/Destroy dispatch, cumulative Degrade stacking, and the King denial-streak tracker
(`tickActiveEffects`), folding in BL-0015's resolution: **the denial-streak counter is a stored
field on the King asset** (`consecutiveDenialTurns: number`), not recomputed from `activeEffects`
each check — chosen for O(1) read simplicity in `checkWinConditions` (IP-1010) over recomputation,
with no behavioral difference either way (FS-105's own framing of the question).

## Requirements Covered

FR-4100, FR-4200, FR-4300, FR-4400.

## Architecture Components

`EffectResolver`.

## Interfaces

Implements `EffectResolver.resolveEngagement`, `.tickActiveEffects` (GDS-09). Consumes
`BeliefState`'s precision data (IP-2010) as `resolveEngagement`'s gating precondition; calls
`BeliefState.applyDeception` (IP-6010, once that package adds it — see Risks) for the Deceive
path rather than mutating the target's true state.

## Files to Create

- `server/src/engine/EffectResolver.ts`, `server/src/engine/__tests__/EffectResolver.test.ts`

## Implementation Tasks

1. `resolveEngagement(effector, target, effect, beliefState)`: reject unless `beliefState`'s
   precision for `target` is at least `'target'`-level (FR-4002's gating rule); Destroy removes
   the asset; Deceive calls `beliefState.applyDeception` (never mutates `target`'s own true state
   — the structural distinction GDS-04/07 require); Disrupt/Deny/Degrade add/refresh an
   `EffectStateEntry` using IP-4011's duration parameters (Disrupt/Deny 3 turns, Degrade 4 turns,
   per FS-105's own pinned numeric refinement).
2. `tickActiveEffects(asset, currentTurn)`: decrement/expire `EffectStateEntry` durations; Degrade
   stacks cumulatively (multiple active Degrade entries reduce capability further, not
   overwrite); if `asset` is a King and is currently mission-denied (Disrupt/Deny/Degrade active
   at a level meeting the denial threshold), increment `consecutiveDenialTurns` (BL-0015's stored
   field); otherwise reset it to 0.
3. Wire `resolveEngagement` into IP-1010's `handleAction` switch (replacing the `engage`-type
   stub); wire `tickActiveEffects` into the turn-advance loop alongside `Propagator.advance`/
   `BeliefState.decayStaleEntries`.

## Tests to Add

`EffectResolver.test.ts`: engagement rejected below `'target'`-level precision; Destroy removes
the asset; Deceive calls `applyDeception` and leaves true state untouched (asserted via a spy);
Degrade stacks (two applications reduce capability more than one); denial-streak increments only
while denied and resets otherwise (BL-0015's stored-field behavior, exercised as a named test).

## Documentation Updates

FS-105 metadata: `**Implemented by:** IP-4010 (mechanism), IP-4011 (content)`. Backlog: BL-0015
flips `DONE`.

## Definition of Done

- [x] All 3 Implementation Tasks complete; the Deceive/Destroy structural distinction verified by
      a test (`EffectResolver.test.ts`) that would fail if Deceive ever mutated true state.
- [x] Denial-streak tracker matches BL-0015's stored-field design (`consecutiveDenialTurns`,
      `totalDenialTurns`, both written by `tickActiveEffects`).

## Verification Checklist

- [x] **G5 gate:** build clean. **G5 gate:** full test suite passes (66 total: 1 shared + 65
      server, incl. this package's 9 in `EffectResolver.test.ts`).
- [x] FS-105 Acceptance Criteria mapped to passing tests.
- [x] Cross-checked against IP-1010's `FR-1420`/`FR-1405` consumers: `GameEngine.checkWinConditions`
      reads `king.destroyed`, `king.consecutiveDenialTurns`, `king.totalDenialTurns` — exactly the
      fields `EffectResolver.resolveEngagement`/`tickActiveEffects` write, same names/shapes.

## Deviation note

`resolveEngagement`'s gating check reads the effector's own belief-of-opponent map for the
target's precision — GDS-09's signature has no parameter for this (the same root cause BL-0028/
BL-0033 already found in `BeliefState`'s methods). Implemented with an added
`effectorObserverState: PlayerState` parameter. Also added a `turnNumber` parameter to
`TurnManager.TurnEndHook` (BL-0036): `tickActiveEffects` needs the current turn to compute elapsed
duration, which the hook signature IP-3010 introduced didn't carry — a small, additive,
backward-compatible extension (existing hooks that ignore the second argument are unaffected).

## Dependencies

IP-0010, IP-2010, **IP-6010** (all `VERIFIED` — needs real belief-state precision to gate against,
and `BeliefState.applyDeception`, which this package's own authoring surfaced as unassigned in the
initial TWBS pass and which is now placed on IP-6010's scope, since that package already owns
`BeliefState`'s belief-mutation surface — see IP-6010 §Objective).

## Risks

Low-Medium — straightforward gating/dispatch logic with no numeric ambiguity (FS-105 already
pinned the durations); the one real risk was the `applyDeception` ownership gap this package's own
authoring surfaced, now closed by assigning it to IP-6010 and adding that dependency edge here.

## Rollback Considerations

No persisted state; safe to fix forward.
