# VR-8010 — Presentation / UI

- **Owned by:** `09-package-verification` · **Date:** 2026-08-23

## Package

- **ID:** IP-8010 · **Title:** Presentation / UI · **Source:** FS-108
- **Commit verified:** `2b00437` ("feat(client): implement IP-8010, presentation/UI"). All 10
  named dependencies (IP-0010, 1010, 2010, 3010, 3011, 4010, 4011, 5010, 6010, 7010) confirmed
  `VERIFIED` in `docs/implementation/packages/INDEX.md` / the Master Build Plan at verification
  time (IP-7010's `VERIFIED` status re-confirmed via VR-7010-v2).
- **Independence:** this session performed no implementation or fix work on IP-8010 or any of its
  dependencies. Two throwaway scratch test files were written, run, and deleted before any commit
  (a full-pipeline fog-of-war leak check through `App`/`GameClient`, and a direct `AssetTray`
  render-with-real-data check) — neither is part of the tree at commit time. Independence is
  clean, no caveat needed.

## Result

**RETURNED** — one High-severity defect found by direct inspection and cross-file tracing that
none of the package's own fixtures, and no other package's verification, surfaced: there is **no
mechanism anywhere in the shipped system** — no WebSocket message type, no shared static catalog,
no other channel — by which `AssetTray`'s deployable-template data (AP cost, time-to-online) can
ever reach the running client. `main.tsx` hardcodes `deployableTemplates: []`; every test that
renders `<App>` (the only place `AssetTray` is composed in production) passes `[]` for the same
prop; `AssetTray.tsx` itself has no dedicated test file at all. `AssetTray`'s own render logic is
correct in isolation (independently confirmed by a live scratch render with real, non-empty
template data — see below), so this is not a component defect — it is a missing data-delivery
path that leaves FS-108's own Acceptance Criterion 4 / FR-8300 permanently unsatisfiable by the
shipped code, not merely "awaiting a Demonstration pass" as the package's Deviation note implies
by bundling the whole Demonstration-verified surface under a single, narrower "no CSS was
authored" framing. All other Definition-of-Done/Checklist items hold up under independent audit:
the fog-of-war rendering boundary is genuinely closed (both at the isolated-component level the
committed test already checks, and at the full `GameClient`→`App` pipeline level this session
re-derived independently with a contaminated `StateDeltaMessage`), and the legality pre-filter is
a genuine parallel implementation of the server's real coarse gates, not a stub. One further Low
finding (a genuine, previously-uncaught server-side gap in `EffectResolver`/`engageAction.ts`,
attributable to IP-4010 not IP-8010) is reported for the record. Full build/test gates are green.

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| All six panels render from a `StateDeltaMessage` fixture, initial-render and reconnect paths identical | Read `App.tsx` in full: a single render branch keyed only on `state.connectivity`/presence of `ownState`/`opponentView`/`activeTurn` — no `isReconnect`/`resume` flag anywhere in the component or in `GameClient.handleMessage`, which treats every `'state-delta'` message identically regardless of whether it is the first one received. `App.test.tsx`'s "reconnect uses the identical render path" test drives exactly this: `close()` → `connectivity-lost` → deliver a fresh full `state-delta` → same `app`/`orbital-board` testids reappear via the same code. All six `data-testid`s (`orbital-board`, `action-menu`, `asset-tray`, `mission-king-status`, `intel-panel`, `event-log`) confirmed present in `App.tsx`'s JSX and asserted in `App.test.tsx`'s first test. | **Pass** — container-level claim holds exactly as worded. |
| Pre-filter matches server legality on the fixture set; fog-of-war boundary test passes | `legalityPreFilter.test.ts` (7 tests) and `fogOfWarBoundary.test.tsx` (2 tests) both read and passing (see Test run). Independently spot-checked `computeLegalActions` against the real server logic it claims to mirror (not just its own fixtures) — see Requirements audit below for the line-by-line cross-check. Independently re-derived the fog-of-war boundary at a level above the committed test (which renders `OrbitalBoard`/`IntelPanel` directly): a scratch test drove a full `GameClient`→`App` pipeline with a `StateDeltaMessage` whose `opponentView` was contaminated with smuggled `king`/`assets`/`apRemaining` fields (a hypothetical transport-layer leak), and confirmed none of those values ever appear in `App`'s rendered `innerHTML` — the composition in `App.tsx` (only `ownState`/`opponentView`, never a `PlayerState`-shaped object, reaches any component as opponent data) holds under a more end-to-end scenario than the committed test alone exercises. | **Pass**, confirmed by both the committed suite and this session's own independent re-derivation. |
| Manual demonstration pass against the ZabOW reference's visual/UX bar — not performed, filed as BL-0039 | Confirmed no CSS/layout file exists anywhere under `client/src/` (`grep -rn "className" client/src` shows only semantic class names with no corresponding stylesheet); every component's JSX uses plain text content plus `data-testid` hooks, matching the Deviation note's description exactly for the styling half. However, the Deviation note's framing — that the *only* thing left for a Demonstration pass is visual styling — is incomplete: see Findings F1. The styling gap itself is honestly disclosed and correctly out of this Test-verification's scope (FS-108's own Verification Plan marks visual/UX correctness as Demonstration, not Test). | **Pass** as literally worded (correctly left unchecked, correctly scoped to BL-0039) — but see F1 for what the note omits. |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: build clean; G5 gate: full test suite passes (94 total claimed, later superseded by 96 per VR-7010-v2) | Rebuilt from a genuinely clean state myself: removed all `node_modules`/`dist` directories, `npm install`, then `npm run build` — `tsc -b` clean in `shared`/`server`; `tsc -b && vite build` clean in `client` (38 modules, 603ms). No errors. `npm test`: shared 1/1, server 16 files/80 tests, client 4 files/15 tests — **96 total**, matching VR-7010-v2's already-updated count exactly (not the package's own stale "94" line, which predates IP-7010's remediation commit landing 2 more tests — expected, already-tracked drift, not a new finding). | Pass |
| FS-108 Acceptance Criteria mapped to passing tests/demonstration, split Test vs. Demonstration exactly as FS-108's Verification Plan specifies | Verified each of FS-108's 5 Acceptance Criteria against the RTM's own per-FR Verification Method column (`04-requirements-traceability-matrix.md`): AC1/FR-8100 (panel set renders) — Test, `App.test.tsx`, confirmed passing. AC2/NFR-4100+4200 (pre-filter matches server legality) — Test, `legalityPreFilter.test.ts`, confirmed passing and confirmed a genuine parallel implementation (see Requirements audit). AC3/FR-8200 (own/known/unknown visual distinction) — Demonstration per RTM, but a Test-level smoke check also exists (`OrbitalBoard.test.tsx`, distinct classes/testids) and passes. AC5/FR-8500 (event log) — Demonstration per RTM; `EventLog.tsx` correctly renders `EventRecord[]` in order from already-delivered state, no test needed per RTM's own scoping, mechanically correct by inspection. **AC4/FR-8300 (cost/time-to-online shown before commit) — Demonstration per RTM, exactly as recorded — but the RTM's Demonstration scoping presumes the capability exists to be demonstrated. It does not**: no interface (GDS-09 never defines one; confirmed by `grep -n -i template docs/architecture/09-interface-specification.md` returning only an unrelated `GameEngine`-internal comment) or static shared catalog exists to deliver `AssetTemplate` data (which lives only in `server/src/content/`, never re-exported through `shared/`) to the client, and `main.tsx` hardcodes `deployableTemplates: []` with no other call site ever populating it. A Demonstration pass attempted today against the real running app would find the asset tray permanently empty — this is a functional integration gap, not an outstanding-but-eventually-checkable Demonstration item. | **Fail** — AC4/FR-8300 is not merely unverified-this-pass (like the honestly-disclosed BL-0039 styling gap); it is currently undeliverable by the shipped system regardless of who attempts the Demonstration pass. |
| No component holds or logs a raw `PlayerState` for the opponent | `grep -rn "PlayerState" client/src` re-run myself: every match is either a type import or `ownState: PlayerState` — no component ever types or destructures an opponent-facing prop as `PlayerState`; `OpponentView`/`opponentView` is the only shape any component accepts for opponent data (`OrbitalBoard.tsx`, `IntelPanel.tsx`). Independently confirmed structurally, not just by the type checker's say-so, via the scratch full-pipeline test described above (a contaminated `opponentView` object satisfying `OpponentView`'s shape but also carrying `PlayerState`-only fields never leaks through `App`'s rendered output). | Pass |

