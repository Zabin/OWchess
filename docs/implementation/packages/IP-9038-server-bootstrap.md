# IP-9038 — Real Server Bootstrap (Session HTTP API + WebSocket + Static Serving)

- **Package ID:** IP-9038 · **Status:** COMPLETE (2026-08-23 — this package's own scope fully
  implemented and live-tested; surfaced a separate, pre-existing, out-of-scope blocker, BL-0056 —
  see Outstanding Issue below) · **Owning stage-08 peer:** `08-code-implementation`
- **Source:** No FS (bug remediation) — closes BL-0038, BL-0027, and a disclosed
  session-creation/join gap; see `01-technical-work-breakdown.md` §6.
- **Authorization (G3):** Covered — closes disclosed deviations in already release-plan-authorized
  packages (IP-7010, IP-3011) and completes FS-101's own already-approved W1 workflow. See TWBS §6.

## Objective

Make OW Chess actually runnable as a single process a human can start and connect a browser to:
a real WebSocket bootstrap wrapping `createTransport`/`handleConnection` around actual sockets
(BL-0038), a minimal HTTP API so a session can be created/joined at all (the disclosed
session-creation/join gap), static serving of the built client from the same process, and a
build-time fix so the server's compiled `dist/` actually contains the content JSON it reads at
runtime (BL-0027).

## Requirements Covered

