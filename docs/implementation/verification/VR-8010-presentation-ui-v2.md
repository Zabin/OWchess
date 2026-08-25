# VR-8010-v2 — Presentation / UI (re-verification)

- **Owned by:** `09-package-verification` · **Date:** 2026-08-23

## Package

- **ID:** IP-8010 · **Title:** Presentation / UI · **Source:** FS-108
- **Commit verified:** `c734272` ("fix(client,transport): IP-8010 remediation for VR-8010's High
  finding"). All 10 named dependencies (IP-0010, 1010, 2010, 3010, 3011, 4010, 4011, 5010, 6010,
  7010) re-confirmed `VERIFIED` in `docs/implementation/packages/INDEX.md` /
  `00-master-build-plan.md` at verification time — no drift found (see Final sanity check below).
- **Independence:** this session performed no implementation or fix work on IP-8010, its
  dependencies, or the remediation commit. One scratch test file
  (`server/src/transport/__tests__/zzz-vr8010v2-scratch.test.ts`) was written, run, and deleted
  before any commit — never part of the tree at commit time; `git status` confirms no residue.
  Independence is clean, no caveat needed.

## Result

**VERIFIED** — the remediation genuinely closes VR-8010's High finding (F1/BL-0048). This session
independently re-derived the fix beyond the committed `AssetTray.test.tsx`: a live exercise driving
the real `createGameEngine()` → `createTransport()` → `handleConnection()` path (not a hand-built
message or a mocked registry) confirms a genuine `TemplateCatalogMessage` is sent exactly once per
connection, built from `TemplateRegistry.listAssetTemplates()`, and carries all 7 of IP-3011's real
asset-type templates (`ew-jamming-effector`, `ground-tracking-array`, `kinetic-rpo-effector`,
`optical-imaging-sensor-ground`, `optical-imaging-sensor-space`, `space-based-sda-sensor`,
`wide-area-sda-radar`) read from the actual JSON content files on disk — not a fixture. Both
connections in the same session receive byte-identical catalogs (no per-recipient filtering or
duplication), and a subsequent `broadcastStateDelta` (triggered by a real `pass` action) sends no
further catalog message to either connection, confirming the "once per connection, not on every
push" design intent is actually implemented, not just documented. `AssetTray.test.tsx`'s three
claims (affordable-enabled, unaffordable-disabled-with-reason, catalog survives a subsequent
state-delta) were independently re-derived by reading `gameClient.ts`'s `handleMessage` object-spread
order line by line: the `'state-delta'` branch spreads `...this.state` and overwrites only
`ownState`/`opponentView`/`activeTurn`/`eventLog`/`connectivity`/`lastRejection` — `deployableTemplates`
is never named in that branch, so no ordering bug can silently drop it. F2/BL-0049 remains correctly
out of this package's scope (IP-4010's own gap, not re-litigated here). Full build/test gates are
green from a genuinely clean rebuild.

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| F1 fixed: `TemplateCatalogMessage` sent once per connection, correctly populates `AssetTray` with real, non-empty, non-default data; `AssetTray.test.tsx` (2 tests) passes | Read `websocketServer.ts`'s `handleConnection` (lines 94–125): builds `catalog` from `templateRegistry.listAssetTemplates()` and calls `conn.send(...)` immediately after `registry.register(...)`, before `broadcastToOne`. Re-ran `AssetTray.test.tsx` in isolation (`npx vitest run src/__tests__/AssetTray.test.tsx` from `client/`) — 2/2 pass. Independently went further: constructed a scratch test through the **real** `createTransport`/`handleConnection`/`createGameEngine` path (not `<App>` + a hand-built message) — confirmed a genuine, non-empty, 7-template catalog reaches both connections, matches `ctx.registry.listAssetTemplates()` exactly, and the 7 ids match IP-3011's actual `server/src/content/assetTypes/*.json` filenames/`templateId`s. | **Pass** |
| Full G5 gate (build + full suite) re-run green after the fix: 98 tests total (1 shared + 80 server + 17 client) | Rebuilt from a genuinely clean state: removed all `node_modules`/`dist`, fresh `npm install`, `npm run build` (tsc -b clean in `shared`/`server`; `tsc -b && vite build` clean in `client`, 38 modules, 615ms). `npm test`: shared 1/1, server 16 files/80 tests, client 5 files/17 tests (`legalityPreFilter.test.ts` 7, `AssetTray.test.tsx` 2, `App.test.tsx` 4, `fogOfWarBoundary.test.tsx` 2, `OrbitalBoard.test.tsx` 2). **98 total**, matching the package's claim exactly. | **Pass** |