## Requirements audit (Requirements Covered)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-8100 (render the panel set) | `App.tsx` composes all six components | `App.test.tsx` | RTM row filled, accurate | Pass |
| FR-8200 (visual distinction of contact types) | `OrbitalBoard.tsx` (`contact--own`/`contact--known`/`contact--{precision}` classes, no shared CSS behind them yet — BL-0039) | `OrbitalBoard.test.tsx` (class/testid smoke check); Demonstration is FS-108's/RTM's primary method | RTM row filled, correctly marked Demonstration-primary | Pass |
| FR-8300 (cost/time-to-online shown before commit) | `AssetTray.tsx` (component logic correct — independently re-verified live with a scratch render supplying real `[{templateId:'cheap',apCost:1,...},{templateId:'expensive',apCost:5,...}]` data: affordable button enabled, unaffordable disabled with a `title` stating the exact AP shortfall, cost/time text both present) | **No test anywhere renders `AssetTray` with non-empty data** (`App.test.tsx` only ever passes `deployableTemplates={[]}`; no `AssetTray.test.tsx` exists) — consistent with RTM's Demonstration-primary marking, but the demonstration itself is currently impossible end-to-end (see Findings F1) | RTM row correctly marks this Demonstration-primary, but doesn't flag that the demonstrable capability doesn't yet exist in the running system | **Fail** — see F1 |
| FR-8400 (current AP always visible) | `MissionKingStatus.tsx` (`ap-remaining` testid, sourced directly from `ownState.apRemaining`, itself sourced from every `StateDeltaMessage`) | Rendered and asserted present via `App.test.tsx`'s panel-presence check; content is mechanically correct by inspection (no requirement for a dedicated content test — FR-8400 has no RTM row of its own beyond FR-8100's coverage) | RTM row filled | Pass |
| FR-8500 (visible event log) | `EventLog.tsx` appends `eventLog` entries in array order, one per `StateDeltaMessage.eventLogEntry` | `GameClient.handleMessage` (`gameClient.ts:79`) correctly appends rather than replaces; Demonstration-primary per RTM, mechanically correct by inspection | RTM row filled | Pass |
| NFR-4100 (UI as rules reference) | `legalityPreFilter.ts` | `legalityPreFilter.test.ts` (7 tests) | RTM row filled | Pass |
| NFR-4200 (no post-hoc rejection under normal play) | `legalityPreFilter.ts`'s coarse gates cross-checked line-by-line against the real server code they claim to mirror: turn gate matches `TurnManager.submitAction`'s `actingPlayer !== session.activeTurn` check; AP gate matches `TurnManager.spendAP`'s `apRemaining < cost`; online gate (`isOnline`, `asset.deployState === null`) matches `assertOnline` in `deployAction.ts` exactly; maneuver's "no online, non-maneuvering asset" gate matches `Propagator.planManeuver`'s `asset.maneuverState !== null` rejection (BL-0014) exactly; task's sensor-role gate (`SENSOR_ROLES = find/fix/track/target`) matches `hasSensorCapability`/`capabilityCeiling` in `BeliefState.ts` exactly (same four roles, same "any" semantics). One real mismatch found: the `engage` category's `hasEngageRole` gate (`chainRoles.includes('engage')`) has **no server-side equivalent** — `engageAction.ts`/`EffectResolver.resolveEngagement` never check the effector's `chainRoles` at all, gating only on belief precision. The client is *more* restrictive than the server here, not less — see Findings F2; this is a genuine cross-package gap but does not itself cause a post-hoc rejection (NFR-4200's actual concern), since the client never shows `engage` as legal when the server would actually reject it — only the reverse (hiding a category the server would in fact currently accept). | `legalityPreFilter.test.ts` | RTM row filled | Pass for NFR-4200 as literally worded (no post-hoc rejection introduced); F2 filed separately |
| NFR-7100 (browser targets) | React + Vite, ADR-0001's standard evergreen-browser build target, no non-baseline API usage found in `client/src` | Not independently tested (RTM already notes this) | RTM row filled, accurately noting "not independently tested" | Pass (unchanged from RTM's own honest scoping) |

