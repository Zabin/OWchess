# VR-9038 — Real Server Bootstrap (Session HTTP API + WebSocket + Static Serving)

- **Package:** IP-9038 · **Commit verified:** `f2a1593` (feat(server,client): IP-9038 — real
  server bootstrap (BL-0038/BL-0027)), tree state also includes `37580e9` (pipeline journal only,
  no code) · **Verified:** 2026-08-23
- **Independence:** IP-9038 was implemented in a prior session (`f2a1593`/`b112b4a`/`b894ffd`,
  session `session_013k6T2Ri8QrGJ1gzRr3NTiN`), not this one. Full independence — no same-session
  conflict.

## Result

**VERIFIED** — 0 failed checks, 1 Low/informational finding (non-blocking).

## Definition of Done audit

| Item | Evidence | Pass/Fail |
|---|---|---|
| Real `http.Server` accepts `POST /api/sessions` and `POST /api/sessions/:id/join` | Read `server/src/http/sessionApi.ts` + `server/src/index.ts` routing; independently re-ran the live sequence against a freshly built, freshly started server (`PORT=34567 node server/dist/index.js`): `POST /api/sessions` → `201 {sessionId, playerId}`; `POST /api/sessions/:id/join` → `200 {playerId}` (second playerId distinct from the first) | Pass |
| Real WebSocket to `/ws?sessionId=...&playerId=...` accepted, rejected cleanly for invalid session, wired to `handleConnection` | Independently connected two real `ws` clients after the HTTP create+join above; both received a genuine `TemplateCatalogMessage` (`type: "template-catalog"`, 7 real asset templates matching `server/src/content/assetTypes/*.json` filenames) as their first message. Then connected a third `ws` client with `sessionId=totally-bogus-session` — upgrade is accepted (not rejected at the HTTP-upgrade layer) but the client receives `template-catalog` followed immediately by `{type:"action-rejected", reason:"session no longer exists"}` — an unambiguous, non-silent rejection via `handleConnection`→`broadcastToOne`'s existing F1 logic (VR-7010). A `/ws` connect with **no** `sessionId`/`playerId` at all does get rejected at the HTTP-upgrade layer (`400`), confirmed via `ws`'s `unexpected-response` event. See Finding F1. | Pass (functionally — see F1 for a documentation-drift note) |
| `client/dist/` served statically; `GET /` returns built `index.html` referencing real bundle | `curl -i http://localhost:34567/` → `200`, body is the real Vite-built `index.html` referencing `/assets/index-Dag9Rltf.js` (matches the actual hashed filename in `client/dist/assets/`, confirmed by directory listing) | Pass |
| King-deployment DoD item (marked unchecked, "not satisfiable by this package alone") | See BL-0056 independent confirmation below — claim holds | Confirmed accurate, correctly left unchecked |
| `find server/dist/content -name "*.json"` == source count (15) | Independently counted both trees after a clean rebuild (see Test run below): `server/src/content` = 15 files, `server/dist/content` = 15 files, identical relative paths and filenames in both (`assetTypes/` ×7, `effects/` ×5, `missionSets/` ×3) | Pass |
| Full G5 gate green: 105 tests (1 shared + 84 server + 20 client) | Independently reproduced: 1 + 84 + 20 = 105, exact match | Pass |

## Verification Checklist audit

| Item | Evidence | Pass/Fail |
|---|---|---|
| G5 gate: build clean, full suite passes (105 tests) | See Test run below | Pass |
| Live real end-to-end run (not just committed tests) | Independently re-ran the implementer's own smoke sequence from scratch (real `fetch` HTTP calls, two real `ws` clients) — reproduced identically: both clients get a genuine `TemplateCatalogMessage`, and the "session doesn't exist yet" `action-rejected` behavior is present and, on inspection, is `handleConnection`'s pre-existing F1 fix (VR-7010) firing correctly, not a regression this package introduced | Pass |
| `server/dist/content/` contains every JSON file `server/src/content/` does | Directly counted and diffed both trees post-clean-build — 15 = 15, same filenames | Pass |
| No fog-of-war/server-authority regression — HTTP endpoints only ever handle session/player identifiers | Read `sessionApi.ts` in full: `handleCreateSession`/`handleJoinSession` only ever construct/return `{sessionId, playerId}`/`{reason}`; no `PlayerState`, `Asset`, or belief-state field is read, constructed, or returned anywhere in the file or in `index.ts`'s two route handlers | Pass |

## Requirements audit

- **FR-1110/1120/1121** (create/join/reject-over-capacity) — pre-existing rows in the RTM point to
  `IP-1010`/`SessionStore.test.ts` (both `VERIFIED`); IP-9038 doesn't re-implement this logic, it
  exposes `SessionStore.createSession`/`joinSession` over HTTP for the first time. Independently
  confirmed `sessionApi.ts` calls these exact `SessionStore` methods with no bypass. RTM rows
  correctly left unedited (the underlying FR is already traced to its real owner, IP-1010).
