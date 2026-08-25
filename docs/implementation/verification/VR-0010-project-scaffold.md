# VR-0010 — Project Scaffold & Shared Types

- **Verifies:** [IP-0010](../packages/IP-0010-project-scaffold.md) · **Commit verified:**
  `d47a672f312d40b8e12e09bd932fbc5795c05d10` (`feat(scaffold): implement IP-0010, project scaffold
  & shared types`), tree confirmed clean at `c1a9c5feb551491ca71d451774d5af16de3f9164` at
  verification time · **Owning stage-08 peer:** `08-code-implementation` · **Verified by:**
  `09-package-verification`, independent session (no prior involvement in IP-0010's
  implementation) · **Date:** 2026-08-22

## Result

**VERIFIED** — 0 failed checks. All Definition of Done items and Verification Checklist items
confirmed against the live tree by direct rebuild, full test run, and dev-process start; three
Low-severity findings recorded below, none blocking.

## Definition of Done audit

| Item | Evidence | Result |
|---|---|---|
| `npm run build` succeeds from a clean checkout, zero TypeScript errors | Deleted all `node_modules`/`dist`/`*.tsbuildinfo`, ran `npm install` then `npm run build` from repo root: `tsc -b` clean in `shared`, `server`; `tsc -b && vite build` clean in `client` (`✓ built in 977ms`, 29 modules, no errors) | PASS |
| `npm test` runs and passes (the one smoke test) in all three workspaces (`server`/`client` via `passWithNoTests`) | `npm test` from root: `shared` → `Test Files 1 passed (1)`, `Tests 1 passed (1)` (`src/__tests__/types.smoke.test.ts`); `server` and `client` → `No test files found, exiting with code 0` (confirmed `passWithNoTests: true` set in both `server/vitest.config.ts` and `client/vitest.config.ts`, not merely assumed) | PASS |
| `npm run dev` starts both server and client dev processes without crashing | `npx tsx watch server/src/index.ts` started and stayed up with no error output (process confirmed live via `ps`); `client` `vite --port 5183` dev server started (`VITE v5.4.21 ready in 271 ms`) and `curl -s -o /dev/null -w "%{http_code}" http://localhost:5183/` returned `200`. Both processes killed cleanly after confirmation | PASS |
| Every GDS-07 entity and GDS-09 interface/message type exists in `shared/`, importable from `server`/`client` via the built package, not a relative source path | Read `shared/src/types.ts`, `interfaces.ts`, `messages.ts`, `index.ts` in full and diffed field-by-field against GDS-07 (`docs/architecture/07-data-model.md`) and GDS-09 (`docs/architecture/09-interface-specification.md`): `SessionState`, `PlayerState`, `OpponentView`, `Asset`, `BeliefStateEntry`, `EffectStateEntry`, `EventRecord` all present with matching field names/types; `Propagator`, `BeliefState`, `EffectResolver`, `TurnManager`, `GameEngine` interfaces all present with matching method signatures; `ActionMessage`/`StateDeltaMessage`/`RejectedActionMessage`/`DisconnectNotification`/`DisconnectResponse` all present. `server/tsconfig.json` and `client/tsconfig.json` both reference `../shared` via TS project references and `shared/package.json` exposes `main`/`types` pointing at `dist/`, so downstream workspaces compile against `shared`'s built output, not a relative source import (confirmed the built `shared/dist/*.d.ts` exist after `npm run build` and are what `NodeNext`/`Bundler` resolution picks up) | PASS |

## Verification Checklist audit