## Test run

Rebuilt from a genuinely clean state (all `node_modules`/`dist` removed, fresh `npm install`) to
avoid trusting any pre-existing build artifact:

```
npm run build
```
→ `tsc -b` clean in `shared`; `tsc -b` clean in `server`; `tsc -b && vite build` clean in `client`
(38 modules transformed, built in 603ms). No errors.

```
npm test
```
→ shared: **1 passed (1)**. server: **16 files, 80 passed (80)**. client: **4 files, 15 passed
(15)** (`legalityPreFilter.test.ts` 7, `fogOfWarBoundary.test.tsx` 2, `App.test.tsx` 4,
`OrbitalBoard.test.tsx` 2). **Full-suite total: 96** — matches VR-7010-v2's already-current count
exactly (the package's own package-file "94" line predates IP-7010's remediation commit landing 2
more tests; already-tracked, expected drift, not a new finding).

Two scratch test files (not committed) were written and run to independently re-derive claims
beyond the committed suite, then deleted:
1. A full `GameClient`→`App` pipeline test delivering a `StateDeltaMessage` whose `opponentView`
   was deliberately contaminated with smuggled `king`/`assets`/`apRemaining` fields — confirmed
   none of the smuggled values ever appear in `App`'s rendered `innerHTML`. Passed.
