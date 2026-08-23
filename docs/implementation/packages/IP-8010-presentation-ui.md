# IP-8010 — Presentation / UI

- **Package ID:** IP-8010 · **Status:** COMPLETE (2026-08-23 — remediation for VR-8010's High
  finding implemented, ready for a fresh `09-package-verification` pass) · **Owning stage-08
  peer:** `08-code-implementation`
- **Source:** FS-108 (`docs/features/FS-108-presentation-ui.md`), FEAT-8000
- **Authorization (G3):** Covered by the release plan.

## Objective

Implement the React client: all six GDS-08 panels (orbital board, action menu, asset tray,
mission/King status, intel panel, event log), the client-side legality pre-filter (resolving
BL-0004), and `ActionMessage` submission — grounded visually in the confirmed ZabOW reference
(MSTR-001 §4).

## Requirements Covered

FR-8100, FR-8200, FR-8300, FR-8400, FR-8500, NFR-4100, NFR-4200, NFR-7100.

## Architecture Components

Client UI (`client/src/`) — the sole consumer of every other module's already-defined output; it
computes nothing about game truth or belief-state itself (GDS-02's client-architecture
constraint).

## Interfaces

Consumes `StateDeltaMessage`/`RejectedActionMessage`/`DisconnectNotification` (IP-7010); submits
`ActionMessage`/`DisconnectResponse`. Uses the bounded, read-only legality-rule copy generated from
`shared/` (IP-0010) for the pre-filter — never redefines the rules independently.

## Files to Create

- `client/src/components/OrbitalBoard.tsx`, `ActionMenu.tsx`, `AssetTray.tsx`,
  `MissionKingStatus.tsx`, `IntelPanel.tsx`, `EventLog.tsx`
- `client/src/legality/legalityPreFilter.ts` (the bounded rule copy, generated from `shared/`'s
  types — a pure function, not duplicated hand-written rules)
- `client/src/state/gameClient.ts` (WebSocket connection, `StateDeltaMessage` handling, client-
  local UI state per FS-108 §State Changes)
- `client/src/__tests__/legalityPreFilter.test.ts`, `client/src/__tests__/OrbitalBoard.test.tsx`,
  `client/src/__tests__/fogOfWarBoundary.test.tsx`

## Implementation Tasks