- **FR-7100** (WebSocket push notifications) — pre-existing row points to `IP-7010`/
  `websocketServer.test.ts` (`VERIFIED`). IP-9038 makes this reachable over a real socket for the
  first time; confirmed `index.ts`'s upgrade handler calls the unmodified `transport.handleConnection`.
  RTM row correctly left unedited.
- **FR-9410/FR-9420** (training-corpus install / first-full-game walkthroughs) — the package's own
  Requirements Covered lists these as "new — this package is FR-9410's own named precondition,"
  and its Documentation Updates section proposed filling the RTM's Module/Test columns for FR-9410
  "once `09-package-verification` confirms it live." Checked the RTM
  (`docs/requirements/04-requirements-traceability-matrix.md`): both rows are still `UNASSIGNED`
  across Feature Spec/Implementation Package/Test. Left unedited by this run — IP-9038 is only a
  *precondition* (a running, connectable server), not FR-9410's actual training-corpus content,
  and FR-9420 remains genuinely blocked end-to-end by BL-0056 (no client can reach an active game
  to screenshot). Filling these cells now, before `08-training-manual-authoring` produces the
  actual walkthrough module/test that satisfies them, would misrepresent the requirement as closed.
  This is judged a reasonable, honest non-action, not a gap in IP-9038's own claims — flagged as
  Finding F2 for whoever picks up the training-corpus work next.

## Test run

Clean-state rebuild performed by this verification pass:

```
rm -rf node_modules server/node_modules client/node_modules shared/node_modules \
       server/dist client/dist shared/dist \
       server/tsconfig.tsbuildinfo client/tsconfig.tsbuildinfo shared/tsconfig.tsbuildinfo
npm install
npm run build
npm test
```

(Note: an intermediate `npm run build` run without also clearing the stale `tsconfig.tsbuildinfo`
files produced an empty `server/dist`/no `index.js` — `tsc -b`'s incremental cache considered the
build already up to date. This is an artifact of this verification session's own two-pass rebuild,
not a defect in IP-9038's `build` script; a genuinely fresh clone has no stale `tsbuildinfo` to
begin with. Removing the `tsbuildinfo` files and rebuilding produced the expected output.)

- `npm install`: clean, 178 packages, no errors (5 pre-existing audit advisories, unrelated to
  this package, not investigated further — out of scope).
- `npm run build`: clean across `shared`, `server` (`tsc -b && node ./scripts/copy-content.mjs`),
  `client` (`tsc -b && vite build`). No errors/warnings beyond Vite's normal build summary.
- `npm test` (`vitest run` per workspace):
  - `shared`: 1 test file, 1 test passed.
  - `server`: 17 test files, 84 tests passed (includes `src/http/__tests__/sessionApi.test.ts`, 4
    tests).
  - `client`: 6 test files, 20 tests passed (includes `src/__tests__/Landing.test.tsx`, 3 tests).
  - **Total: 105 tests, matching the package's own claim exactly.**

Live bootstrap smoke test (this verification's own independent script, `server/smoke-verify.mjs`,
written and run against the freshly built `server/dist/index.js` on `PORT=34567`, then deleted —
not committed):

```
CREATE 201 { sessionId: 'session-DrZuu_Mn0ef5FHHamvbZWA', playerId: 'player-TT1-aoEEdkY' }
JOIN   200 { playerId: 'player-AtML2ArcXPU' }
ws1 first message type: template-catalog
ws2 first message type: template-catalog
GET / -> 200, real built index.html referencing /assets/index-Dag9Rltf.js
bogus-session ws connect -> accepted at upgrade, then action-rejected "session no longer exists"
missing-params ws connect -> rejected at upgrade, HTTP 400
```

All matches the package's own claimed live-test sequence and result.

## Scope audit

`git show --stat f2a1593` confirms the diff touches exactly: `client/src/__tests__/Landing.test.tsx`,
`client/src/components/Landing.tsx`, `client/src/main.tsx`, `server/package.json`,
`server/scripts/copy-content.mjs`, `server/src/http/__tests__/sessionApi.test.ts`,
`server/src/http/sessionApi.ts`, `server/src/index.ts`, plus ledger docs
(`00-master-build-plan.md`, `packages/INDEX.md`, the package file itself, `pipeline/backlog.md`).
This is exactly the package's declared Files to Create/Modify set — no excursion into
`GameEngine.ts`, `BeliefState.ts`, `SessionStore.ts`, `shared/src/interfaces.ts`, or any other
engine/transport/authority-boundary file. `sessionApi.ts` independently read line-by-line: never
constructs, reads, or forwards `PlayerState`/`Asset`/belief-state data — only `sessionId`/
`playerId` strings and rejection `reason` strings. No fog-of-war or server-authority boundary
crossed.

## Independent confirmation of BL-0056

Re-derived from the actual source, not the package's narrative:

1. **`ActionType` union** (`shared/src/interfaces.ts:104`):
   `'deploy' | 'maneuver' | 'task' | 'engage' | 'pass' | 'resign'`. No king-deployment action type
   exists; `'deploy'` is asset deployment (`deployAction.ts`), a different mechanism entirely from
   `SessionStore.submitKingDeployment`.
