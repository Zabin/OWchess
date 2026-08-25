# IP-9056 — King-Deployment Wire Exposure

- **Package ID:** IP-9056 · **Status:** COMPLETE (2026-08-23 — implemented and live end-to-end
  tested; closes BL-0056, the sole remaining blocker to a genuinely playable game) · **Owning
  stage-08 peer:** `08-code-implementation`
- **Source:** No FS (bug remediation) — closes BL-0056; see `01-technical-work-breakdown.md` §7.
- **Authorization (G3):** Covered — completes FS-101's own already-approved W1/W2 workflow
  (secret King deployment). See TWBS §7.

## Objective

Make secret King deployment (FR-1210/1220) actually reachable by a real client: a wire message a
player can send to submit their mission-set + regime selection, a status message so a connecting/
waiting client knows it's in the pre-active `'deploying'` phase rather than getting the existing
"session no longer exists" rejection, and a client picker UI — closing the sole remaining blocker
between IP-9038's real server bootstrap and an actually-playable game.

## Requirements Covered

FR-1210, FR-1220, FR-1230 (existing — now actually reachable), FR-9420 (new — this package is
FR-9420's own named precondition, alongside IP-9038).

## Architecture Components

`server/src/engine/SessionStore.ts` (new read accessors, no change to `submitKingDeployment`'s
existing logic), `server/src/transport/websocketServer.ts` (new message case), `shared/src/messages.ts`
(two new message types), `shared/src/interfaces.ts` (extend `TemplateCatalogMessage`'s payload —
actually a `shared/src/messages.ts` change, see below), new `client/src/components/
KingDeploymentPicker.tsx`, `client/src/main.tsx` (extend the Landing/App conditional with a third
state).

## Interfaces

New `ClientToServerMessage` member: `DeployKingMessage { type: 'deploy-king'; sessionId: SessionId;
missionSetId: MissionSetId; regime: OrbitalRegimeLabel }`. New `ServerToClientMessage` member:
`DeploymentStatusMessage { type: 'deployment-status'; phase: 'deploying' | 'active'; ownDeployed:
boolean; opponentDeployed: boolean }`. `TemplateCatalogMessage` (existing, BL-0048) gains a second
field: `missionSets: MissionSetTemplate[]` (alongside its existing `templates: AssetTemplate[]`)
— additive, non-breaking. No change to `StateDeltaMessage`/`ActionMessage`/any existing type.

## Files to Modify

- `server/src/engine/SessionStore.ts` — add `hasSessionRecord(sessionId): boolean` (checks the
  internal `sessions` map directly, distinct from `getSession` which only returns a *resolved*
  `SessionState`) and `getDeploymentStatus(sessionId, playerId): { phase: 'deploying' | 'active';
  ownDeployed: boolean; opponentDeployed: boolean } | undefined` (reads `record.session`'s
  presence for `phase`, and `record.pendingKingSelections.has(...)` for each player's deployed
  flag — no change to existing fields/methods, purely additive reads).
- `server/src/engine/TemplateRegistry.ts` — add `listMissionSetTemplates(): MissionSetTemplate[]`
  (mirrors BL-0048's `listAssetTemplates()` exactly: `Array.from(this.missionSetTemplates.values())`).
- `shared/src/messages.ts` — add `DeployKingMessage`, `DeploymentStatusMessage`; add
  `missionSets: MissionSetTemplate[]` to `TemplateCatalogMessage`; add `DeployKingMessage` to
  `ClientToServerMessage`, `DeploymentStatusMessage` to `ServerToClientMessage`.
- `server/src/transport/websocketServer.ts` —
  1. `handleConnection`'s initial send (currently unconditionally calling `broadcastToOne`, which
     sends a false "session no longer exists" rejection for a real, joined-but-not-yet-deployed
     session): check `store.hasSessionRecord(sessionId)` first. If false, send the existing
     rejection (F1's behavior, unchanged, for a genuinely nonexistent session). If true, check
     `store.getDeploymentStatus(sessionId, playerId)`: if `phase === 'deploying'`, send a
     `DeploymentStatusMessage` instead of `broadcastToOne`'s `StateDeltaMessage` attempt (which
     would fail — no `SessionState` exists yet); if `phase === 'active'`, proceed with the
     existing `broadcastToOne` call unchanged.
  2. Add `handleDeployKingMessage(sessionId, playerId, msg)`: calls
     `store.submitKingDeployment(sessionId, playerId, msg.missionSetId, msg.regime)`; on rejection,
     send a `RejectedActionMessage` (reusing the existing type — a deployment rejection is
     conceptually the same "tell the client clearly why" contract as an action rejection, no new
     type needed); on acceptance, check `store.getDeploymentStatus(sessionId, playerId)` again —
     if now `'active'`, call the existing `broadcastStateDelta(sessionId)` (which now works, since
     `SessionState` exists) to both players; if still `'deploying'` (only this player has
     submitted), send both players an updated `DeploymentStatusMessage` (the submitter's own
     `ownDeployed` flips true; the opponent's `opponentDeployed` flips true) — never anything that
     reveals *what* was selected (FR-1210's secrecy requirement: `DeploymentStatusMessage` never
     carries `missionSetId`/`regime`, only boolean flags).
  3. `handleConnection`'s `onMessage` switch gains a `'deploy-king'` case calling
     `handleDeployKingMessage`.
  4. The `TemplateCatalogMessage` built on every connect (BL-0048) gains
     `missionSets: templateRegistry.listMissionSetTemplates()` alongside its existing `templates`
     field.
- `client/src/state/gameClient.ts` — add `deploymentStatus: { phase: 'deploying' | 'active';
  ownDeployed: boolean; opponentDeployed: boolean } | null` and `missionSets: MissionSetTemplate[]`
  to `GameClientState`; handle `'deployment-status'` (store it) and extend the existing
  `'template-catalog'` handler to also store `msg.missionSets`; add a `deployKing(sessionId,
  missionSetId, regime)` method sending the new message (mirroring `sendAction`'s existing shape).
- `client/src/main.tsx` — extend the `Landing` vs. `App` conditional: after `entered` (a
  sessionId+playerId are known) but before a real `state-delta` has ever arrived (i.e.
  `state.ownState === null` and `state.deploymentStatus?.phase !== 'active'`), render
  `KingDeploymentPicker` instead of `App`; once a `state-delta` arrives (which only ever happens
  once `phase === 'active'`), render `App` as today — no explicit `phase==='active'` check needed
  in `main.tsx` itself, since `App.tsx`'s own existing `!state.ownState` guard already handles
  exactly this "nothing to render yet" case; `KingDeploymentPicker` simply becomes reachable in the
  gap that guard used to leave blank.

## Files to Create

- `client/src/components/KingDeploymentPicker.tsx` — a mission-set `<select>` (options from
  `state.missionSets`) and a regime `<select>` (options from the selected mission set's own
  `kingRegimeAffinity` array — content-driven, not hardcoded, since today each mission set defines
  exactly one but the schema allows more), a submit button calling `client.deployKing(...)`, and a
  "waiting for your opponent" message once `state.deploymentStatus?.ownDeployed` is true (never
  showing what the opponent selected — only the boolean).
- `client/src/__tests__/KingDeploymentPicker.test.tsx`.
- `server/src/transport/__tests__/kingDeploymentFlow.test.ts`.

## Implementation Tasks

1. `SessionStore.ts`: `hasSessionRecord`, `getDeploymentStatus` (read-only additions).
2. `TemplateRegistry.ts`: `listMissionSetTemplates()`.
3. `shared/src/messages.ts`: the two new message types + `TemplateCatalogMessage`'s new field +
   both union updates.
4. `websocketServer.ts`: the four changes above (initial-send branch, `handleDeployKingMessage`,
   the new message-switch case, `missionSets` on the catalog message).
5. `gameClient.ts`: state fields, message handling, `deployKing` method.
6. `KingDeploymentPicker.tsx` + `main.tsx`'s render-gap wiring.

## Tests to Add

`kingDeploymentFlow.test.ts` (server, mirrors `disconnectFlow.test.ts`'s fixture style): connecting
to a joined-but-undeployed session receives a `DeploymentStatusMessage` (`phase: 'deploying'`),
never the F1 rejection; one player deploying sends both players an updated `DeploymentStatusMessage`
(`ownDeployed`/`opponentDeployed` flags correct, never leaking the selection); the second player
deploying transitions both to a real `StateDeltaMessage` (session now `'active'`); deploying twice
as the same player is rejected (FR-1230, King immutability) via `RejectedActionMessage`.
`KingDeploymentPicker.test.tsx` (client): renders mission-set options from `state.missionSets`;
selecting a mission set updates the regime options to that mission set's own `kingRegimeAffinity`;
submitting calls `client.deployKing` with the selected values; after `ownDeployed` flips, shows the
waiting message instead of the form.

## Documentation Updates

FS-101 metadata: note IP-9056 as a second implementer alongside IP-1010 (IP-1010 owns the
lifecycle logic; IP-9056 owns its wire exposure) — a cross-reference addition. RTM: fill FR-1210/
FR-1220's Test column with `kingDeploymentFlow.test.ts` once this package lands (currently reads
"via SessionStore fixture setup," which VR review should recognize was the very blind spot this
package closes).

## Definition of Done

- [x] A real client can submit a King deployment over a real WebSocket connection and receive
      correct status updates, with the opponent's selection never revealed at any point (FR-1210)
      — confirmed both by `kingDeploymentFlow.test.ts` (asserts no `deployment-status` message
      ever contains `missionSetId`/`regime`) and a live real-`ws`-client smoke test.
- [x] Once both players deploy, both receive a real `StateDeltaMessage` and reach `phase: 'active'`
      — confirmed via the same live end-to-end style check IP-9038 used: real HTTP create/join,
      two real `ws` clients, both submitting a deployment (`satcom`/`GEO-EQUATORIAL` and
      `isr`/`LEO-POLAR`), both receiving a real `state-delta` in response.
- [x] A second deployment attempt by an already-deployed player is rejected (FR-1230) — confirmed
      by `kingDeploymentFlow.test.ts`'s dedicated test.
- [x] `KingDeploymentPicker` renders real mission-set/regime options sourced from the server's own
      content (`TemplateCatalogMessage`), not hardcoded values — confirmed by
      `KingDeploymentPicker.test.tsx`.
- [x] Full G5 gate (build + full test suite) green: 113 tests total (1 shared + 88 server + 24
      client, up from 105 — 4 new `kingDeploymentFlow.test.ts` + 4 new
      `KingDeploymentPicker.test.tsx`).

## Verification Checklist

- [x] **G5 gate:** build clean. **G5 gate:** full test suite passes (113 tests).
- [x] A live, real end-to-end run: started the built server, created a session via real `fetch`,
      joined it via real `fetch`, connected two real `ws` clients, sent both `deploy-king`
      messages, and confirmed the session reaches `phase: 'active'` with both clients receiving a
      real `state-delta` — this is the specific claim BL-0056 exists to close.
      `09-package-verification` should independently reproduce this same live sequence with its
      own script, not merely re-run the committed tests.
- [x] No fog-of-war leak: `DeploymentStatusMessage` never carries `missionSetId`/`regime` for
      either player — confirmed both by direct code reading (the type declaration only has
      `phase`/`ownDeployed`/`opponentDeployed`) and by `kingDeploymentFlow.test.ts`'s explicit
      assertion against the actual serialized wire messages.

## Deviation note

One small addition beyond the two `SessionStore` accessors this package originally named
(`hasSessionRecord`, `getDeploymentStatus`): a third read-only accessor,
`getJoinedPlayerIds(sessionId): PlayerId[] | undefined`, was needed for
`broadcastDeploymentStatus` to enumerate both joined players (neither `PlayerId` is knowable from
a pre-active `SessionState`, since none exists yet — the same reasoning that motivated the other
two accessors). Same file already in scope, purely additive, no existing method's behavior
changed.

## Dependencies

IP-9038 (`VERIFIED`, confirmed via VR-9038 before this package's implementation began — this
package extends IP-9038's `websocketServer.ts`/`main.tsx` changes and deliberately waited for that
confirmation to avoid compounding an unverified base). IP-1010, IP-3011 (mission-set content),
IP-8010 — all `VERIFIED`.

## Risks

Low-Medium — the transport-layer branching (distinguishing "no session," "deploying," and
"active" in `handleConnection`'s initial send) is the one genuinely new control-flow decision;
everything else composes already-`VERIFIED` pieces (`submitKingDeployment`, `broadcastStateDelta`,
the `TemplateCatalogMessage` pattern) in a new sequence.

## Rollback Considerations

Purely additive (two new message types, two new read-only `SessionStore` methods, one new
component) — no existing message shape or method signature changes. Reverting this package
returns `handleConnection`'s initial send to today's behavior (which, per BL-0056, is broken for
any not-yet-active session) — acceptable regression scope for a rollback, matching the
already-known pre-IP-9056 state.