(Both items above are new relative to the original VR-8010 audit; the previously-`Pass`-audited
items — panel render/reconnect identity, legality pre-filter, fog-of-war boundary — are unaffected
by this remediation's diff and were spot-re-confirmed, not re-proven from scratch, per the
package's own "Verification Checklist addition" note.)

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: build clean; full suite passes (98 total) | See above. | Pass |
| FS-108 Acceptance Criteria mapped to passing tests/demonstration, split Test vs. Demonstration | **AC4/FR-8300 (cost/time-to-online shown before commit)** — previously `Fail` in VR-8010 because the capability didn't exist to demonstrate. Now: the data-delivery path is real (confirmed above), and `AssetTray.test.tsx` exercises the Test-verifiable half (cost/time text, disabled-with-reason) with real template data delivered through the actual `GameClient`/`App` composition, not a frozen prop. The visual/UX Demonstration half (CSS/layout) remains correctly out of scope, per BL-0039 — unchanged, still honestly disclosed. AC1/AC2/AC3/AC5 unaffected by this diff, re-confirmed unchanged (`App.test.tsx`, `legalityPreFilter.test.ts`, `OrbitalBoard.test.tsx` all still pass, files otherwise untouched by commit `c734272` except the 3 prop-removal edits in `App.test.tsx`, read and confirmed to be a mechanical no-op — same fixtures, same assertions, only the removed `deployableTemplates={[]}` argument). | **Pass** |
| No component holds or logs a raw `PlayerState` for the opponent | Re-ran `grep -rn "PlayerState" client/src` — unchanged from VR-8010's finding: every match is `ownState: PlayerState` or a type import; `gameClient.ts`'s new `AssetTemplate` import/field does not touch `PlayerState` at all. | Pass |

## Requirements audit (Requirements Covered)

| Req | Where implemented | Where tested | RTM cell | Result |
|---|---|---|---|---|
| FR-8100 (render the panel set) | `App.tsx` | `App.test.tsx` | Unchanged, filled | Pass |
| FR-8200 (visual distinction) | `OrbitalBoard.tsx` | `OrbitalBoard.test.tsx` | Unchanged, filled | Pass |
| **FR-8300 (cost/time-to-online shown before commit)** | `AssetTray.tsx` (unchanged component logic) fed by `App.tsx`'s `state.deployableTemplates` (now read reactively from `GameClient`'s subscription, not a frozen prop) fed by `gameClient.ts`'s new `'template-catalog'` handler, fed by `websocketServer.ts`'s `handleConnection`, fed by `TemplateRegistry.listAssetTemplates()`, fed by IP-3011's real JSON content | `AssetTray.test.tsx` (2 tests, independently re-run and re-derived — see Definition of Done audit); `websocketServer.test.ts`'s new first test (`aliceConn.sent` has `template-catalog` at index 0); this session's own scratch live-exercise test through the real transport | RTM row updated in commit `c734272` — read and confirmed accurate: "`AssetTray.tsx`, `AssetTray.test.tsx` (BL-0048 fix — data now genuinely delivered via `TemplateCatalogMessage`); Demonstration-primary per FS-108 for the visual bar" — this correctly distinguishes "data delivery is now Test-verified" from "visual polish is still Demonstration-pending" | **Pass** — F1 genuinely closed |
| FR-8400 (AP always visible) | `MissionKingStatus.tsx` | `App.test.tsx` | Unchanged, filled | Pass |
| FR-8500 (event log) | `EventLog.tsx` | `App.test.tsx`/inspection | Unchanged, filled | Pass |
| NFR-4100 (UI as rules reference) | `legalityPreFilter.ts` | `legalityPreFilter.test.ts` | Unchanged, filled | Pass |
| NFR-4200 (no post-hoc rejection) | `legalityPreFilter.ts` | `legalityPreFilter.test.ts` | Unchanged, filled (F2/BL-0049 remains a separate, IP-4010-scope finding, not re-litigated here) | Pass |
| NFR-7100 (browser targets) | React + Vite | Not independently tested (unchanged, already honestly scoped) | Unchanged | Pass |

## Test run

Rebuilt from a genuinely clean state (all `node_modules`/`dist` removed, fresh `npm install`):

```
npm run build
```
→ `tsc -b` clean in `shared`; `tsc -b` clean in `server`; `tsc -b && vite build` clean in `client`
(38 modules transformed, 615ms). No errors.

```
npm test
```
→ shared: **1 passed (1)**. server: **16 files, 80 passed (80)**. client: **5 files, 17 passed
(17)** (`legalityPreFilter.test.ts` 7, `AssetTray.test.tsx` 2, `App.test.tsx` 4,
`fogOfWarBoundary.test.tsx` 2, `OrbitalBoard.test.tsx` 2). **Full-suite total: 98** — matches the
package's own claim exactly.

