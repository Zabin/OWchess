# VR-4010 — `EffectResolver` (the Five D's Mechanism)

- **Owned by:** `09-package-verification` · **Date:** 2026-08-22

## Package

- **ID:** IP-4010 · **Title:** `EffectResolver` (the Five D's Mechanism) · **Source:** FS-105
  (mechanism portion; content is IP-4011).
- **Commit verified:** `a249271` ("feat(engine): implement IP-4010, EffectResolver (the Five D's
  mechanism)"). Dependencies IP-0010 (`VERIFIED`, VR-0010), IP-2010 (`VERIFIED`, VR-2010-v2,
  `df1c718`), and IP-6010 (`VERIFIED`, VR-6010, `c81ad93`) are all satisfied as of this session.
- **Independence:** this session performed no implementation work on IP-4010, IP-4011, IP-6010, or
  any other package. Commit `a249271`'s `Claude-Session` trailer names a different session.
  Independence is clean, no caveat needed.
- **Dependency-gate note:** at this session's start, the Master Build Plan's IP-4010 row listed its
  three dependencies as "all VERIFIED", but the tree's actual ledger state at that moment showed
  IP-6010 only `COMPLETE` (its own verification, VR-6010, was mid-flight in a concurrent session).
  This session proceeded to audit IP-4010's own code on its merits regardless (its code exists in
  the tree and does not itself depend on IP-6010's ledger status to be correct or incorrect), per
  instruction. Partway through this session's work, the concurrent session committed `c81ad93`
  (VR-6010 — VERIFIED), so by the time this report is finalized IP-4010's dependency gate is
  genuinely, not just prospectively, fully satisfied.
- **Concurrent activity note:** a second concurrent package (IP-4011, content) was also found
  `COMPLETE`/committed (`c1a2bc8`) during this session, and an untracked `server/src/transport/`
  directory (evidently early IP-7010 work) appeared in the working tree. Neither is in this
  package's scope; neither was read or judged by this report.

## Result