| Item | Evidence | Result |
|---|---|---|
| G5 gate: `npm run build` — clean (all three workspaces) | See DoD row 1 above | PASS |
| G5 gate: `npm test` — full suite passes (1 test in `shared`; `server`/`client` `passWithNoTests`) | See DoD row 2 above | PASS |
| Every `shared` type/interface traces to a specific GDS-07/GDS-09 section (independently confirmed, not spot-checked) | Confirmed 1:1 by name against GDS-07's per-entity headers (`SessionState`, `PlayerState`, `Asset`, `BeliefStateEntry`, `EffectStateEntry`, `EventRecord`) and GDS-09's per-module headers (`Propagator`, `BeliefState`, `EffectResolver`, `TurnManager`, `GameEngine`, WebSocket message schema) — every type/interface name and field matches its source section exactly. **Finding L-2** (below): the individual type/interface declarations carry only file-level header comments ("transcribed from GDS-07…") rather than the per-type inline section citations Implementation Task 2 literally specifies ("citing GDS-07 section per type in a code comment"); traceability itself holds (confirmed by this audit's direct comparison), so this checklist item is marked PASS on substance, with the citation-style gap noted as Low | PASS (with Low note) |
| No game logic present in `server`/`client` beyond the empty entry points | Read `server/src/index.ts` in full: `export {};` plus a scaffold comment, nothing else. Read `client/src/main.tsx` in full: a placeholder `<div>` render via `createRoot`, no game logic. No other `.ts`/`.tsx` files exist under `server/src` or `client/src` | PASS |

## Requirements audit

| Requirement | Where implemented | Where tested | RTM cell state | Result |
|---|---|---|---|---|
| NFR-5003 (as cited by IP-0010) | — | — | **Finding M-1**: `NFR-5003` does not exist in the current requirements baseline. It is the *SOR-era* ID (`docs/requirements/02-non-functional-requirements.md` line 42 cites it only as `*Source:* SOR NFR-5003`); `04-requirements-engineering` renumbered the live requirement to **NFR-5300** (`Propagator isolation protects fidelity upgrades`). IP-0010's own "Requirements Covered" line cites the retired SOR number, not the current baseline ID | See below (resolved to NFR-5300) |
| NFR-5300 (`Propagator` isolation protects fidelity upgrades) — the requirement IP-0010 actually covers | `shared/src/interfaces.ts`'s `Propagator` interface: `advance`/`currentRegime`/`planManeuver`/`maneuverComplete` declared as the sole seam; no caller-side implementation exists yet (correctly deferred to IP-5010) | `shared/src/__tests__/types.smoke.test.ts` exercises `keyof Propagator` to prove the interface compiles/imports; this is necessarily a structural, not behavioral, check — full "swap is a rewrite-free change" proof can only land once IP-5010 implements it | `docs/requirements/04-requirements-traceability-matrix.md` row 67 (NFR-5300) still reads `UNASSIGNED` across Feature Spec/Implementation Package/Test — **left untouched**: IP-0010's own Documentation Updates field explicitly disclaims RTM updates ("None outside `docs/implementation/`"), and every other row in this matrix (including rows for requirements that already have FS-###/IP-#### assigned, e.g. FR-5100/FR-5500) is likewise still `UNASSIGNED` — this is an established, batched-elsewhere convention, not an IP-0010-specific gap. Noted as **Finding L-3** for the pipeline, not a package defect | PASS (structural seam confirmed; full satisfaction pending IP-5010) |
| NFR-6100 (server-authoritative state) | `shared/src/types.ts`'s `PlayerState` (server-internal, full truth) vs. `OpponentView` (client-bound, belief-filtered) as structurally distinct interfaces — no shared shape between them, so an accidental full-state leak would be a type error once a caller exists, per GDS-07's own stated design intent | Same smoke test proves both types compile/import distinctly; no runtime enforcement exists yet since `GameEngine.handleAction` isn't implemented until IP-1010+ | Row 68, same `UNASSIGNED` state, same rationale as above | PASS (structural precondition confirmed; full enforcement pending GameEngine implementation) |

## Test run

Exact commands, run from repo root after a full clean (`rm -rf node_modules shared/node_modules
server/node_modules client/node_modules shared/dist server/dist client/dist
shared/tsconfig.tsbuildinfo server/tsconfig.tsbuildinfo client/tsconfig.tsbuildinfo`):

```
$ npm install
added 178 packages, and audited 182 packages in 7s

$ npm run build
> @owchess/shared build   → tsc -b            (clean, no output = success)
> @owchess/server build   → tsc -b            (clean, no output = success)
> @owchess/client build   → tsc -b && vite build
  ✓ 29 modules transformed, built in 977ms, zero errors

$ npm test
> @owchess/shared test → vitest run
  ✓ src/__tests__/types.smoke.test.ts (1 test) 3ms
  Test Files  1 passed (1)
       Tests  1 passed (1)
> @owchess/server test → vitest run
  No test files found, exiting with code 0
> @owchess/client test → vitest run
  No test files found, exiting with code 0
```

Counts: **1 test file, 1 test, 1 passed, 0 failed** across the suite (`shared`); `server`/`client`
each 0 test files by design (`passWithNoTests: true` in both `vitest.config.ts`), exit code 0.

`npm run dev` gate (run manually, each workspace's own dev script, since the root `dev` script
runs both concurrently and this audit needed to confirm each independently):

```
$ npx tsx watch server/src/index.ts        → process stays up, no error output
$ (cd client && npm run dev -- --port 5183) → VITE v5.4.21 ready in 271 ms
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:5183/  → 200
```

Both dev processes terminated after confirmation; no artifacts left running.

## Scope audit

`git show --stat d47a672` confirmed the implementing commit touched exactly the 21 files IP-0010's
own "Files to Create" list names (`package.json`, `tsconfig.base.json`, all three workspaces'
`package.json`/`tsconfig.json`, `shared/src/{types,interfaces,messages,index}.ts`,
`shared/src/__tests__/types.smoke.test.ts`, `server/src/index.ts`, `server/vitest.config.ts`,
`client/vite.config.ts`, `client/vitest.config.ts`, `client/src/main.tsx`, `client/index.html`,
`.gitignore`, `README.md`), plus `package-lock.json` (expected artifact of `npm install`, not a
declared file but an unavoidable and harmless byproduct of "initialize npm workspaces", task 1),
and the three ledger files this package is explicitly permitted to touch (its own package file,
the Master Build Plan, `packages/INDEX.md`). No excursion into any other package's declared file
set; no stage-08-peer-seam crossing (no content templates, no engine logic). **Scope: clean.**

## Findings

| ID | Description | Severity | Owner |
|---|---|---|---|
| M-1 | IP-0010's "Requirements Covered" line cites `NFR-5003`, a retired SOR-era ID. The current requirements baseline (`docs/requirements/02-non-functional-requirements.md`) renumbered this requirement to `NFR-5300`. The package's own text is stale, though the code correctly satisfies the live requirement (NFR-5300) regardless of the label used to cite it. | Medium (traceability-label accuracy, not a functional gap) | `07-implementation-planning` (correct IP-0010's Requirements Covered field to cite `NFR-5300`, not `NFR-5003`) |
| L-2 | `shared/src/types.ts`/`interfaces.ts`/`messages.ts` carry only file-level "transcribed from GDS-0X" header comments, not the per-type inline GDS-07/09 section citations Implementation Task 2 literally asked for ("citing GDS-07 section per type in a code comment"). Traceability itself is intact (every type/interface name and field matches its GDS-07/09 source 1:1, confirmed directly by this audit), so this is a citation-style gap, not a substantive one. | Low | `08-code-implementation` (optional follow-up: add inline `// GDS-07 §Asset` style comments per type, if future packages want stricter self-documentation — not required to unblock downstream work) |
| L-3 | `docs/requirements/04-requirements-traceability-matrix.md` rows for NFR-5300/NFR-6100 (and many other rows with FS-###/IP-#### already assigned elsewhere in the tree) remain `UNASSIGNED` in Feature Spec/Implementation Package/Test columns — this project-wide RTM appears to lag behind the packages/features that have actually landed. IP-0010 itself explicitly disclaims RTM updates in its Documentation Updates field, so this is not an IP-0010-specific defect, but the pipeline should decide when/how this ledger gets bulk-caught-up. | Low (pipeline hygiene, not this package's defect) | `04-requirements-engineering` or `00-pipeline-manager` (schedule an RTM catch-up pass, likely once more packages verify) |

None of the above findings affect the Result — every DoD item, every Verification Checklist item,
and both Requirements Covered items (once corrected to their live IDs) hold against the actual
tree, a from-clean rebuild, and a real dev-process start.
