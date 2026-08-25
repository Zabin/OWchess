# VR-3010 — Asset Roster: Template Registration & Deploy Lifecycle

- **Owned by:** `09-package-verification` · **Date:** 2026-08-22

## Package

- **ID:** IP-3010 · **Title:** Asset Roster: Registration & Deploy Lifecycle · **Source:** FS-102
  (engine portion)
- **Commit verified:** `f85537c` ("feat(engine): implement IP-3010, asset roster registration &
  deploy lifecycle"). Also present in the tree at verification time: `bfeed3c` (IP-3011, COMPLETE,
  not yet VERIFIED — content templates that load against this package's `TemplateRegistry`,
  checked below for schema compatibility) and a later `feat(engine): implement IP-2010` commit
  (COMPLETE, not yet VERIFIED — consumes `assertOnline`/`registerTurnEndHook`, checked below for
  interaction). Dependencies IP-0010 and IP-1010 are both `VERIFIED` (VR-0010; VR-1010-v2 — the
  latter supersedes the original, RETURNED VR-1010 for status purposes).
- **Independence:** this session performed no implementation work on IP-3010 — commit `f85537c`
  predates this session entirely; this session's only actions were read-only inspection plus the
  ledger/report writes this skill is authorized to make. Independence is clean, no caveat needed.

## Result

