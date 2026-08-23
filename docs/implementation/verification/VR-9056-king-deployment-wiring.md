# VR-9056 — King-Deployment Wire Exposure

- **Package:** IP-9056 · **Commit verified:** `62b8c4b` (feat(server,client): IP-9056 — King-deployment
  wire exposure (BL-0056)), tree state also includes `90410b2` (pipeline journal only, no code) ·
  **Verified:** 2026-08-23
- **Independence:** IP-9056 was implemented in a prior session (`session_013k6T2Ri8QrGJ1gzRr3NTiN`),
  not this one. Full independence — no same-session conflict.

## Result

**VERIFIED** — 0 failed checks, 3 Low findings (non-blocking).

## Definition of Done audit

| Item | Evidence | Pass/Fail |
|---|---|---|
| Real client can submit King deployment over a real WS connection, correct status updates, opponent's selection never revealed (FR-1210) | Read `SessionStore.getDeploymentStatus`/`websocketServer.broadcastDeploymentStatus`/`DeploymentStatusMessage` type — the type only has `phase`/`ownDeployed`/`opponentDeployed`, no `missionSetId`/`regime` field exists to leak. Independently reproduced live: fresh script `server/verify-ip9056-e2e.mjs` (deleted after use, not committed) started `node server/dist/index.js` on `PORT=34599`, real `fetch` create+join, two real `ws` clients, player 1 deployed `satcom`/`GEO-EQUATORIAL` — player 2's raw broadcast JSON string asserted to contain neither `"satcom"` nor `"GEO-EQUATORIAL"` nor even the keys `missionSetId`/`regime` at all | Pass |
| Once both players deploy, both receive a real `StateDeltaMessage`, `phase: 'active'` | Live script: player 2 deployed `isr`/`LEO-POLAR`; both `ws` clients' next message was `type: 'state-delta'`; `final1.ownState.king.missionSet === 'satcom'`, `final2.ownState.king.missionSet === 'isr'`; `store.getSession(sessionId)?.phase === 'active'` confirmed via the also-passing committed test | Pass |
| Second deployment attempt by an already-deployed player rejected (FR-1230) | Read `SessionStore.submitKingDeployment`: `if (record.session) return { accepted: false, reason: 'King already deployed (FR-1230)' }`. Live script: player 1 sent a third `deploy-king` — received `{type: 'action-rejected', reason: 'King already deployed (FR-1230)'}`, exact string match | Pass |
| `KingDeploymentPicker` renders real mission-set/regime options sourced from `TemplateCatalogMessage`, not hardcoded | Read `KingDeploymentPicker.tsx`: `<select>` options map directly over the `missionSets` prop and the selected mission set's own `kingRegimeAffinity` array, no literal mission-set/regime string anywhere in the component. Live script also confirmed the server's real `template-catalog` message carries exactly 3 mission sets with ids `['isr', 'pnt-lite', 'satcom']`, matching `server/src/content/missionSets/*.json` filenames exactly | Pass |
| Full G5 gate green: 113 tests (1 shared + 88 server + 24 client) | Independently reproduced from the current tree (no forced clean rebuild needed — `npm run build` and `npm run test` both ran clean against the existing `node_modules`): 1 + 88 + 24 = 113, exact match | Pass |

## Verification Checklist audit

| Item | Evidence | Pass/Fail |
|---|---|---|
| G5 gate: build clean, full suite passes (113 tests) | See Test run below | Pass |
| Live, real end-to-end run reproduced independently (own script, not just committed tests) | Wrote `server/verify-ip9056-e2e.mjs` from scratch (glanced at the leftover `server/e2e-king-deploy-scratch.mjs`/`server/debug-ws.mjs` only to confirm they were a prior failed attempt, did not copy their logic) — full sequence: HTTP create/join, two real `ws` clients, initial `template-catalog` then `deployment-status` (phase `deploying`) for both, player 1 deploy, player 2 deploy, both reach `state-delta`/`active`, third deploy attempt by player 1 rejected. All 27 assertions in the script passed (see full transcript in Test run). Script deleted before commit | Pass |
| No fog-of-war leak: `DeploymentStatusMessage` never carries `missionSetId`/`regime` | Read the type declaration (`shared/src/messages.ts`) — only `phase`/`ownDeployed`/`opponentDeployed` fields exist, structurally incapable of carrying a selection. Read `broadcastDeploymentStatus`/`handleDeployKingMessage`/`handleConnection`'s deploying-phase branch — all three construction sites spread only `store.getDeploymentStatus(...)`'s return value (itself typed to the same three fields) into the message; no code path anywhere touches `pendingKingSelections`' `missionSet`/`regime` fields when building a `DeploymentStatusMessage`. Independently confirmed by the live script's raw-JSON-string assertions (not just parsed/typed fields) — also confirmed `opponentView` in the post-active `state-delta` does not leak the true regime either (`LEO-POLAR` absent from `final1.opponentView`) | Pass |

