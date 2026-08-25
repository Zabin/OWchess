# Integration Review — MVP Tranche

- **Owned by:** `10-integration-review` · **Date:** 2026-08-23

## Scope

All 11 MVP Implementation Packages, the first time this full set has reached this stage — every
one independently `VERIFIED` as of this review:

| Package | VR |
|---|---|
| IP-0010 | VR-0010 |
| IP-1010 | VR-1010-v2 |
| IP-3010 | VR-3010 |
| IP-3011 | VR-3011 |
| IP-2010 | VR-2010-v2 |
| IP-5010 | VR-5010 |
| IP-6010 | VR-6010 |
| IP-4010 | VR-4010 |
| IP-4011 | VR-4011 |
| IP-7010 | VR-7010-v2 |
| IP-8010 | VR-8010-v2 |

**Commit reviewed:** `5a0088e573152b4ce1cfb0db043605cae2913d72`.

## Full gates (re-run against the reviewed commit)

- `rm -rf node_modules */dist`, fresh `npm install`, then `npm run build`: clean across all 3
  workspaces (`tsc -b` for `shared`/`server`; `tsc -b && vite build` for `client`).
- `npm run test`: **98 tests total** — shared 1/1, server 80/80 (16 files), client 17/17 (5
  files). All green, matching the count every `08`/`09` pass since VR-8010-v2 has already
  recorded.

## Dimension 1 — Interface consistency

**Fog-of-war chain, end to end (`BeliefState` → transport → client rendering):**
`BeliefState.computeOpponentView`'s real return shape (`{playerId, beliefEntries}`, confirmed by
reading `server/src/engine/BeliefState.ts`) matches `OpponentView` in `shared/src/types.ts`
exactly, which `websocketServer.ts`'s `StateDeltaMessage.opponentView` field types against, which
`OrbitalBoard.tsx`/`IntelPanel.tsx` accept as their only opponent-facing prop type. The three
layers were each independently verified in isolation (VR-6010, VR-7010-v2, VR-8010-v2); this
review confirms the *types line up across all three* with no widening/narrowing at any hop — the
whole chain compiles under one `tsc -b` run with no `any`/unsafe casts at any of the three
boundaries (checked by reading each file's import/usage of `OpponentView` directly).

**`TemplateCatalogMessage`/`AssetTemplate` (BL-0048, the newest cross-package interface):**
`shared/src/interfaces.ts`'s `AssetTemplate` is the single declaration server (`TemplateRegistry.ts`,
now a re-export) and client (`AssetTray.tsx`'s `DeployableTemplate`, a structural subset) both
resolve against — confirmed via `grep -rn "AssetTemplate" shared/src server/src client/src`: no
second, drifted declaration exists anywhere.

**Confirmed cross-package gap (already disclosed, re-confirmed live):** BL-0049 —
`server/src/engine/engageAction.ts` never references `chainRoles` at all (`grep -n chainRoles
server/src/engine/engageAction.ts` returns nothing), while `client/src/legality/legalityPreFilter.ts`
gates the `engage` action category on `chainRoles.includes('engage')`. The two sides of this
contract disagree as shipped — see Finding F3. VR-8010's own audit already found and disclosed
this; this review independently re-confirms it by reading both files directly, as the
cross-package check this stage exists to make.

## Dimension 2 — Invariant sweep

- **Server sole authority:** `grep -rn "PlayerState" client/src` (re-run this session) shows
  every usage is either a type import or `ownState: PlayerState`; no component or client module
  ever writes back a `PlayerState`-shaped value to the server, and `handleActionMessage` routes
  every action through `GameEngine.handleAction` with no client-supplied state ever trusted
  directly (confirmed by reading `websocketServer.ts` in full).
- **Fog-of-war never computed client-side:** confirmed above (Dimension 1) and by each
  contributing package's own VR; no new leak surface was introduced by the two remediation
  packages (IP-7010's F1/F2 fixes, IP-8010's `TemplateCatalogMessage`) — `AssetTemplate` content
  is public and identical for both players by design (not game-truth state), so its addition to
  the wire protocol introduces no fog-of-war exposure.
- **Turn alternation:** `GameEngine.handleAction`'s `actingPlayer !== activePlayer()` gate
  (`TurnManager.submitAction`) is unchanged by every package reviewed here; `GameEngine.winConditions.test.ts`
  and `TurnManager.test.ts` both still pass unmodified.
- **One-job-per-module:** the composition root (`server/src/engine/createGameEngine.ts`, BL-0030)
  wires `deploy`/`task`/`maneuver`/`engage` handlers and a single `TurnEndHook` per session that
  ticks deploy states, maneuvers, and effects, plus a separately-registered belief-decay hook — no
  module was found taking on a second module's responsibility; `resign`/`pass` remain handled
  directly inside `GameEngine` itself (not via `registerHandler`), consistent with GDS-03's module
  boundary.
- **ID namespace collisions:** re-checked directly — 7 distinct `templateId`s across
  `server/src/content/assetTypes/*.json`, 3 distinct `missionSetId`s across
  `server/src/content/missionSets/*.json`, 5 distinct effect files under
  `server/src/content/effects/` (one per Five D's type) — no collisions found in any namespace.

## Dimension 3 — Behavioral coherence

No two packages implement the same behavior divergently (each module's responsibility — sensing,
propagation, effects, belief-state, transport, rendering — has exactly one owning file). No
player-visible workflow dead-ends at a seam: effect ticking (`EffectResolver.tickActiveEffects`)
is wired into the same turn-end hook as deploy/maneuver ticking (not a package that computes an
effect with no consumer); the King denial-streak fields (`consecutiveDenialTurns`/
`totalDenialTurns`) are read by `GameEngine.checkWinConditions`, confirmed still correctly ordered
after BL-0045's `cancelled`-check addition (checked first, ahead of resignation — read
`GameEngine.ts` directly to confirm the ordering is `cancelled → resignation → destruction →
denial → timeout-tiebreak`, matching FS-101 §W7's "terminal and unconditional" requirement for
cancellation).

## Dimension 4 — Traceability coherence

`docs/implementation/00-master-build-plan.md` and `docs/implementation/packages/INDEX.md` agree
with each other on every package's status (`VERIFIED`) and cite the matching VR for each — no
drift found between the two ledgers.

**Finding (Medium, F1):** `docs/features/FS-###-*.md`'s own `Implemented by:` metadata lines —
the FS-level cross-reference to implementation status — are stale for 6 of 8 Features. FS-101,
FS-102, FS-103, FS-104, FS-106, and FS-107 all still read "(COMPLETE, awaiting
`09-package-verification`)" despite their packages (IP-1010, IP-3010/3011, IP-2010, IP-5010,
IP-6010, IP-7010) having been independently `VERIFIED` days ago. Only FS-105 (IP-4010/IP-4011)
was kept current, reading "VERIFIED — VR-4010"/"VERIFIED — VR-4011." FS-108 also still reads
"awaiting `09-package-verification`" despite IP-8010 now being `VERIFIED` via VR-8010-v2. See
Findings below.