FR-1110, FR-1120, FR-1121, FR-7100 (existing — now actually reachable end-to-end),
FR-9410/FR-9420 (new — this package is FR-9410's own named precondition).

## Architecture Components

`server/src/index.ts` (from scaffold to real bootstrap); a new `server/src/http/sessionApi.ts`
(HTTP handlers); a new `server/scripts/copy-content.mjs` (build-time content copy). No engine/
transport/client *logic* changes — this package wires already-`VERIFIED` pieces together and adds
the one genuinely missing surface (HTTP session create/join) plus a small client landing UI to
call it.

## Interfaces

Consumes `createGameEngine()` (IP-5010/1010/etc., already `VERIFIED`), `createTransport(...)`
(IP-7010, `VERIFIED`), `SessionStore.createSession`/`joinSession` (IP-1010, `VERIFIED`,
via `createGameEngine()`'s returned `store`). Adds two new HTTP endpoints (not a GDS-09 WebSocket
message — HTTP, since session creation/joining precedes any WebSocket connection and has no
per-turn state to push): `POST /api/sessions` and `POST /api/sessions/:sessionId/join`. No change
to any existing WebSocket message type.

## Files to Create

- `server/src/http/sessionApi.ts` — the two HTTP handlers, pure functions taking a `SessionStore`
  and returning `{ status, body }`-shaped results (testable without a real `http.Server`).
- `server/scripts/copy-content.mjs` — copies `server/src/content/{assetTypes,missionSets,effects}/
  *.json` into the matching `server/dist/content/{assetTypes,missionSets,effects}/` paths after
  `tsc -b` runs, preserving the exact relative structure `loadContent.ts`/`EffectDefinitionRegistry.ts`
  already expect (their `__dirname`-relative reads need no code change — only the missing files
  need to exist at that path post-build).
- `server/src/http/__tests__/sessionApi.test.ts`, `server/src/__tests__/copyContent.test.ts` (or
  a shell-level assertion in the build-verification step — see Tests to Add).
- `client/src/components/Landing.tsx` — "Create Game" (calls `POST /api/sessions`, then sets
  `?sessionId=...&playerId=...` and mounts `<App>`) and "Join Game" (a `sessionId` input, calls
  the join endpoint, then sets the same query params) — the piece FS-101 W1's "shareable join
  link" workflow needed and never had.
- `client/src/__tests__/Landing.test.tsx`.

## Files to Modify

- `server/src/index.ts` — replace the scaffold with: an `http.createServer` handling the two
  session routes (delegating to `sessionApi.ts`) and serving `client/dist/` statically for every
  other GET request (a small hand-written static file handler is sufficient — no new dependency;
  path-traverse-safe, serving `index.html` for any non-file path so the client's own router, if
  any, works); a `ws.WebSocketServer({ noServer: true })` attached to the same HTTP server's
  `'upgrade'` event at path `/ws`, parsing `sessionId`/`playerId` from the request's query string,
  validating both against `store` before accepting the upgrade (reject with a clear HTTP response
  if either is missing/invalid, never silently drop the upgrade), then wrapping the real `ws`
  socket into the `Connection` interface (`send`/`onMessage`/`onClose` — `ws`'s own `send`/`on('message',
  ...)`/`on('close', ...)` satisfy this trivially, per `connectionRegistry.ts`'s own doc comment)
  and calling `transport.handleConnection(sessionId, playerId, conn)`.
- `server/package.json` — `"build": "tsc -b && node ./scripts/copy-content.mjs"`.
- `client/src/main.tsx` — if `sessionId`/`playerId` are both present in the URL query string,
  behave as today (connect directly); otherwise render `<Landing>` instead of `<App>`.

## Implementation Tasks

1. Write `sessionApi.ts`: `handleCreateSession(store)` calls `store.createSession(generatedPlayerId)`
   (a server-generated `PlayerId` — `crypto.randomBytes`-based, matching `SessionStore`'s own
   session-ID entropy discipline conceptually, though `PlayerId` has no NFR-3200-level entropy
   requirement of its own since it's not a security boundary — a short random token is sufficient
   to avoid two browser tabs colliding) and returns `{ sessionId, playerId }`.
   `handleJoinSession(store, sessionId)` generates a joiner `PlayerId` the same way, calls
   `store.joinSession(sessionId, generatedPlayerId)`, and returns `{ playerId }` on success or the
   store's own rejection `reason` (mapped to HTTP 404 for "no such session", 409 for "already has
   two players"/"already joined") on failure.
2. Write `copy-content.mjs`: a small Node script (no new dependency — `node:fs`'s
   `cpSync(src, dest, { recursive: true })` per content subdirectory) run after `tsc -b` in the
   server workspace's `build` script.
3. Rewrite `server/src/index.ts`: HTTP server (routes + static file serving), WebSocket upgrade
   handling wired to `createTransport`'s `handleConnection`, using one shared `createGameEngine()`
   context for the process's lifetime (matching this project's existing "no database, in-memory
   per-session state" v1 baseline — NFR-6100).
4. Write `Landing.tsx` + wire it into `main.tsx`'s conditional render.

## Tests to Add

`sessionApi.test.ts`: create returns a valid session + playerId; join succeeds for a fresh
session and fails with the correct reason for a nonexistent/full/already-joined session (mirroring
`SessionStore.test.ts`'s own existing cases, at the HTTP-handler layer instead of the store layer
directly).
A build-verification check (either a dedicated `copyContent.test.ts` that runs the copy script
against a throwaway fixture directory and asserts the files land correctly, or — simpler and
arguably more honest since it's fundamentally a build-step concern, not a unit — a documented
manual G5-adjacent check in this package's own Verification Checklist: after a clean `npm run
build`, `find server/dist/content -name "*.json" | wc -l` matches the source content file count
exactly).
`Landing.test.tsx`: "Create Game" button calls the create endpoint and transitions to the game
view with both URL params set; "Join Game" form calls the join endpoint with the entered
`sessionId` and transitions the same way; a join failure (e.g. session full) shows the server's
own rejection reason, not a generic error.

## Documentation Updates

FS-101 metadata: note that IP-9038 closes the previously-unowned session-creation/join
HTTP+UI gap (a cross-reference addition, not a spec rewrite). `docs/requirements/04-requirements-
traceability-matrix.md`: fill `FR-9410`'s Module/Test columns (still `UNASSIGNED` until this
package's own G5 gate proves the walkthrough is genuinely followable) once `09-package-
verification` confirms it live.

## Definition of Done

- [x] A real `http.Server` accepts `POST /api/sessions` and `POST /api/sessions/:id/join`,
      returning correct playerId/error responses per the Tests to Add.
- [x] A real WebSocket connection to `/ws?sessionId=...&playerId=...` is accepted, rejected
      cleanly for an invalid session, and correctly wired to `handleConnection` — confirmed by an
      actual `ws` client connecting to a locally-started instance of this server (real HTTP create
      → real HTTP join → two real `ws` clients connecting, both receiving a genuine
      `TemplateCatalogMessage`), not only against the existing `FakeConnection`-based transport
      tests (those remain valid and unaffected; this is additional, real-socket confirmation).
- [x] `client/dist/` is served statically; `GET /` returns the built `index.html` referencing the
      real built JS bundle (confirmed via `curl` against a locally-started instance).
- [ ] **Not satisfiable by this package alone — see Outstanding Issue below.** `Landing.tsx` lets
      two separate browser contexts create-then-join the same session, but neither can ever reach
      the *active* game view: `SessionStore.getSession()` returns `null` until both players'
      secret King deployments resolve (FR-1210/1220), and **no code path anywhere — no action
      type, no WebSocket message, no client UI — ever calls `SessionStore.submitKingDeployment`
      outside test setup code.** This is a pre-existing gap this package did not introduce (dating
      to IP-1010's original implementation) and is out of this package's own Files to
      Modify/Create (fixing it needs `GameEngine.ts`'s dispatch, `shared/interfaces.ts`/
      `messages.ts`'s message schema, and new client UI — none named by this package). Live-
      confirmed via a real end-to-end smoke test (see Verification Checklist).
- [x] `find server/dist/content -name "*.json"` after a clean build matches the source content
      file count exactly (15 = 15 — BL-0027 closed).
- [x] Full G5 gate (build + full test suite) green: 105 tests total (1 shared + 84 server + 20
      client, up from 98 — 4 new `sessionApi.test.ts` + 3 new `Landing.test.tsx`).

## Verification Checklist

- [x] **G5 gate:** build clean. **G5 gate:** full test suite passes (105 tests).
- [x] A live, real end-to-end run was exercised this implementation pass (not merely committed
      tests): started the built server (`node dist/index.js`), created a session and joined it via
      real `fetch` HTTP calls, connected two real `ws` clients to `/ws?sessionId=...&playerId=...`,
      and confirmed both received a genuine `TemplateCatalogMessage`. **This same live run is what
      surfaced the King-deployment gap above** — attempting to proceed past this point (e.g.
      submitting a `pass` action) correctly receives `action-rejected`/`"session no longer
      exists"`, because the session genuinely doesn't exist yet in `SessionStore`'s terms (no
      `SessionState` is created until deployment resolves) — this is `handleConnection`'s F1 fix
      (VR-7010) behaving exactly as designed, not a regression; it just means "active game view"
      is currently unreachable by any real client, full stop, independent of this package.
      `09-package-verification` should independently re-run this same live sequence.