## Requirements audit

- **FR-1210** (secret King selection) — RTM row now reads: Implementation Package `IP-1010 (logic),
  IP-9056 (wire exposure)`; Test `TurnManager.test.ts (logic, via fixture setup);
  kingDeploymentFlow.test.ts (real wire path, IP-9056)`. Confirmed accurate:
  `kingDeploymentFlow.test.ts` genuinely exercises the real wire path (`transport.handleConnection`
  + `simulateMessage`, not direct `SessionStore` calls), and its "never leaking the selection"
  test independently re-confirmed live above.
- **FR-1220** (simultaneous resolution) — same RTM update as FR-1210, same file. Confirmed:
  `kingDeploymentFlow.test.ts`'s third test drives both players' deployments through the wire and
  asserts both transition to `state-delta` on the second submission only — genuinely simultaneous
  resolution at the wire level, not just at `SessionStore`'s internal logic (already covered by
  IP-1010).
- **FR-1230** (King immutability) — RTM row **left unedited** (`IP-1010` only,
  `SessionStore.test.ts` only), despite `kingDeploymentFlow.test.ts` now also exercising this
  exact rejection over a real wire connection (its fourth test) and this verification's own live
  script independently reproducing it. The package's own Documentation Updates section only
  promised to fill FR-1210/FR-1220's Test column, not FR-1230's — so this is not a broken promise,
  but it is a real, minor RTM completeness gap now that a second, wire-level test genuinely exists
  for this requirement. See Finding F1.
- **FR-9420** (first-full-game walkthrough precondition) — RTM row remains `UNASSIGNED` (Module/
  Test), correctly: IP-9056 is FR-9420's named precondition (a reachable, playable game), not the
  training-corpus content/test that would satisfy the requirement itself. Left unedited by this
  run — consistent with VR-9038's same judgment for FR-9410/FR-9420.

## Test run

Ran against the existing tree state (no forced clean `node_modules` wipe was needed — build and
test both completed cleanly):

```
npm run build   # shared: tsc -b; server: tsc -b && copy-content.mjs; client: tsc -b && vite build
npm run test    # vitest run per workspace
```

- `npm run build`: clean across all three workspaces, no errors/warnings beyond Vite's normal
  build summary (`dist/index.html`, `dist/assets/index-d6fnicdS.js`).
- `npm run test`:
  - `shared`: 1 test file, 1 test passed.
  - `server`: 18 test files, **88 tests** passed (includes `src/transport/__tests__/
    kingDeploymentFlow.test.ts`, 4 tests).
  - `client`: 7 test files, **24 tests** passed (includes `src/__tests__/
    KingDeploymentPicker.test.tsx`, 4 tests).
  - **Total: 1 + 88 + 24 = 113 tests, matching the package's own claim exactly.**

Live end-to-end smoke test (this verification's own independent script,
`server/verify-ip9056-e2e.mjs`, written from scratch, run against the freshly built
`server/dist/index.js` on `PORT=34599`, then deleted — not committed):