## Dimension 5 — Documentation coherence

No `CLAUDE.md` or `memory.md` exists in this repository (this project never created either), so
that specific convention doesn't apply here — not a gap, just inapplicable.

**Finding (Low, F4):** GDS-09 (`docs/architecture/09-interface-specification.md`) is stale
relative to the shipped interfaces across 5 disclosed, individually-reasonable deviations that
have accumulated without a batch reconciliation: `BeliefState.applyTasking`'s extra
`observerState`/`opponentTrueState` params (BL-0028), `computeOpponentView`/`applyDeception`'s
extra params (BL-0033), `TurnEndHook`'s added `turnNumber` param (BL-0036), `WinResult`'s new
`'cancelled'` `WinReason` value and the unstated `SessionState.cancelled` field (BL-0045), and the
entirely new `TemplateCatalogMessage`/`AssetTemplate`-in-`shared` addition (BL-0048) — none of
which appear in GDS-09's own code blocks. Each was independently judged reasonable and
accurately disclosed by its own verification pass; this review's own contribution is confirming
they are also **mutually consistent with each other** — the whole tree still builds under one
`tsc -b` pass with no signature conflicts between any of the five, and no two deviations touch the
same interface in contradictory ways (e.g. `TurnEndHook`'s `turnNumber` and the `cancelled` check
are unrelated fields on different types). The gap is real but purely a documentation lag, not a
code inconsistency.

## Findings