2. **Call sites of `submitKingDeployment`**: grepped the entire tree. Every call site outside
   `docs/` prose is inside a `__tests__` directory (`SessionStore.test.ts`, `deployAction.test.ts`,
   `taskAction.test.ts`, `TurnManager.test.ts`, `GameEngine.winConditions.test.ts`,
   `createGameEngine.wiring.test.ts`, `websocketServer.test.ts`, `disconnectFlow.test.ts`). Zero
   call sites in `server/src` production code or `client/src` outside tests. (A newer package,
   `docs/implementation/packages/IP-9056-king-deployment-wiring.md`, has since been authored to
   close this gap — found already in the tree from a concurrent session, not part of this
   package's own scope or this verification.)
3. **`GameEngine.handleAction`** (`server/src/engine/GameEngine.ts:48-53`): `const session =
   this.store.getSession(sessionId); if (!session) return {accepted:false, ...}; if
   (session.phase !== 'active') return {accepted:false, ...}`. Confirmed: every action, including
   `'deploy'`, is rejected unless a `SessionState` exists **and** its phase is `'active'`.
4. **`SessionStore.getSession`** (`server/src/engine/SessionStore.ts:137-139`): returns
   `this.sessions.get(sessionId)?.session ?? undefined` — the `.session` field on the internal
   record, distinct from the record itself (which exists once created/joined). Read
   `submitKingDeployment`'s body: it is the method that populates `.session` once both players'
   deployments are recorded. Before that, `getSession` genuinely returns `undefined` for a fully
   created-and-joined session — confirming the "chicken-and-egg" gap exactly as described.
5. **Client UI**: searched `client/src` for `missionSet`/`regime`/king-deployment references.
   Found only two display-only components (`MissionKingStatus.tsx`, `IntelPanel.tsx`) that read
   already-resolved `ownState.king.missionSet`/`.trueRegime` and
   `entry.apparentRegime` for rendering — neither submits anything. No picker, form, or button
   calling any deployment endpoint/action exists anywhere in the client tree outside tests.

**BL-0056's claim is confirmed accurate — neither overstated nor understated.** No wire-level path
to `submitKingDeployment` exists anywhere outside test setup code; the phase-gating gap is real and
correctly attributed to IP-1010's original data model, not to IP-9038.

## Findings

| # | Description | Severity | Owner |
|---|---|---|---|
| F1 | The WS-upgrade handler in `server/src/index.ts` only validates that `sessionId`/`playerId` are *present* before accepting the upgrade — it does not validate them against the store as the package's own Files-to-Modify prose describes ("validating both against `store` before accepting the upgrade... reject with a clear HTTP response if either is missing/invalid"). An invalid/nonexistent `sessionId` is instead accepted at the upgrade layer and rejected one message later via the pre-existing `broadcastToOne` "session no longer exists" path. Functionally this still delivers a clean, unambiguous, non-silent rejection (the DoD/Checklist's actual acceptance criterion), and doing full store validation pre-upgrade as literally written would incorrectly reject even a legitimately created-and-joined session, since `getSession()` also returns `undefined` pre-deployment (see BL-0056) — so the implementation's actual behavior is the more correct choice. This is a documentation-drift gap between the package's task prose and what was (correctly) built, not a functional defect. | Low | `07-implementation-planning` (correct the package's Files-to-Modify wording, or note the deliberate divergence) |
| F2 | FR-9410/FR-9420's RTM rows remain `UNASSIGNED` despite the package's Documentation Updates section proposing to fill FR-9410's Module/Test columns once this verification confirmed the bootstrap live. Left unedited by this verification: IP-9038 is only FR-9410's named *precondition* (a connectable server), not the training-corpus content/test that would actually satisfy the requirement, and FR-9420 remains genuinely unreachable end-to-end pending BL-0056. Filling the cells now would overstate closure. | Low | `08-training-manual-authoring` / `04-requirements-engineering` (fill once real walkthrough content/tests exist) |

Neither finding is blocking. Both are informational/documentation-scoped.

## Conclusion

Every one of IP-9038's own Definition of Done and Verification Checklist claims independently
re-derived and confirmed true, including its own live end-to-end smoke test (reproduced fresh by
this verification with a separate script against a separately-started server instance) and its
BL-0027 content-copy fix (byte-for-byte file-count match on a genuinely clean rebuild). The
package's honest disclosure of BL-0056 (King deployment has no wire-level exposure) is
independently confirmed accurate at the code level — the `ActionType` union, `GameEngine`
dispatch, `SessionStore.getSession` behavior, and the full absence of any non-test caller all match
the package's narrative exactly. BL-0056 is a genuine, correctly-scoped, out-of-scope finding for
IP-9038 to have surfaced, not a defect in IP-9038 itself. Scope stayed within the declared file
set; no server-authority or fog-of-war boundary was touched.

**IP-9038 flips `COMPLETE` → `VERIFIED`.**