2. A direct `AssetTray` render with real, non-empty, non-default template data (one affordable,
   one unaffordable given `apRemaining: 2`) — confirmed the disabled state, the exact AP-shortfall
   reason text, and the cost/time text all render correctly. Passed — this isolates the AssetTray
   defect to "no data ever reaches the component in production," not "the component is broken."

## Scope audit

No code, package, spec, or requirement was edited by this verification session. The two scratch
test files above were deleted before any commit; `git status` at the end of this session shows no
changes to `client/src/`, `server/src/`, or `shared/src/`.

## Findings

| # | Description | Severity | Recommended owner |
|---|---|---|---|
| F1 | No message type, interface, or static shared catalog exists anywhere in the codebase to deliver `AssetTemplate` data (AP cost, time-to-online) from server to client. `AssetTemplate`/the content JSON files live only in `server/src/content/`/`TemplateRegistry`, never re-exported through `shared/`; GDS-09's interface specification never defines a template-catalog message; `main.tsx` hardcodes `deployableTemplates: []`; no test anywhere renders `AssetTray` with non-empty data. FS-108 itself states "Interfaces Used: ... No new interface," so the omission traces back to the spec, not solely the implementation — but IP-8010's own Deviation note discloses only the CSS/styling gap (BL-0039) and does not disclose this deeper, functional gap, leaving the false impression that a Demonstration pass is all that's pending for every Demonstration-scoped Acceptance Criterion. As shipped, FS-108 AC4/FR-8300 cannot be satisfied by the running application under any circumstances, independent of BL-0038 (the separately-tracked missing WebSocket bootstrap). | **High** | `07-implementation-planning` (needs a new interface decision — e.g. a `TemplateCatalogMessage` or embedding a template summary in `StateDeltaMessage`/a static shared-package export — before `08-code-implementation` can wire it and before any Demonstration pass on AC4/FR-8300 is even attemptable) |
| F2 | `engageAction.ts`/`EffectResolver.resolveEngagement` never check that the effector asset's `chainRoles` includes `'engage'` — only belief precision is checked. The client's `legalityPreFilter.ts` does gate the `engage` action category on `hasEngageRole` (chainRoles includes `'engage'`), which is stricter than the actual server behavior today. This is not an IP-8010 defect (the client-side gate matches the evident design intent of the `engage` chain role GDS-04/`shared/src/types.ts` define, and being stricter than the server only ever hides a category the server would still currently accept — it cannot cause NFR-4200's "shown legal, then rejected" failure mode). It is a genuine, previously-uncaught gap in IP-4010's own scope (already `VERIFIED` via VR-4010, which did not check this), filed here for the record since it surfaced during this session's cross-check of the pre-filter against real server logic. | Low | `08-code-implementation`/`07-implementation-planning` (IP-4010's own scope, or a future `10-integration-review` note) |

## Deviation note re-check

BL-0039 (no CSS/visual styling authored) is confirmed accurate and honestly scoped as far as it
goes — FS-108's own Verification Plan genuinely treats visual/UX correctness as Demonstration, not
Test, and this package correctly leaves that DoD item unchecked rather than claiming it. What the
Deviation note does not disclose is F1 above: a *different*, non-cosmetic gap that also blocks a
Demonstration-scoped Acceptance Criterion (AC4/FR-8300), for a reason unrelated to missing CSS.

## Recommendation

Route back to `08-code-implementation` is not the correct next step by itself, since F1's root
cause is a missing interface decision that FS-108 itself never made — recommend `07-implementation-
planning` first decide the template-delivery mechanism (new message type vs. shared static
catalog), updating FS-108/GDS-09 if needed, then `08-code-implementation` wires it into
`main.tsx`/`gameClient.ts` and adds the missing `AssetTray` test coverage, before this package is
resubmitted for a fresh `09-package-verification` pass.
