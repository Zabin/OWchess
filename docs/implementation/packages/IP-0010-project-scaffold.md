# IP-0010 — Project Scaffold & Shared Types

- **Package ID:** IP-0010 · **Status:** READY · **Owning stage-08 peer:** `08-code-implementation`
- **Source:** foundational (no FS) — required by every other package in this plan.
- **Authorization (G3):** Covered by the release plan (`docs/feature-planning/01-release-plan.md`)
  — the MVP release requires a working, testable codebase; this package is the prerequisite
  infrastructure for every MVP-bucketed Feature, not separate scope.

## Objective

Stand up the npm-workspaces monorepo (`shared/`, `server/`, `client/`), the TypeScript project-
reference build, the test runner, and the `shared` package's types/message-schema — translating
GDS-07 (Data Model) and GDS-09 (Interface Specification) into real, compilable TypeScript, with
zero game logic yet. Every other package imports from `shared` rather than redefining these types.

## Requirements Covered

NFR-5003 (`Propagator` swappable-implementation seam — the interface *shape* originates here),
NFR-6100 (server-authoritative — enforced structurally by `shared`'s `PlayerState`/`OpponentView`
type distinction existing from the start). No FR directly, since this package implements no
player-visible behavior — it is pure infrastructure the TWBS names explicitly (§0/§3).

## Architecture Components

All five GDS-03 module *interfaces* (`Propagator`, `BeliefState`, `EffectResolver`, `TurnManager`,
`GameEngine`) as TypeScript `interface` declarations only — no implementations (those are IP-1010/
2010/4010/5010/6010's job). The WebSocket message schema (GDS-09 §"WebSocket message schema").

## Interfaces

Defines, does not consume: every interface in GDS-09, transcribed into `shared/src/interfaces.ts`
(module contracts) and `shared/src/messages.ts` (`ActionMessage`/`StateDeltaMessage`/
`RejectedActionMessage`/`DisconnectNotification`/`DisconnectResponse`), plus the GDS-07 data types
(`SessionState`, `PlayerState`, `OpponentView`, `Asset`, `BeliefStateEntry`, `EffectStateEntry`,
`EventRecord`) in `shared/src/types.ts`.

## Files to Create

*(No existing tree — every path below is "to create.")*

- `package.json` (root, npm workspaces: `shared`, `server`, `client`), `tsconfig.base.json`
- `shared/package.json`, `shared/tsconfig.json`, `shared/src/types.ts`, `shared/src/interfaces.ts`,
  `shared/src/messages.ts`, `shared/src/index.ts` (barrel export)
- `server/package.json`, `server/tsconfig.json`, `server/src/index.ts` (empty entry point, no
  engine logic yet), `server/vitest.config.ts`
- `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/src/main.tsx`
  (placeholder render), `client/vitest.config.ts`
- `.gitignore`, root `README.md` (build/test/dev commands)

## Implementation Tasks

1. Initialize npm workspaces at the repo root; add TypeScript, Vitest, Vite, `ws` (server-side
   WebSocket library), React, React Testing Library as workspace dependencies.
2. Author `shared/src/types.ts` transcribing GDS-07's entity shapes verbatim (field names/types),
   citing GDS-07 section per type in a code comment.
3. Author `shared/src/interfaces.ts` transcribing GDS-09's five module contracts verbatim.
4. Author `shared/src/messages.ts` transcribing GDS-09's message schema verbatim, including the
   `DisconnectNotification`/`DisconnectResponse` pair FS-107 added.
5. Wire TypeScript project references so `server`/`client` both compile against `shared`'s
   built output (not a relative source import — avoids the exact drift risk `shared` exists to
   prevent, per ADR-0001's shared-types rationale cited by FS-107/108).
6. Confirm `npm run build`, `npm test`, `npm run dev` all execute cleanly with no logic yet (an
   empty-but-real build/test pass is this package's own Definition of Done — see below).

## Tests to Add

`shared/src/__tests__/types.smoke.test.ts` — a smoke test asserting every exported type/interface
compiles and is importable from both `server` and `client` workspaces (a type-only test, but
Vitest still runs it as part of `npm test`, proving the build wiring itself, which is this
package's actual object of verification).

## Documentation Updates

None outside `docs/implementation/` — this package's own file plus, once it completes, the Master
Build Plan status flip. Root `README.md` created here documents the real `npm run build`/`npm
test`/`npm run dev` commands for every downstream package's Verification Checklist to cite.

## Definition of Done

- [ ] `npm run build` succeeds from a clean checkout with zero TypeScript errors.
- [ ] `npm test` runs and passes (the one smoke test) in all three workspaces.
- [ ] `npm run dev` starts both the server and client dev processes without crashing.
- [ ] Every GDS-07 entity and GDS-09 interface/message type exists in `shared/`, importable from
      `server`/`client` via the built package, not a relative source path.

## Verification Checklist

- [ ] **G5 gate:** `npm run build` — clean.
- [ ] **G5 gate:** `npm test` — full suite passes (smoke test only, at this stage).
- [ ] Every `shared` type/interface traces to a specific GDS-07/GDS-09 section (spot-checked by
      `09-package-verification`).
- [ ] No game logic present in `server`/`client` beyond the empty entry points named above (this
      package's own scope boundary — logic belongs to IP-1010 onward).

## Dependencies

None (foundational).

## Risks

Low — pure scaffolding, well-trodden npm-workspaces/TypeScript-project-references pattern; the
only real risk is toolchain-version drift between workspaces, mitigated by the shared
`tsconfig.base.json` and a single root lockfile.

## Rollback Considerations

Trivial — no game state or shipped behavior yet; a bad scaffold choice is deleted and re-run with
no data-migration concern.