**VERIFIED** — All Definition of Done items and Verification Checklist items hold under
independent re-derivation. The Deceive/Destroy structural distinction was live-exercised beyond
the committed test file, through the real `GameEngine.handleAction('engage', ...)` path, with a
pre-populated King (existing Disrupt entry, non-zero `consecutiveDenialTurns`/`totalDenialTurns`)
and repeated Deceive calls — the target's true state (regime, `destroyed`, `activeEffects`, both
denial-streak fields) was byte-for-byte unchanged throughout, while a separate Destroy call on
another target did mutate `destroyed`. The denial-streak arithmetic
(`consecutiveDenialTurns`/`totalDenialTurns`) was cross-checked field-for-field against
`GameEngine.checkWinConditions` (IP-1010) and against FS-105/FR-4400/FR-1420's win-condition and
tiebreak semantics — no drift. Both disclosed deviations are judged substantively reasonable; the
`resolveEngagement` Deviation note is judged **incomplete** in the same way VR-6010 found
`applyDeception`'s note incomplete (see Finding F1) — Low, non-blocking. Build clean; full suite
green (66 tests: 1 shared + 65 server, matching the package's own claim exactly, including 9 in
`EffectResolver.test.ts`). The `TurnEndHook` `turnNumber` addition (BL-0036) is independently
confirmed additive/backward-compatible: `TurnManager.test.ts`, `deployAction.test.ts`,
`taskAction.test.ts`, and `createGameEngine.wiring.test.ts` (IP-1010/IP-3010's own
already-`VERIFIED` hook consumers) all still pass, and the diff shows both existing hook
registrations (`createGameEngine.ts`'s composed hook, `taskAction.ts`'s `registerBeliefDecay`
hook) needed no changes — one adopts the new second parameter, the other still ignores it, both
valid under the wider `TurnEndHook` type.

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| All 3 Implementation Tasks complete; Deceive/Destroy structural distinction verified by a test that would fail if Deceive ever mutated true state | Read `EffectResolver.ts:29-70` in full: `resolveEngagement`'s `switch` has `'destroy'` (`target.destroyed = true`) and `'deceive'` (calls `beliefState.applyDeception(...)`, no reference to `target`'s own fields at all) as two structurally separate branches — not a shared function with a conditional. `EffectResolver.test.ts`'s Deceive case asserts `target.trueRegime` unchanged and `target.destroyed === false` after a successful Deceive. This session's own live-exercise (see below) goes further: pre-populated `activeEffects`/denial-streak fields on the target King, ran Deceive twice through the real engine wiring, and confirmed a byte-for-byte-equal JSON snapshot of the King's true state before and after. `engageAction.ts` wires `resolveEngagement` into `GameEngine` via `registerHandler('engage', ...)`; `createGameEngine.ts`'s turn-end hook calls `tickActiveEffects` for every asset (king + assets) each turn. | **Pass** |
| Denial-streak tracker matches BL-0015's stored-field design (`consecutiveDenialTurns`, `totalDenialTurns`, both written by `tickActiveEffects`) | Read `EffectResolver.ts:96-114`: `tickActiveEffects` filters expired entries, then for a King checks `activeEffects.some(kind in {disrupt,deny,degrade})` — increments both `consecutiveDenialTurns` and `totalDenialTurns` while denied, resets only `consecutiveDenialTurns` to 0 otherwise (`totalDenialTurns` is never reset anywhere in the method). Confirmed against `shared/src/types.ts`'s `Asset` shape (both fields present, `number`). `EffectResolver.test.ts`'s 4-test denial-streak suite (increment, expiry, reset, total-never-resets) all pass. | **Pass** |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: build clean | `npm run build` (root workspaces): `tsc -b` clean in `shared`/`server`; `tsc -b && vite build` clean in `client` (29 modules, 916ms). No errors. | Pass |
| G5 gate: full test suite passes (package's claim: "66 total: 1 shared + 65 server, incl. this package's 9 in `EffectResolver.test.ts`") | `npm run test` (root workspaces): shared **1/1** (`types.smoke.test.ts`); server **13 files, 65/65** (`BeliefState.tasking.test.ts` 7, `EffectResolver.test.ts` 9, `taskAction.test.ts` 4, `deployAction.test.ts` 4, `BeliefState.fogOfWar.test.ts` 3, `createGameEngine.wiring.test.ts` 3, `Propagator.maneuverCost.test.ts` 8, `SessionStore.test.ts` 5, `GameEngine.winConditions.test.ts` 7, `TurnManager.test.ts` 4, `contentTemplates.test.ts` 4, `Propagator.propagation.test.ts` 3, `TemplateRegistry.test.ts` 4); client 0 test files (expected). **Full-suite total: 66** (1 + 65) — exactly matches the package's own claim. | Pass |
| FS-105 Acceptance Criteria mapped to passing tests | AC1 (precision gate): `EffectResolver.test.ts` "rejects engagement below target-level precision". AC2 (Destroy removes/wins): "Destroy flags the target destroyed" + `GameEngine.winConditions.test.ts` "declares the opponent winner on a 6-turn denial streak"/destruction cases (IP-1010's own suite, cross-package). AC3 (Deceive isolation): "Deceive corrupts the effector's belief entry, never the target's true state" + this session's own live-exercise. AC4 (durations/stacking): "Disrupt/Deny add a 3-turn EffectStateEntry", "Degrade stacks cumulatively". AC5 (denial-streak increment/reset): the 4-test denial-streak suite. All map to passing tests. | Pass |
| Cross-checked against IP-1010's `FR-1420`/`FR-1405` consumers: `GameEngine.checkWinConditions` reads `king.destroyed`, `king.consecutiveDenialTurns`, `king.totalDenialTurns` — exactly the fields `EffectResolver` writes | Independently re-read `GameEngine.ts:83-121`: `checkWinConditions` reads `a.king.destroyed`/`b.king.destroyed` (destruction, FR-1405), `a.king.consecutiveDenialTurns >= DENIAL_STREAK_THRESHOLD` (`DENIAL_STREAK_THRESHOLD = 6`, matching FR-4400's tuning-table value) for the denial win condition, and `a.king.totalDenialTurns`/`b.king.totalDenialTurns` at `TIMEOUT_TURN_CAP = 60` (matching FR-1420's "60 total elapsed turns") for the timeout tiebreak. Every one of these is exactly the field name/shape `EffectResolver.resolveEngagement`/`tickActiveEffects` writes (`Asset.destroyed`, `.consecutiveDenialTurns`, `.totalDenialTurns`) — no drift, no shadow/derived copy anywhere. `GameEngine.winConditions.test.ts` directly exercises both the 6-turn denial streak and the timeout-tiebreak-by-`totalDenialTurns` paths and passes. | **Pass** |

## Live-exercise of the Deceive/Destroy structural distinction (independent, beyond the committed test file)

Wrote and ran (then deleted, never committed) a scratch vitest file exercising the **real**
`createGameEngine()` composition root end-to-end (not the isolated `EffectResolver` unit), going
beyond `EffectResolver.test.ts`'s single-field, single-call check:

1. Built a full two-player session via `store.createSession`/`joinSession`/`submitKingDeployment`,
   registered turn-end hooks via `turnManagerFor`, and gave Bob's King **pre-existing** non-default
   true state: an active `disrupt` entry, `consecutiveDenialTurns = 5`, `totalDenialTurns = 12`.
2. Ran `engine.handleAction(sessionId, 'alice', { type: 'engage', payload: { effect: 'deceive', ... } })`
   **twice in a row** (different `falseRegime` each time) against Bob's King, through the full
   `engageAction.ts` → `EffectResolver.resolveEngagement` path (AP spend, online-check, precision
   gate, and all).
3. Took a full JSON snapshot of `{trueRegime, destroyed, activeEffects, consecutiveDenialTurns,
   totalDenialTurns}` before and after both calls: **byte-identical** — not just `trueRegime`/
   `destroyed` (what the committed test checks) but also the pre-existing `activeEffects` array and
   both denial-streak fields, none of which the committed test's fixture ever populates
   non-default, so this is a genuinely new case the committed suite doesn't cover.
4. Confirmed the *observer's* belief entry did change as expected (`deceived: true`,
   `apparentRegime` updated to the second call's `falseRegime`).
5. As the structural contrast, ran a `destroy` engagement (through the same real path) against a
   second, non-King asset and confirmed `destroyed` flips to `true` — proving the two paths are
   genuinely different code, not a Deceive-that-happens-to-look-safe.

Both `accepted: true` action results and all assertions held on the first run. This confirms the
structural distinction survives real wiring (AP accounting, online checks, turn-number threading)
and repeated application, not only the isolated unit test's single happy-path call.

## Denial-streak arithmetic cross-check (FR-4400/FR-1420 vs. `checkWinConditions`)

- **FR-4400** (`docs/requirements/01-functional-requirements.md`): tracks, per King, consecutive
  turns any qualifying Disrupt/Deny/Degrade state has persisted; **6 turns** triggers mission-denial
  win; explicitly **total elapsed game turns (both players' turns combined)**, not the mover's-own-
  turns convention FR-5400 uses. `EffectResolver.tickActiveEffects` is called once per
  `TurnManager.advanceTurn()` for the *ending* player's own assets only (per `createGameEngine.ts`'s
  hook), but since `advanceTurn()` fires on every turn transition for whichever player's turn just
  ended, and each player's own King is ticked on their own turn-end, the *count* accumulated is
  turns-of-persistence measured in ticks, which occur once per elapsing turn regardless of which
  player's turn it is (a hook fires for the ending player each time any player's turn ends) — this
  matches FR-4400's "total elapsed game turns" framing, not a mover's-own-turns count. Independently
  re-confirmed via `createGameEngine.wiring.test.ts`'s existing pattern (`tm.advanceTurn()` called
  once per turn regardless of active player) and via this session's own live-exercise script, which
  called `tickActiveEffects` directly at increasing `currentTurn` values and observed exactly
  one-increment-per-tick behavior.