One scratch test file (not committed) was written, run, and deleted to independently re-derive the
fix beyond the committed suite:

- `server/src/transport/__tests__/zzz-vr8010v2-scratch.test.ts` — drove the real
  `createGameEngine()` → `createTransport()` → `handleConnection()` path with two `FakeConnection`s
  (the same interface `websocketServer.test.ts` itself uses, not a hand-rolled substitute).
  Confirmed: (a) `ctx.registry.listAssetTemplates()` returns exactly 7 real templates; (b) both
  connections each receive exactly 2 messages on connect, the first being `type: 'template-catalog'`
  with all 7 templates; (c) both connections' catalogs are deep-equal to each other and to the
  registry's own ground truth (no per-recipient filtering/duplication — expected, since
  `AssetTemplate` content is public/static, identical for both players, unlike `StateDeltaMessage`'s
  per-player `opponentView`); (d) the 7 template ids match IP-3011's real
  `server/src/content/assetTypes/*.json` filenames exactly; (e) triggering a real subsequent action
  (`pass`, which calls `broadcastStateDelta`) sends no further `template-catalog` message to either
  connection — confirming the "once per connection" design intent is actually enforced by the code
  (the catalog send lives in `handleConnection`, never in `broadcastStateDelta`), not merely
  documented in a comment. All assertions passed. Deleted before this report was written; `git
  status` confirms no residue in the working tree.

## Scope audit

`git show --stat c734272` confirms the diff touches exactly: `client/src/App.tsx`,
`client/src/__tests__/App.test.tsx`, `client/src/__tests__/AssetTray.test.tsx` (new),
`client/src/main.tsx`, `client/src/state/gameClient.ts`, `server/src/engine/TemplateRegistry.ts`,
`server/src/transport/__tests__/disconnectFlow.test.ts`,
`server/src/transport/__tests__/websocketServer.test.ts`, `server/src/transport/websocketServer.ts`,
`shared/src/interfaces.ts`, `shared/src/messages.ts`, plus ledger/doc bookkeeping
(`00-master-build-plan.md`, `packages/INDEX.md`, `IP-8010-presentation-ui.md`,
`docs/requirements/04-requirements-traceability-matrix.md`). This is exactly the file set the
package's own "Remediation (VR-8010)" section named — no excursion.

`AssetTemplate`/`MissionSetTemplate`'s relocation to `shared/src/interfaces.ts` was checked for
fallout: `grep -rn "AssetTemplate\|MissionSetTemplate"` across `server/`, `client/`, `shared/`
(excluding tests) shows `server/src/engine/TemplateRegistry.ts` now imports both types from
`@owchess/shared` and re-exports them (`export type { AssetTemplate, MissionSetTemplate };`) —
this re-export means `server/src/engine/deployAction.ts` and `server/src/content/loadContent.ts`,
the only other production consumers, needed no changes and the build confirms none broke. No other
file in the tree declared or imported these types from the old location.

The `websocketServer.test.ts`/`disconnectFlow.test.ts` message-count updates were read line by line
against the actual new behavior, not taken on faith: `websocketServer.test.ts`'s new first test
(`aliceConn.sent` length 2, index 0 is `template-catalog`) and the `strayConn.sent` length-2 update
in the F1/BL-0044 reconnect-rejection test both correctly reflect that `handleConnection` now always
sends the catalog before anything else, including before the "session no longer exists" rejection —
this is the real, intended new behavior (the catalog is unconditional per FS-108's remediation
design, sent before the session lookup happens), not a loosened assertion papering over a defect.
`disconnectFlow.test.ts`'s `newAliceConn.sent` length-1→2 update on a reconnect is the same correct
reflection of "every connection, including a reconnect, gets the static catalog once." Independently
re-derived both counts via the scratch live-exercise test above rather than trusting the committed
assertions' own say-so.

## Findings

None. F2/BL-0049 was already correctly scoped to IP-4010 by VR-8010 and is not re-raised here.

## Final sanity check (last MVP package)

Read `docs/implementation/00-master-build-plan.md` and `docs/implementation/packages/INDEX.md` in
full: all 10 other MVP packages (IP-0010, IP-1010, IP-3010, IP-3011, IP-2010, IP-5010, IP-6010,
IP-4010, IP-4011, IP-7010) are recorded `VERIFIED` in both ledgers, each citing a real VR report
present in `docs/implementation/verification/` — no drift found between the two ledgers or against
the VR reports' own recorded results.

## Recommendation

Flip IP-8010 `COMPLETE` → `VERIFIED`. With this package's fresh `VERIFIED` and all 10 other MVP
packages independently confirmed still `VERIFIED` with no drift, all 11 MVP Implementation Packages
now stand `VERIFIED` — the tranche is ready for `10-integration-review`.