**VERIFIED** — every Definition of Done and Verification Checklist item has direct evidence in
the current tree; both disclosed deviations (reuse of GDS-07's existing `deployState.
turnsUntilOnline` field, and the additive `TurnManager.registerTurnEndHook` extension filed as
BL-0022) are accurate as described and reasonable engineering choices, judged against VR-1010's
BL-0021 model. Full suite green (38 tests). One Low, non-blocking finding recorded (F1: the
`tickDeployStates` tick function is never actually registered via `registerTurnEndHook` anywhere
in the current tree — but this matches the identical, currently-unwired state of every other
handler/hook in the codebase, since no server bootstrap exists yet; not an IP-3010-specific gap).

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| Deploy action enforces AP cost and unlimited-bounded-only-by-AP quantity (BL-0013) | `deployAction.ts:37` (`tm.spendAP(actingPlayer, template.apCost)`, rejects via `TurnManager.spendAP`'s own insufficient-AP path) with an explicit code comment citing BL-0013 (no per-template cap check anywhere in `makeDeployHandler`). `deployAction.test.ts` "rejects deploy on insufficient AP, with no cap otherwise (BL-0013)" — passing. | Pass |
| Deploy-state lifecycle (`deployState.turnsUntilOnline`) correct for ground and space variants | `deployAction.ts:47` sets `deployState: template.timeToOnline > 0 ? { turnsUntilOnline: template.timeToOnline } : null` at creation; `tickDeployStates` (`:66-74`) decrements and clears at zero. `deployAction.test.ts` "computes onlineAt/turnsUntilOnline correctly for ground vs. space (FR-3300)" asserts `turnsUntilOnline` = 1 for a ground template and 3 for a space template from two genuinely different fixture values (not a single default) — passing. Cross-checked against real content: `contentTemplates.test.ts` "reflects the ground/space cost-time asymmetry across the roster (FR-3300)" independently asserts `timeToOnline <= 1` for every ground asset type and `>= 3` for every space asset type across all 7 real IP-3011 templates — passing, confirming the asymmetry holds beyond the two synthetic test fixtures. | Pass |
| Pre-online use blocked via the shared `assertOnline` helper | `deployAction.ts:12-17`: `assertOnline` returns `{ ok: false, reason: 'asset is not yet online' }` while `deployState !== null`, `{ ok: true }` once cleared. `deployAction.test.ts` "blocks a pre-online asset from use via assertOnline (FR-3500)" deploys a space asset, confirms `assertOnline(...).ok === false`, ticks it down exactly 3 times (its own `timeToOnline`), confirms `deployState` is now `null` and `assertOnline(...).ok === true` — passing. Confirmed a second, independent real consumer: `taskAction.ts:33` (IP-2010) calls the exact same `assertOnline` import and rejects with its `reason` before spending AP — not reimplemented, genuinely shared. | Pass |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: build clean | Ran myself from repo root: `npm run build` → `tsc -b` clean in `shared`, `server`; `tsc -b && vite build` clean in `client` (29 modules, 1.01s). No errors. | Pass |
| G5 gate: full test suite passes | Ran myself: `npm test` → shared **1/1**; server **8 files, 37/37** (`BeliefState.tasking.test.ts` 7, `SessionStore.test.ts` 5, `deployAction.test.ts` 4, `GameEngine.winConditions.test.ts` 7, `taskAction.test.ts` 2, `contentTemplates.test.ts` 4, `TurnManager.test.ts` 4, `TemplateRegistry.test.ts` 4); client 0 test files (expected). **Full-suite total: 38.** The package's own claimed count ("24 tests total: 1 shared + 23 server, including this package's 8") is stale — IP-2010 (`taskAction.test.ts`, `BeliefState.tasking.test.ts`) landed on the branch after IP-3010 was implemented, growing the suite from 24 to 38. This package's own 8 tests (`TemplateRegistry.test.ts` ×4, `deployAction.test.ts` ×4) are unaffected and still exactly 8 of the 38 — the drift is expected growth from later packages, not a defect in this package's own claim at the time it was written (consistent with how VR-1010-v2 treated the same kind of drift for IP-1010). | Pass |
| FS-102 Acceptance Criteria mapped to passing tests | AC1 (all templates registered/selectable) → `contentTemplates.test.ts` "loads and schema-validates every asset-type and mission-set template" (IP-3011's real content against this package's schema). AC2 (deploy deducts AP cost, sets time-to-online) → `deployAction.test.ts` "deploys successfully..." AC3 (usable exactly after N owner-turns) → `deployAction.test.ts` "blocks a pre-online asset..." (ticks exactly `timeToOnline` times, confirms boundary). AC4 (not-yet-online action rejected) → same test, `assertOnline` assertion; cross-confirmed by `taskAction.ts`'s real consumption. AC5 (new template requires no engine-module change) → `TemplateRegistry.ts`/`loadContent.ts` structurally: `loadContent.ts`'s own doc comment states it is "the one place this package [IP-3011] is allowed to touch engine code," and IP-3011's commit (per its own scope) touches no `GameEngine`/`Propagator`/`BeliefState`/`EffectResolver` file — verified by inspection, consistent with NFR-5100's own Verification Method (Inspection). | Pass |
| Open item: `TemplateRegistry`'s schema matches exactly the fields IP-3011's data templates need — left open pending IP-3011 | IP-3011 has since landed (COMPLETE). `contentTemplates.test.ts` "loads and schema-validates every asset-type and mission-set template" loads all 7 real asset-type JSON files and all 3 real mission-set JSON files through `TemplateRegistry.registerAssetTemplate`/`registerMissionSetTemplate` with no thrown validation error — passing. Read 2 representative content files (`wide-area-sda-radar.json`, `satcom.json`) directly: field shapes (`templateId`, `basing`, `apCost`, `timeToOnline`, `chainRoles`, `regimeAffinity` / `missionSetId`, `assetTypeIds`, `kingRegimeAffinity`) match `AssetTemplate`/`MissionSetTemplate` exactly, no extra or missing required field. **This item is now independently confirmed true**, not merely left open — checked here since IP-3011 exists in the tree, though IP-3011's own package remains a separate, not-yet-verified unit and this VR does not advance its status. | **Pass — now confirmed** (was open at authoring time; genuinely resolved) |

## Requirements audit (Requirements Covered)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-3100 (data-driven asset templates) | `TemplateRegistry.ts` (schema/validation) | `contentTemplates.test.ts` | RTM row: FS-102, IP-3010 (schema)/IP-3011 (content), `contentTemplates.test.ts` — filled, accurate | Pass |
| FR-3200 (v1 roster support) | Content templates (IP-3011), validated by IP-3010's schema | `contentTemplates.test.ts` | RTM row: FS-102, IP-3011, `contentTemplates.test.ts` — filled, accurate (correctly attributes this one to IP-3011, not IP-3010) | Pass |
| FR-3300 (ground/space cost-time asymmetry) | `deployAction.ts` (mechanism: sets `turnsUntilOnline` from `template.timeToOnline`) | `deployAction.test.ts` (ground-vs-space case) + `contentTemplates.test.ts` (real-roster asymmetry check) | RTM row: FS-102, IP-3010 (mechanism), `deployAction.test.ts` — filled, accurate | Pass |
| FR-3400 (deploy with cost deduction) | `deployAction.ts` (`makeDeployHandler`) | `deployAction.test.ts` | RTM row: FS-102, IP-3010, `deployAction.test.ts` — filled, accurate | Pass |
| FR-3500 (block pre-online use) | `deployAction.ts` (`assertOnline`) | `deployAction.test.ts` (assertOnline case); cross-confirmed live in `taskAction.ts` | RTM row: FS-102, IP-3010, `deployAction.test.ts` — filled, accurate | Pass |
| NFR-5100 (data-driven content, no code changes) | `TemplateRegistry.ts` (schema) + `loadContent.ts` (IP-3011's sole engine-touching hook, as designed) | `contentTemplates.test.ts` | RTM row: FS-102, IP-3010 (schema)/IP-3011 (content), `contentTemplates.test.ts` — filled, accurate | Pass |
| NFR-9200 (roster expansion readiness) | `TemplateRegistry.ts` (`Map`-keyed registry, `register*`/`get*` API, no roster-size assumption anywhere in `TemplateRegistry.ts` or `deployAction.ts`) | `TemplateRegistry.test.ts` | RTM row: FS-102, IP-3010 (schema), `TemplateRegistry.test.ts` — filled, accurate | Pass |

No RTM cell needed correction — all seven rows were already filled accurately by the implementing
commit; this audit confirms, does not correct.

## Test run

Exact commands run by this verification session, from repo root, on the container's installed
Node/npm (`node_modules` already present, `npm install` not needed):

```
npm run build
```
→ `tsc -b` clean in `shared`; `tsc -b` clean in `server`; `tsc -b && vite build` clean in `client`
(29 modules transformed, built in 1.01s). No errors, no warnings.

```
npm test
```
→ shared: **1 passed (1)**. server: **8 files, 37 passed (37)** — `BeliefState.tasking.test.ts` 7,
`SessionStore.test.ts` 5, `deployAction.test.ts` 4, `GameEngine.winConditions.test.ts` 7,
`taskAction.test.ts` 2, `contentTemplates.test.ts` 4, `TurnManager.test.ts` 4,
`TemplateRegistry.test.ts` 4. client: 0 test files, exits 0 (expected, no client tests exist yet).

**Full-suite total: 38** (1 shared + 37 server). This package's own tests: 8
(`TemplateRegistry.test.ts` 4 + `deployAction.test.ts` 4).

**Tunable/scenario-dependent parameter check:** this package's DoD hinges on the ground-vs-space
`timeToOnline` asymmetry — exactly the kind of parameter the skill's gotcha warns about (a fixture
that might default to one fixed value and mask a range that misbehaves elsewhere). `deployAction.
test.ts`'s own fixture already exercises two genuinely different values (1 and 3, not one value
reused); additionally I independently checked `contentTemplates.test.ts`'s roster-wide assertion
against all 7 real production templates (ground ≤1, space ≥3) — this is the real, non-default
data every one of IP-3011's actual mission sets ships, not merely a synthetic test fixture, and it
passes. I also read `tickDeployStates`'s decrement/clear logic directly and manually traced a
3-turn countdown (3→2→1→0→cleared) against the space fixture's assertion boundary — matches.

## Scope audit

`git show --stat f85537c` (the implementing commit) touched exactly: `TemplateRegistry.ts`,
`deployAction.ts`, `TemplateRegistry.test.ts`, `deployAction.test.ts` (the package's declared
"Files to Create"), plus `TurnManager.ts` (the disclosed BL-0022 additive excursion) and
documentation files (the package itself, FS-102's Implemented-by line, Master Build Plan,
`packages/INDEX.md`, backlog, RTM). No other production file. `git show f85537c -- server/src/
engine/TurnManager.ts` confirms the diff is purely additive: a new `TurnEndHook` type, a new
private `turnEndHooks` array, a new public `registerTurnEndHook` method, and a two-line insertion
in `advanceTurn` that iterates and calls those hooks — the pre-existing `activePlayer`/
`apRemaining`/`submitAction`/`spendAP` methods and `advanceTurn`'s own active-player-flip logic are
byte-identical in control flow (`next = ... ? b : a` becomes `ending = ... ? a : b; next = ending
=== a ? b : a`, the same result computed via an intermediate variable so it can be passed to the
hooks). `TurnManager.test.ts` (IP-1010's own 4 tests, unmodified) still passes in the current run,
confirming no regression to IP-1010's already-verified behavior. Separately confirmed
`shared/src/types.ts` (also IP-1010-owned) was **not touched at all** by `f85537c` — the
`deployState`/`turnsUntilOnline` field the package uses was already present, transcribed from
GDS-07 by an earlier package, exactly as the Deviation note claims. No scope violation.

## Deviation note judgment

Two deviations disclosed in the package's own Deviation note, judged against VR-1010's BL-0021
model (does the deviation solve a real problem, is it disclosed accurately, is it the
lowest-footprint option, and does it avoid corrupting already-verified work):

**Deviation 1 — reused `deployState.turnsUntilOnline` instead of a new `onlineAt` field.**
Read `docs/architecture/07-data-model.md:47-48` directly: GDS-07 already specifies `deployState:
{ turnsUntilOnline: integer } | null` verbatim — this is not a retroactive justification, the
field genuinely predates IP-3010 (transcribed into `shared/src/types.ts` by an earlier package,
confirmed untouched by this commit per the Scope audit above). Using the field GDS-07 already
named, instead of inventing a parallel `onlineAt` absolute-turn field the package's own prose
happened to describe first, is the correct call: it avoids a second field carrying the same
information in a different shape, and a countdown (`turnsUntilOnline`) composes more naturally
with `tickDeployStates`'s per-turn decrement than an absolute turn number would (no need to also
thread "current turn number" through every call site — `assertOnline`'s signature even still
accepts an unused `_currentTurn` parameter, a harmless vestige of the original design that could
be dropped in a future cleanup pass but changes nothing about correctness). Reasonable, and
accurately disclosed — no overstatement comparable to VR-1010's F3 finding on BL-0021.

**Deviation 2 — `TurnManager.registerTurnEndHook`, filed as BL-0022.** Real problem: decrementing
a per-asset countdown on every turn-advance needs a hook into the turn-advance loop, and
`TurnManager` (IP-1010) didn't expose one. The alternative — duplicating turn-tracking/advance
logic inside `deployAction.ts`, or having `TurnManager` import `deployAction` directly — would
either violate "the ONLY place out-of-turn rejection happens" (`TurnManager`'s own header comment)
or create a reverse-layering dependency (foundational `TurnManager` importing a downstream
package's module). A generic, additive `registerTurnEndHook`/callback-list mechanism is the
lower-footprint, more generalizable choice, and it has already paid for itself: IP-2010's
`taskAction.ts` independently uses the exact same mechanism (`registerBeliefDecay`) for an
unrelated purpose (belief-state decay), confirming this is a real, reusable seam and not
speculative generality invented to justify touching a file outside IP-3010's declared set. Filed
as BL-0022 with an accurate description (matches the actual diff, per the Scope audit); disclosure
is honest about the excursion rather than silently absorbing it. Reasonable and properly
disclosed.

Both deviations meet the bar VR-1010 applied to BL-0021: genuine problem, disclosed accurately (no
overstatement of the kind VR-1010's F3 caught), minimal-footprint fix, no corruption of
already-verified IP-1010 behavior.

## Findings

| # | Description | Severity | Owner |
|---|---|---|---|
| F1 | `tickDeployStates` (the function that actually decrements `turnsUntilOnline`) is never registered via `TurnManager.registerTurnEndHook` anywhere in production code — only exercised directly by `deployAction.test.ts`. By contrast, IP-2010's `taskAction.ts` ships its own wrapper (`registerBeliefDecay`) that itself calls `tm.registerTurnEndHook(...)`; IP-3010 has no equivalent `registerDeployTick`-style wrapper, leaving that wiring step to whatever future package assembles a real server bootstrap. This matches the current, identical state of every other handler in the codebase (`server/src/index.ts` is still "scaffold only," per its own header comment — no production code anywhere calls `engine.registerHandler` or wires any turn-end hook outside a test), so it is not an IP-3010-specific regression or an unmet DoD item; it is a project-wide, expected gap pending the transport/bootstrap package (IP-7010 or later). | Low | `07-implementation-planning` — note in IP-7010 (or whichever package first assembles a real server bootstrap) that it must wire both `engine.registerHandler('deploy', ...)` and `tm.registerTurnEndHook(() => tickDeployStates(...))` for the deploy lifecycle to function outside tests; consider whether IP-3010's asymmetry with IP-2010's self-wiring `registerBeliefDecay` pattern is worth a one-line convenience export (`registerDeployTick`) for consistency, non-blocking either way. |

No other findings. Both disclosed deviations hold up under independent scrutiny; no unchecked DoD
item; no failing test; no scope violation beyond the disclosed, reasonable excursion.

## Ledger status applied

- `docs/implementation/00-master-build-plan.md`: IP-3010 status → **`VERIFIED`** (2026-08-22,
  VR-3010), pointer added; "Next action" and prose updated.
- `docs/implementation/packages/INDEX.md`: IP-3010 status → `VERIFIED`.
- `docs/implementation/verification/INDEX.md`: row added for VR-3010.
- RTM: no cells altered — all seven audited rows (FR-3100/3200/3300/3400/3500, NFR-5100/9200) were
  already filled accurately by the implementing commit; confirming, not correcting.

**Dependency-graph check (does this VR unblock anything toward `READY`):** IP-3010's own
dependents per the Master Build Plan's ledger are IP-3011 (blocking dependency: IP-3010 alone),
and IP-2010/IP-5010 (blocking dependencies: IP-0010, IP-1010, IP-3010, **and IP-3011**). IP-3011
is already `COMPLETE` (not `BLOCKED`) so there is no `BLOCKED→READY` flip to make for it from this
VR alone — but it is now unblocked to receive its own `09-package-verification` pass, since its
sole named blocking dependency (IP-3010) is now `VERIFIED`. IP-2010 and IP-5010 remain `COMPLETE`/
`BLOCKED` respectively and do **not** flip to `READY`: both still name IP-3011 as a blocking
dependency, and IP-3011 is `COMPLETE`, not yet `VERIFIED`. **No package flips to `READY` from this
VR alone** — IP-3011 becomes the next checkable package (its dependency is now satisfied), and
IP-2010/IP-5010 remain gated on IP-3011's own verification.