```
[server] OW Chess server listening on http://localhost:34599
PASS: create session -> 201 (got 201)
PASS: sessionId is a non-empty string
PASS: join session -> 200 (got 200)
PASS: second playerId distinct from first
PASS: ws1 first message is template-catalog
PASS: ws2 first message is template-catalog
PASS: template-catalog carries asset templates
PASS: template-catalog carries 3 mission sets (IP-9056)
PASS: mission set ids match content dir: isr,pnt-lite,satcom
PASS: ws1 second message is deployment-status, not a rejection (got deployment-status)
PASS: ws1 deployment-status phase is deploying
PASS: ws1 initial flags both false
PASS: ws2 also gets deploying status, not rejection
PASS: p1 gets deployment-status after own deploy
PASS: p1 sees ownDeployed=true, opponentDeployed=false
PASS: p2 gets deployment-status broadcast
PASS: p2 sees ownDeployed=false, opponentDeployed=true
PASS: p2 broadcast raw JSON does NOT contain "satcom" (secrecy)
PASS: p2 broadcast raw JSON does NOT contain "GEO-EQUATORIAL" (secrecy)
PASS: p2 broadcast raw JSON has no missionSetId key at all
PASS: p2 broadcast raw JSON has no regime key at all
PASS: p1 receives real state-delta once phase becomes active (got state-delta)
PASS: p2 receives real state-delta once phase becomes active (got state-delta)
PASS: p1 own state shows satcom king (now that game is active)
PASS: p2 own state shows isr king
PASS: p1 opponentView does not leak p2 true regime LEO-POLAR
PASS: repeat deploy-king by already-deployed player is rejected (got action-rejected)
PASS: rejection reason matches FR-1230 text: King already deployed (FR-1230)

ALL CHECKS PASSED
```

All 27 assertions passed, reproducing (and going somewhat beyond, e.g. the raw-JSON-string
secrecy checks and the post-active `opponentView` fog-of-war check) the package's own claimed
live-test sequence and result.

## Scope audit

`git show --stat 62b8c4b` confirms the diff touches: `client/src/__tests__/AssetTray.test.tsx`,
`client/src/__tests__/KingDeploymentPicker.test.tsx`, `client/src/components/
KingDeploymentPicker.tsx`, `client/src/main.tsx`, `client/src/state/gameClient.ts`,
`server/src/engine/SessionStore.ts`, `server/src/engine/TemplateRegistry.ts`,
`server/src/transport/__tests__/kingDeploymentFlow.test.ts`,
`server/src/transport/websocketServer.ts`, `shared/src/messages.ts`, plus ledger docs
(`00-master-build-plan.md`, `packages/INDEX.md`, the package file itself,
`04-requirements-traceability-matrix.md`).

Every file is inside the package's declared Files to Create/Modify set, **except one**:
`client/src/__tests__/AssetTray.test.tsx` (a 1-line addition, `missionSets: []`, to its
`fixtureTemplateCatalog()` helper). This file is not named anywhere in the package's Files to
Create/Modify list. It is, however, a mechanically-forced consequence of `TemplateCatalogMessage`
gaining a new required field — `AssetTray.test.tsx`'s existing fixture would fail to typecheck
otherwise — not an independent, undisclosed behavioral change. See Finding F2.

No excursion into `GameEngine.ts`, `BeliefState.ts`, `EffectResolver.ts`, or any other
engine/authority-boundary file the package didn't name. `getJoinedPlayerIds` (the one disclosed
deviation beyond the package's original two named `SessionStore` accessors) is confirmed
read-only and additive, matching its own Deviation note exactly.

## Independent confirmation of BL-0056 closure

Re-derived from the actual source, not the package's narrative:

1. **Real call site outside tests**: `grep -rn "submitKingDeployment"` across the whole tree shows
   exactly one call site outside a `__tests__` directory:
   `server/src/transport/websocketServer.ts:111`, inside `handleDeployKingMessage`, itself wired
   to `handleConnection`'s `onMessage` switch's `'deploy-king'` case. This is a genuine,
   client-reachable, production transport code path — not test setup.
2. **Wire path traced end-to-end**: `server/src/index.ts`'s WS-upgrade handler (unmodified by this
   package, from IP-9038) wraps a real `ws.WebSocket` into a `Connection` and calls
   `transport.handleConnection(sessionId, playerId, conn)` — the same `handleConnection` this
   package extended. No bypass, no alternate path.