1. `gameClient.ts`: WebSocket connection, dispatch `StateDeltaMessage` into component state,
   handle `DisconnectNotification` (render connectivity-lost UI + wait/cancel choice, per FS-108
   §Error Handling) and `RejectedActionMessage` (shown distinctly from a pre-filtered "not
   available" case).
2. `legalityPreFilter.ts`: given the client's own `PlayerState` + `activeTurn`, compute which
   actions are currently legal (AP/precision/online-state preconditions), matching the server's
   own legality computation as of the last received state (NFR-4200's one permitted race
   exception).
3. Six panel components, each rendering only from `ownState`/`opponentView` (never independently
   inferring opponent truth) — `OrbitalBoard` distinguishes own/known-opponent/unknown contacts
   per GDS-08's palette; `AssetTray` shows cost/time-to-online, disabled-with-reason for
   unaffordable templates (not hidden); `EventLog` appends `EventRecord`s in order.
4. Initial render (W1) and reconnect use the same code path (a full `StateDeltaMessage` in both
   cases) — no separate "resume" render logic.

## Tests to Add

`legalityPreFilter.test.ts`: pre-filter output matches a set of known server-legality fixtures
(Test, per FS-108's Verification Plan split).
`fogOfWarBoundary.test.tsx`: a type-level/structural test asserting no component ever accepts a
`PlayerState`-shaped prop where `OpponentView` is expected (the specific property FS-108's
Verification Plan calls out).
`OrbitalBoard.test.tsx`: own/known/unknown markers render with visually distinct classes/props
(Demonstration is primary per FS-108, but this smoke-level render test still guards against a
regression removing the distinction entirely).

## Documentation Updates

FS-108 metadata: `**Implemented by:** IP-8010`.

## Definition of Done

- [x] All six panels render from a `StateDeltaMessage` fixture, initial-render and reconnect paths
      identical (`App.test.tsx`: reconnect delivers the same message shape through the identical
      code path, no separate "resume" branch exists in `App.tsx`).
- [x] Pre-filter matches server legality on the fixture set (`legalityPreFilter.test.ts`);
      fog-of-war boundary test passes (`fogOfWarBoundary.test.tsx`).
- [ ] Manual demonstration pass against the ZabOW reference's visual/UX bar — **not performed this
      pass** (no visual styling was authored beyond semantic class names/`data-testid` hooks;
      genuinely a Demonstration-only gap per FS-108's own Verification Plan, left open — see
      Deviation note).

## Verification Checklist

- [x] **G5 gate:** build clean. **G5 gate:** full test suite passes (98 total: 1 shared + 80
      server + 17 client, as of the VR-8010 remediation — see that section for the count history).
- [x] FS-108 Acceptance Criteria mapped to passing tests/demonstration, split Test vs. Demonstration
      exactly as FS-108's Verification Plan specifies (resolving BL-0008) — Test: legality
      pre-filter, fog-of-war boundary, panel-render smoke tests. Demonstration: visual/UX polish,
      not performed this pass (see above).
- [x] No component holds or logs a raw `PlayerState` for the opponent (Inspection — `grep -rn
      "PlayerState" client/src` confirms every usage is `ownState`, never an opponent-facing prop;
      `OpponentView`/`opponentView` is the only type any component accepts for opponent data).

## Deviation note

This package implements the full component/state/legality logic FS-108 describes, all
automated-Test-verifiable criteria passing, but does **not** include the visual styling (CSS,
layout, the ZabOW-reference palette/composition) that would make the Demonstration half of FS-108's
Verification Plan checkable — components render semantic markup with `data-testid` hooks and plain
text content only. Filed as BL-0039 for a follow-up styling pass (or `09-content-review`-adjacent
visual QA) before this Feature can be considered fully done against FS-108's own bar, which
explicitly treats visual/UX correctness as load-bearing, not optional polish.

## Remediation (VR-8010, 2026-08-23)

`docs/implementation/verification/VR-8010-presentation-ui.md` returned this package with 1 High
finding (F1, BL-0048) and 1 Low finding (F2, BL-0049, not this package's own defect — see below).
This section plans F1's fix; `08-code-implementation` executes it, then re-submits for a fresh
`09-package-verification` pass.

**F1 (BL-0048) — no channel delivers `AssetTemplate` data to the client.** FS-108 itself states
"Interfaces Used: ... No new interface," which VR-8010 confirmed was wrong: `AssetTemplate`
content lives only in `server/src/content/`/`TemplateRegistry`, GDS-09 never defines a
template-catalog channel, and `main.tsx` hardcodes `deployableTemplates: []`.

**Decision: a new, one-shot WebSocket message (`TemplateCatalogMessage`), not a shared static
catalog.** Considered relocating the asset-type/mission-set JSON content into `shared/src/` so
both server and client could import it directly at build time with no wire message at all — but
this would (a) touch `08-content-authoring`'s file ownership for no behavioral gain, (b)
reintroduce a JSON-resolution/dist-copy problem in the same family as the already-tracked BL-0027
(`tsc -b` doesn't copy runtime JSON into `dist/`), and (c) contradict the very reason IP-7010's
transport layer already exists: the server is the sole place client-facing data gets assembled and
served. A new message type reuses the existing, already-proven wire-message pattern (the same
pattern `ActionMessage`/`StateDeltaMessage`/`DisconnectNotification` already use), needs no new
build tooling, and keeps `AssetTemplate` content exactly where content-authoring already owns it.
This is additive to GDS-09/FS-108 — `03-architecture-design-synthesis`/`06-feature-specification`
should formally adopt it in their own next touch (same disclosed-deviation pattern as BL-0021/28/
33/36/45); it is not blocking for this fix.

- **Files to Modify:**
  - `shared/src/interfaces.ts` — add `AssetTemplate`/`MissionSetTemplate` interfaces, moved
    verbatim from `server/src/engine/TemplateRegistry.ts` (pure relocation of a type declaration
    that has no logic of its own — no behavior change).
  - `shared/src/messages.ts` — add
    `interface TemplateCatalogMessage { type: 'template-catalog'; templates: AssetTemplate[] }`;
    add it to the `ServerToClientMessage` union.
  - `server/src/engine/TemplateRegistry.ts` — import `AssetTemplate`/`MissionSetTemplate` from
    `@owchess/shared` instead of declaring them locally; add
    `listAssetTemplates(): AssetTemplate[]` returning `Array.from(this.assetTemplates.values())`
    (the "list all," not just "get by id," accessor the transport layer needs).
  - `server/src/transport/websocketServer.ts` — `createTransport` gains a 4th parameter,
    `templateRegistry: TemplateRegistry`; in `handleConnection`, immediately after
    `registry.register(...)` and before (or alongside) the existing `broadcastToOne` call, send
    that one connection a `TemplateCatalogMessage` built from
    `templateRegistry.listAssetTemplates()` — once per connection, not on every subsequent
    `StateDeltaMessage` push, since template data is static and identical for both players.
  - `server/src/transport/__tests__/websocketServer.test.ts`,
    `server/src/transport/__tests__/disconnectFlow.test.ts` — update every `createTransport(...)`
    call site to pass `ctx.registry` (already returned by `createGameEngine()`, per
    `server/src/engine/createGameEngine.ts`'s existing `return { store, engine, registry, ... }`)
    as the 4th argument.
  - `client/src/state/gameClient.ts` — add `deployableTemplates: AssetTemplate[]` to
    `GameClientState` (initial value `[]`); in `handleMessage`, add a `'template-catalog'` case
    that stores `msg.templates` into state and notifies subscribers, matching the existing
    per-message-type handling pattern already used for `'state-delta'`/`'action-rejected'`/etc.
  - `client/src/App.tsx` — drop the `deployableTemplates` prop from `AppProps` entirely; read
    `state.deployableTemplates` from the existing `GameClientState` subscription instead (the same
    subscription `ownState`/`opponentView`/`activeTurn` already come from) — this makes the tray's
    data genuinely reactive instead of a value frozen at mount time.
  - `client/src/main.tsx` — remove the now-obsolete `deployableTemplates={[]}` prop from the
    `<App>` call.
  - `client/src/__tests__/App.test.tsx` — update the 4 existing `render(<App .../>)` call sites to
    drop the removed prop.

- **Test to add:** a new `client/src/__tests__/AssetTray.test.tsx` (VR-8010 confirmed none
  currently exists) rendering `<App>` with a `FakeSocket`, delivering a `'template-catalog'`
  message with real, non-default template data (at least one affordable and one unaffordable
  template given a constrained `apRemaining`), then asserting: the tray shows both templates'
  cost/time-to-online text; the unaffordable one is rendered disabled with a reason (FR-8300's
  "disabled-with-reason, not hidden" rule); a subsequent `'state-delta'` message does not clear the
  previously-delivered template list (confirming it persists across ordinary state pushes, not just
  the initial connect).

**Definition of Done additions:**
- [x] F1 fixed: a `TemplateCatalogMessage` is sent once per connection and correctly populates
      `AssetTray` with real, non-empty, non-default template data; regression test
      (`AssetTray.test.tsx`, 2 tests) passes.
- [x] Full G5 gate (build + full suite) re-run green after the fix: 98 tests total
      (1 shared + 80 server + 17 client), up from 96 (2 new `AssetTray.test.tsx` tests).

**F2 (BL-0049) is explicitly out of this package's remediation scope** — VR-8010 attributed it to
IP-4010 (`engageAction.ts` never checking `chainRoles` for `'engage'`), not to IP-8010's own code;
it is tracked separately and does not block IP-8010's re-verification.

**Verification Checklist addition:** re-submit to `09-package-verification` for a fresh,
independent pass once F1 lands — the previously-`Pass`-audited items (fog-of-war rendering
boundary, legality pre-filter parallel-implementation claim, panel-render smoke tests) are
unaffected by this remediation and don't need re-proving, but the whole package still needs a
fresh VR per this project's standing methodology.

## Dependencies

Every other package in this plan (IP-0010, 1010, 2010, 3010, 3011, 4010, 4011, 5010, 6010, 7010 —
all `VERIFIED`), matching FS-108's own stated Dependencies field exactly ("every other Feature").

## Risks

Low-Medium (per the catalog) — mostly implementation volume (six panels, many states), not open
design uncertainty; substantially de-risked by the confirmed ZabOW visual reference. The largest
package in the plan by dependency count, making it the natural place a late-discovered upstream gap
would surface first (all upstream `VERIFIED` gates funnel here).

## Rollback Considerations

No persisted client state beyond browser-local UI conveniences; a bad render is fixed forward with
no migration concern.