- [x] `server/dist/content/` contains every JSON file `server/src/content/` does (BL-0027,
      confirmed 15 = 15).
- [x] No fog-of-war or server-authority regression: the new HTTP endpoints never accept or return
      any `PlayerState`/belief-state data — only session/player identifiers.

## Outstanding Issue (discovered this pass, out of scope to fix here)

**King deployment (FR-1210/1220) has no wire-level exposure anywhere in the codebase.**
`SessionStore.submitKingDeployment` exists and is fully unit-tested (IP-1010), but no `ActionType`
covers it, no WebSocket message carries it, `GameEngine.handleAction`'s dispatch has no path for
it (it requires `session.phase === 'active'`, but a session doesn't reach `'active'` until *after*
deployment resolves — a chicken-and-egg gap), and no client component ever renders a
mission-set/regime picker or calls it. Every prior verification pass exercised King deployment
only via direct `SessionStore.submitKingDeployment(...)` calls in test setup code, which is why
this was never caught: it is invisible to any test that doesn't attempt a genuinely unscripted,
real-transport session from a cold start, exactly what this package's own live end-to-end check
just did for the first time in this project's history. **This blocks FR-9420 (the first full-game
walkthrough) and the human playtest MSTR-001 v0.4 exists to obtain** — nobody can reach an active
game today through any real client, regardless of IP-9038's own bootstrap work being correct.
Filed as **BL-0056**, Critical/blocking for the training-corpus work, recommended owner
`07-implementation-planning` (a new remediation package: a `deploy-king` action type or dedicated
message, `GameEngine` dispatch for the pre-`'active'` phase, and a client UI picker).

## Deviation note

This package's scope is broader than BL-0038/BL-0027's literal text: it also builds the
session-creation/join HTTP API and a minimal client landing UI, neither of which any prior package
was ever assigned (a verb-inventory gap — see TWBS §6 — that a WebSocket-only bootstrap would not
have surfaced, since a WebSocket connection needs a `sessionId` to connect *to*, and nothing
before this package ever produced one over the network). Disclosed here per this project's
established pattern (BL-0021/28/33/36/45/48); filed as **BL-0055** for `06-feature-specification`/
`04-requirements-engineering` to consider whether FS-101 should be updated to explicitly describe
this HTTP surface (it currently only says "a shareable join link," implicitly assuming the
mechanism producing it, without naming one).

## Dependencies

IP-1010, IP-5010 (via `createGameEngine`), IP-6010, IP-7010, IP-8010 — all `VERIFIED`. This
package adds no new dependency on an unverified package; it is purely additive wiring.

## Risks

Low-Medium — the WebSocket-upgrade wiring is the one genuinely new integration surface (attaching
`ws`'s `WebSocketServer` to a plain `http.Server`'s `'upgrade'` event is a well-trodden Node
pattern, but it is new code, not a re-composition of already-tested pieces the way the rest of
this package is). The static file serving is intentionally minimal (no caching headers, no
compression) — acceptable for a local-first, no-deployment-target v1 (MSTR-001 §5 non-goals).

## Rollback Considerations

No persisted state across restarts (unchanged from IP-7010's own note) — a server restart loses
all live sessions, acceptable for MVP scope. The static-file/HTTP-API addition is purely additive
to `server/src/index.ts`; reverting this package returns it to the inert scaffold with no other
package depending on the removed surface (nothing built on top of it yet).