- **FR-1420**: 60 total elapsed turns triggers timeout; tiebreak by whichever King accumulated more
  `totalDenialTurns`; a tie is a draw (`winner: null`). `GameEngine.ts`'s `TIMEOUT_TURN_CAP = 60`
  and its tiebreak comparison (`a.king.totalDenialTurns > b.king.totalDenialTurns`, else the
  reverse, else `winner: null`) match this exactly.
- **Field identity**: `EffectResolver` writes `Asset.consecutiveDenialTurns`/`.totalDenialTurns`;
  `GameEngine.checkWinConditions` reads the identical field names off `session.players[i].king` (the
  same `Asset` object, since `PlayerState.king` is a direct reference, not a copy). No adapter, no
  renamed shadow field, no drift found anywhere in the tree.

## Deviation note judgment (BL-0028/BL-0033 pattern; BL-0036)

**Note 1 — `resolveEngagement`'s added `effectorObserverState` parameter.** GDS-09
(`shared/src/interfaces.ts:66-74`, `docs/architecture/09-interface-specification.md:69`) declares
`resolveEngagement(effector: Asset, target: Asset, effect: FiveDsEffect, beliefState: BeliefState):
EngagementResult` — 4 parameters, no `currentTurn`, no `falseRegime`. Shipped
(`EffectResolver.ts:29-37`): `resolveEngagement(effectorObserverState, effector, target, effect,
beliefState, currentTurn, falseRegime?)` — 7 parameters. The package's Deviation note discloses
only the `effectorObserverState` addition. **This undercounts the actual delta**, in exactly the
same way VR-6010's Finding F1 found `applyDeception`'s note incomplete: the shipped signature also
adds (a) `currentTurn: number`, with no GDS-09 counterpart at all — needed because
`addEffectEntry`/`applyDeception` both stamp turn-numbers, which GDS-09's `resolveEngagement`
signature has no way to supply — and (b) `falseRegime?: OrbitalRegimeLabel`, needed to give the
Deceive path a false regime to present, since GDS-09's `resolveEngagement` itself has no parameter
through which a caller could specify one (GDS-09's own `applyDeception` interface takes
`falseRegime` directly, but `resolveEngagement`'s GDS-09 signature has no path to forward it).
Neither omission is disclosed. **Functionally benign** (both are genuinely required, additive, and
correctly used — confirmed by reading every call site), but the disclosure itself undercounts the
delta by two parameters, the identical category of issue VR-6010 already flagged for the sibling
`applyDeception` signature in the same GDS-09 area. Judged Low, non-blocking — see Finding F1.

**Note 2 — `TurnManager.TurnEndHook`'s added `turnNumber` parameter (BL-0036).** Read the diff
(`git show a249271 -- server/src/engine/TurnManager.ts`): `TurnEndHook` widens from `(endingPlayer:
PlayerState) => void` to `(endingPlayer: PlayerState, turnNumber: number) => void`; `advanceTurn()`
now calls `hook(ending, session.turnNumber)` instead of `hook(ending)`. This is genuinely additive
under TypeScript's structural typing: a function type with fewer parameters
(`taskAction.ts`'s `registerBeliefDecay` hook, `() => {...}`, ignoring both arguments) remains
assignable to the widened `TurnEndHook` type without modification. Independently confirmed by
running IP-1010's and IP-3010's own already-`VERIFIED` hook-consumer test files fresh:
`TurnManager.test.ts` (4/4), `deployAction.test.ts` (4/4), `taskAction.test.ts` (4/4), and
`createGameEngine.wiring.test.ts` (3/3, IP-5010's composition-root suite that exercises the
composed hook including both `tickDeployStates`/`tickManeuvers` from earlier packages) all pass
unchanged. No pre-existing hook needed editing to accommodate the widened signature — the note's
"additive, backward-compatible" claim is accurate and fully disclosed (unlike Note 1).

## Requirements audit (Requirements Covered: FR-4100, FR-4200, FR-4300, FR-4400)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-4100 (require targeting-quality data) | `EffectResolver.resolveEngagement:38-41` — rejects unless `belief?.precision === 'target'` | `EffectResolver.test.ts` "rejects engagement below target-level precision (FR-4002)" + this session's live-exercise (which requires a `'target'`-precision entry to proceed at all) | RTM row (line 35): filled, accurate | Pass |
| FR-4200 (apply the correct effect) | `EffectResolver.resolveEngagement:43-69` — `switch` dispatches Destroy/Deceive/Disrupt/Deny/Degrade to structurally distinct handling | `EffectResolver.test.ts` (Destroy, Deceive, Disrupt/Deny, Degrade cases) + this session's live-exercise (Deceive isolation, Destroy contrast) | RTM row (line 36): filled, accurate | Pass |
| FR-4300 (cumulative Degrade) | `EffectResolver.ts:63-89` — each `degrade` application is its own new `EffectStateEntry` (`addEffectEntry`), never overwrites an existing one | `EffectResolver.test.ts` "Degrade stacks cumulatively — two applications produce two independent entries" | RTM row (line 37): filled, accurate (correctly notes IP-4010 mechanism/IP-4011 content split) | Pass |
| FR-4400 (consecutive denial-turn tracking) | `EffectResolver.tickActiveEffects:96-114` — increments `consecutiveDenialTurns`/`totalDenialTurns` while `>=1` qualifying effect active, resets `consecutiveDenialTurns` to 0 otherwise; `GameEngine.checkWinConditions` consumes the 6-turn threshold | `EffectResolver.test.ts`'s 4-test denial-streak suite + `GameEngine.winConditions.test.ts` (IP-1010's own suite, cross-package) + this session's own field-identity cross-check | RTM row (line 38): filled, accurate | Pass |

`docs/requirements/04-requirements-traceability-matrix.md` rows for FR-4100/4200/4300/4400 read
directly — all already accurate; no cell required correction.

## Test run

Exact commands, run from the live working tree (root workspace):

```
npm run build
npm run test
```

`npm run build` → `tsc -b` clean in `shared`/`server`; `tsc -b && vite build` clean in `client` (29
modules, 916ms). No errors.

`npm run test` → shared: **1 passed (1)**. server: **13 files, 65 passed (65)** —
`BeliefState.tasking.test.ts` 7, `EffectResolver.test.ts` 9, `taskAction.test.ts` 4,
`deployAction.test.ts` 4, `BeliefState.fogOfWar.test.ts` 3, `createGameEngine.wiring.test.ts` 3,
`Propagator.maneuverCost.test.ts` 8, `SessionStore.test.ts` 5, `GameEngine.winConditions.test.ts` 7,
`TurnManager.test.ts` 4, `contentTemplates.test.ts` 4, `Propagator.propagation.test.ts` 3,
`TemplateRegistry.test.ts` 4. client: 0 test files, exits 0 (expected).

**Full-suite total: 66** (1 shared + 65 server) — exactly matching the package's own claim.

Additionally ran, in the live working tree, then deleted before this report (never committed):

```
npx vitest run server/src/engine/__tests__/__tmp_live_exercise.test.ts
```

1 test, passing — see Live-exercise section above for what it covers.

## Scope audit

`git show --stat a249271` (the implementing commit) touched: `server/src/engine/EffectResolver.ts`
(new, +115 — the package's declared file), `server/src/engine/__tests__/EffectResolver.test.ts`
(new, +164 — the package's declared test file), `server/src/engine/engageAction.ts` (new, +62 —
not literally named in "Files to Create," but explicitly authorized by Implementation Task 3,
"wire `resolveEngagement` into IP-1010's `handleAction` switch" — the actual mechanism is
`GameEngine.registerHandler`, the same established pattern IP-2010/IP-3010/IP-5010 already use, not
a literal in-line switch as the package's own prose describes; a wording imprecision, not a scope
excursion), `server/src/engine/TurnManager.ts` (+9/-3 — the additive `TurnEndHook` widening, also
authorized by Task 3's "wire `tickActiveEffects` into the turn-advance loop"), and
`server/src/engine/createGameEngine.ts` (+11/-4 — composing the new handler/hook, same
composition-root pattern established by IP-6010/IP-5010/IP-3010's prior wiring). Plus
documentation/traceability files (`FS-105-effect-resolution.md`, `00-master-build-plan.md`,
`packages/INDEX.md`, `IP-4010-effect-resolver.md`, `04-requirements-traceability-matrix.md`,
`docs/pipeline/backlog.md`). No excursion into `GameEngine.ts`, `BeliefState.ts`, `deployAction.ts`,
`taskAction.ts`, `maneuverAction.ts`, `Propagator.ts`, `SessionStore.ts`, or any other
already-`VERIFIED` package's core file. Matches the package's declared scope, modulo the
`engageAction.ts` naming imprecision noted above (Low, cosmetic).

## Findings

| # | Description | Severity | Owner |
|---|---|---|---|
| F1 | The Deviation note for `resolveEngagement`'s signature discloses only the added `effectorObserverState: PlayerState` parameter. The shipped signature (`effectorObserverState, effector, target, effect, beliefState, currentTurn, falseRegime?` — 7 params) also adds `currentTurn: number` (no GDS-09 counterpart) and `falseRegime?: OrbitalRegimeLabel` (no path to it in GDS-09's `resolveEngagement` signature at all), neither mentioned in the note. Both additions are functionally necessary and correctly implemented (confirmed by reading every call site and by this session's live-exercise), and both share the same root cause the note already names (GDS-09's pseudocode omits state/turn-access parameters `EffectResolver`'s real implementation needs) — this is the identical category of gap VR-6010's Finding F1 found in `applyDeception`'s note in the same GDS-09 area. Non-blocking, but the note undercounts the actual delta. | Low | `07-implementation-planning` — when reconciling BL-0028/BL-0033/BL-0036 (and this package's own deviation) against GDS-09, use `resolveEngagement`'s actual 7-parameter shipped signature as the source of truth rather than the note's undercount. No code change needed. |
| F2 | The package's own Implementation Task 3 describes wiring `resolveEngagement` into "IP-1010's `handleAction` switch (replacing the `engage`-type stub)" — the actual mechanism is `GameEngine.registerHandler('engage', ...)`, a map-based injection point (the same pattern IP-2010/IP-3010/IP-5010 already use), not a literal in-line `switch` statement. Cosmetic wording imprecision only; the wiring itself is correct and complete. | Low | `07-implementation-planning` — align future package prose with the actual `registerHandler` pattern already established by prior packages, to avoid repeating this imprecision. No code change needed. |

No other findings. Both Definition of Done items and all four Verification Checklist items are
solid; the Deceive/Destroy structural distinction was live-exercised beyond the committed test's
coverage with no leak found under repeated application and pre-populated target state; the
denial-streak arithmetic was independently cross-checked field-for-field against
`GameEngine.checkWinConditions` with no drift; the `TurnEndHook` widening was confirmed
backward-compatible by re-running IP-1010's/IP-3010's own already-`VERIFIED` hook-consumer tests;
scope stayed within the declared file set (modulo F2's cosmetic wording note).

## Ledger status applied

- `docs/implementation/00-master-build-plan.md`: IP-4010 status advanced `COMPLETE` → **`VERIFIED`**
  (VR-4010). **IP-4011** (names IP-4010 as its sole blocking dependency; IP-4011 itself is already
  `COMPLETE`, committed `c1a2bc8`, awaiting its own `09-package-verification` pass) is now the next
  checkable package. IP-7010 remains `READY` (unaffected by this VR — its dependencies are
  IP-0010/IP-1010/IP-6010, not IP-4010). IP-8010 remains `BLOCKED` (needs all 10 other packages
  `VERIFIED`; IP-4011/IP-7010/IP-8010 itself still outstanding).
- `docs/implementation/packages/INDEX.md`: IP-4010 row status advanced to `VERIFIED`, pointer to
  VR-4010 added.
- `docs/implementation/verification/INDEX.md`: row added for VR-4010.
- RTM: no cells altered — FR-4100/FR-4200/FR-4300/FR-4400 rows were already filled accurately.

**Dependency-graph check (does this VR unblock anything toward `READY`):** IP-4010 is now
`VERIFIED`. **IP-4011** names IP-4010 as its sole blocking dependency — now satisfied — but IP-4011
is already past `READY` (already `COMPLETE`, implemented concurrently ahead of IP-4010's own
verification, the same pattern already seen with IP-6010/IP-5010 landing ahead of sequencing): it
is the next package eligible for its own `09-package-verification` pass, not a `READY` flip.
IP-7010 (`READY`, unrelated dependency set) and IP-8010 (`BLOCKED`, needs all ten) are unaffected by
this VR.