3. **Live-confirmed**: the independent e2e script above drove exactly this path with a real
   process, real HTTP, and real `ws` sockets and observed the King deployment take effect
   (`phase` flips to `'active'`, both players' `ownState.king.missionSet` populated correctly).

**BL-0056 is genuinely closed.** The wire-level gap VR-9038 confirmed real (zero non-test callers
of `submitKingDeployment`) no longer exists — a real client can now reach it, and did so in this
run's own independent live test.

## Secrecy claim — independently confirmed

1. **Type-level**: `DeploymentStatusMessage` (`shared/src/messages.ts`) declares only `type`,
   `phase`, `ownDeployed`, `opponentDeployed` — no field exists for `missionSetId`/`regime` to
   occupy even by accident.
2. **Code-level**: all three construction sites of a `DeploymentStatusMessage` —
   `broadcastDeploymentStatus`, `handleDeployKingMessage`'s deploying-phase branch, and
   `handleConnection`'s initial deploying-phase send — build the message by spreading
   `store.getDeploymentStatus(...)`'s return value, and `getDeploymentStatus`'s own return type
   (`SessionStore.ts`) is the same three-boolean/phase shape; it reads `pendingKingSelections.has(...)`
   (existence check only) for the booleans, never `.get(...).missionSet`/`.regime`. No code path
   exists that could smuggle a selection into this message type.
3. **Live cross-check**: the e2e script asserted directly against the **raw JSON string** sent to
   player 2 after player 1's deployment — confirmed it contains neither the literal string
   `"satcom"` nor `"GEO-EQUATORIAL"` nor even the substrings `missionSetId`/`regime` at all (not
   merely "the typed field is absent," which would miss a stray debug field or wrong-key leak).
4. Also independently checked the **post-active** `opponentView` in the real `state-delta` message
   (outside the package's own stated scope, but the natural place a *later* leak could occur) —
   confirmed `LEO-POLAR` (player 2's true regime) is absent from player 1's `opponentView`,
   consistent with the pre-existing, already-`VERIFIED` `BeliefState.computeOpponentView`
   fog-of-war boundary (VR-6010) being unaffected by this package.

**The secrecy claim holds, independently confirmed at the type, code, and live-wire levels.**

## Findings

| # | Description | Severity | Owner |
|---|---|---|---|
| F1 | FR-1230's RTM row (King immutability) was not updated to also name `kingDeploymentFlow.test.ts`, even though that file's fourth test now exercises FR-1230's rejection over a real wire connection (the package's own Documentation Updates section only promised to update FR-1210/FR-1220's rows, so this isn't a broken promise — but it's a minor traceability completeness gap now that a second, wire-level test genuinely exists). | Low | `04-requirements-engineering` (fill FR-1230's Test column alongside `SessionStore.test.ts`) |
| F2 | The package's own Documentation Updates section promised "FS-101 metadata: note IP-9056 as a second implementer alongside IP-1010" — checked `docs/features/FS-101-session-turn-lifecycle.md`, its "Implemented by" line still names only IP-1010. This specific promised doc edit was not made. | Low | `08-code-implementation` (or a follow-up doc-only fix; not a code defect, purely a metadata cross-reference) |
| F3 | Scope audit found one undeclared file in the diff, `client/src/__tests__/AssetTray.test.tsx` (a 1-line fixture addition). Confirmed benign and mechanically forced by `TemplateCatalogMessage`'s new required field, not an independent behavioral change — but the package's Files to Create/Modify list should have named it. | Low | `07-implementation-planning` (note the expected downstream-fixture-touch pattern for future additive-message-field packages) |

None of the three findings are blocking; all are documentation/traceability-completeness gaps,
not functional defects.

## Conclusion

Every one of IP-9056's own Definition of Done and Verification Checklist claims independently
re-derived and confirmed true, including its own live end-to-end smoke test (reproduced fresh by
this verification with a separately written script against a separately started server instance,
using the exact same `satcom`/`GEO-EQUATORIAL` and `isr`/`LEO-POLAR` values the package's DoD
names, cross-checked against the real content files). The secrecy claim — the package's most
safety-critical assertion — was independently confirmed at the type declaration, every
construction-site's code, and a live raw-JSON-string capture, not merely trusted from the
committed test. BL-0056 is genuinely closed: `submitKingDeployment` now has exactly one
production, client-reachable call site (`websocketServer.ts:111`), reached through an unbroken,
live-tested chain from a real WebSocket connection. Build clean; full suite green at exactly 113
tests (1 shared + 88 server + 24 client), matching the package's own claim exactly. Scope stayed
essentially within the declared file set — one undeclared-but-benign fixture touch (F3) is the
only excursion, and no engine/authority-boundary file outside the package's own scope was crossed.

**IP-9056 flips `COMPLETE` → `VERIFIED`.**