| # | Description | Severity | Recommended owner |
|---|---|---|---|
| F1 | 6 of 8 `FS-###`'s `Implemented by:` metadata lines are stale — they still read "COMPLETE, awaiting `09-package-verification`" for packages (IP-1010, IP-3010, IP-3011, IP-2010, IP-5010, IP-6010, IP-7010, IP-8010) that have since been independently `VERIFIED`. Only FS-105 was kept current. | Medium | Whichever session next touches each FS (or a dedicated housekeeping pass) — a one-line metadata edit per file, not a code change. |
| F2 | The MVP has never been run end-to-end as a real deployed process: `server/src/index.ts` remains a scaffold (`export {}`, BL-0038 — no package has bootstrapped a real `WebSocketServer` wrapping actual sockets into the `Connection` interface), and `server/dist/content/` contains no `.json` files at all (BL-0027 re-confirmed reproducing — `tsc -b` doesn't copy runtime-read JSON into `dist/`). Individually each is already disclosed and correctly judged non-blocking for its own package's G5 gate (tests run against source, not `dist/`), but **combined, they mean nobody can actually play a game against this codebase today outside of the test suite** — a fact directly relevant to the owner's upcoming release-readiness call. | Medium | `07-implementation-planning` to author a small bootstrap package (real `WebSocketServer` + a `dist`-content-copy build step) before `11-release-readiness`'s GO call, if "MVP playable in a browser" is part of what GO is meant to certify. |
| F3 | `server/src/engine/engageAction.ts` never checks `chainRoles` for `'engage'` (only belief precision), while `client/src/legality/legalityPreFilter.ts` gates the `engage` category on `chainRoles.includes('engage')` — the two sides of this shared contract disagree as shipped. Already disclosed as BL-0049 by VR-8010; re-confirmed live by this review. Does not violate NFR-4200 (client only ever hides a category the server would still accept, never shows one the server would reject), so it is a genuine interface-consistency gap, not a functional bug. | Low | `08-code-implementation`/`07-implementation-planning` — IP-4010's own future touch to decide whether to add the server-side check (tightening) or relax the client gate (loosening) to match. |
| F4 | GDS-09 (`docs/architecture/09-interface-specification.md`) is stale relative to the shipped interfaces across 5 accumulated, individually-disclosed deviations (BL-0028, BL-0033, BL-0036, BL-0045, BL-0048) — none reconciled back into the document. Confirmed mutually consistent with each other (the tree builds clean, no signature conflicts), so this is a documentation-lag finding, not a code defect. | Low | `03-architecture-design-synthesis` — one batch reconciliation pass across all 5 deviations, rather than five separate patches. |

No Critical or High findings. Every dimension was actually exercised (not merely asserted) against
the live tree at the reviewed commit.

## Deviation-consistency check (explicit, per this run's request)

The five disclosed GDS-09 deviations (BL-0028, BL-0033, BL-0036, BL-0045, BL-0048) were checked
against each other, not just individually: each touches a different interface/type
(`applyTasking`'s params; `computeOpponentView`/`applyDeception`'s params; `TurnEndHook`'s
signature; `WinResult`/`SessionState`'s new field/value; `TemplateCatalogMessage`/`AssetTemplate`'s
new location), none overlap or contradict another, and the whole set compiles cleanly together
under one `tsc -b` pass. No cross-deviation conflict was found.

## Composition-root check (explicit, per this run's request)

`server/src/engine/createGameEngine.ts` (BL-0030) genuinely wires every module: `deploy`/`task`/
`maneuver`/`engage` handlers are all registered; the per-session `TurnEndHook` ticks deploy states,
maneuvers, and effects together; belief decay is registered separately per session. `resign`/`pass`
are correctly handled directly inside `GameEngine` (not via `registerHandler`), consistent with
GDS-03. This is confirmed coherent — the only remaining gap is BL-0038 (no *real* bootstrap wraps
this composition root around actual sockets), captured as F2 above.

## Recommendation

No Critical/High findings — this scope is eligible to advance to `11-release-readiness`. F1/F2/F3/
F4 are residual risks and documentation debt for that stage's Release Assessment to weigh
explicitly (F2 in particular bears on whether "MVP" can be certified as actually playable, which is
squarely `11`'s call, not this review's to make).
