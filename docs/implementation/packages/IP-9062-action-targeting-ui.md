# IP-9062 — Client Targeting UI for Deploy/Maneuver/Task/Engage

**Package ID:** IP-9062
**Status:** READY
**Bug remediation for:** BL-0062 (Critical) — see `docs/pipeline/backlog.md`
**Owning stage-08 peer:** `08-code-implementation`
**TWBS reference:** `docs/implementation/01-technical-work-breakdown.md` §8

## Objective

Give the shipped client the input surface it has never had: a way for a player to actually
specify which asset, which target regime/asset, and which effect a Deploy/Maneuver/Task/Engage
action needs, so these four already-server-supported actions can be completed by a real human
player through the UI for the first time. No server-side engine/transport behavior changes — this
is client-input-collection only, closing a gap discovered live by `08-training-manual-authoring`
(a deployed asset renders with a blank orbital regime; Maneuver/Task/Engage send an empty payload
and are structurally unable to succeed).

## Requirements Covered

FR-1210 (King deployment — unaffected, out of scope, listed only to confirm no regression), FR-2001,
FR-2100 (asset roster/deploy — Deploy's missing regime), FR-2300, FR-2310 (F2T2E tasking — Task's
missing source/target), FR-4001, FR-4100 (effect resolution — Engage's missing
effector/target/effect), FR-5100 (orbital regime/maneuver — Maneuver's missing asset/target
regime), FR-8100, FR-8300, FR-8400 (presentation/input-submission, FS-108's already-claimed
scope), FR-9420 (training-corpus first-full-game walkthrough — this package is FR-9420's sole
remaining blocker per `docs/training/06-manual-traceability.md`).

*(Exact leaf IDs to be cross-checked against `docs/requirements/01-functional-requirements.md`
at implementation time if any of the above have since been renumbered — the FR-2xxx/4xxx/5xxx
family groupings above are accurate to the requirements baseline's own stated capability areas as
of this package's authoring.)*

## Architecture Components

Client UI only (GDS-03's client module) — the `Action`/`ActionType` wire contract, `GameEngine`
dispatch, and every server-side action handler (`deployAction.ts`, `maneuverAction.ts`,
`taskAction.ts`, `engageAction.ts`) are untouched, already `VERIFIED`, and correct as shipped.

## Interfaces

- Consumes existing `Action { type: ActionType; payload: Record<string, unknown> }` (GDS-09,
  `shared/src/interfaces.ts`) — this package changes what four call sites *put into* `payload`,
  not the interface's shape.
- Consumes existing `TemplateCatalogMessage.templates: AssetTemplate[]` (already carries
  `regimeAffinity` per template) and `.missionSets: MissionSetTemplate[]`.
- Consumes existing `StateDeltaMessage.ownState: PlayerState` (own assets, including
  `deployState`/`maneuverState`/`chainRoles`) and `.opponentView: OpponentView` (belief entries,
  the only legal Engage targets).
- **New, small, additive field**: `AssetTemplate.applicableEffects?: FiveDsEffect[]` on
  `shared/src/interfaces.ts`'s `AssetTemplate`, populated server-side in
  `TemplateRegistry.listAssetTemplates()` from each asset-type content file's existing
  `_effectAffinity` array (already present in every effector's JSON — currently a
  non-authoritative, underscore-prefixed comment field; this package promotes it to a real,
  client-visible, still server-authored field). Non-effector templates omit the field or return
  `undefined`/`[]`. This is the judgment call the TWBS §8 records — constrain the Engage effect
  picker to genuinely legal choices, mirroring every other picker in the tree.

## Files to Create/Modify

- `shared/src/interfaces.ts` — add `applicableEffects?: FiveDsEffect[]` to `AssetTemplate`.
- `server/src/engine/TemplateRegistry.ts` — `listAssetTemplates()` populates the new field from
  each template's underlying content (`_effectAffinity`); confirm the content loader
  (`server/src/content/loadContent.ts` or equivalent — verify actual filename at implementation
  time) already parses `_effectAffinity` into an in-memory shape this can read, or add the small
  additive read if not.
- `client/src/components/DeployRegimePicker.tsx` (new) — a small regime `<select>` shown alongside
  (or as a confirmation step after) an Asset Tray template click, constrained to that template's
  `regimeAffinity`. Mirrors `KingDeploymentPicker.tsx`'s plain-`<select>` style.
- `client/src/components/ManeuverPicker.tsx` (new) — asset `<select>` (own online,
  non-maneuvering assets) + target-regime `<select>`.
- `client/src/components/TaskPicker.tsx` (new) — source-asset `<select>` (own online, sensor-role
  assets: `chainRoles` intersects find/fix/track/target) + target-regime `<select>` (all 9 regime
  values — Task can search a regime even with no existing belief entry there, per FS-103 §W1's
  "a regime, an existing track, or an unresolved contact" wording; this package's Task picker
  covers the "a regime" case explicitly, and additionally lists any existing
  `OpponentView.beliefEntries` subject as an alternate target-selection convenience, submitting
  that entry's `apparentRegime` if present).
- `client/src/components/EngagePicker.tsx` (new) — effector-asset `<select>` (own online,
  engage-role assets) + target-asset `<select>` (from `OpponentView.beliefEntries`, keyed by
  `subject`) + effect `<select>` (constrained to the chosen effector's `applicableEffects`, falling
  back to all 5 `FiveDsEffect` values with a visible "server may reject" note if the field is
  `undefined` for an older/uncovered template — never silently empty).
- `client/src/App.tsx` — replace the current one-line `onSelectAction`/`onDeploy` calls that send
  empty/incomplete payloads with state that opens the relevant picker, and a submit handler that
  calls `client.sendAction(sessionId, { type: kind, payload: <real, populated fields> })` only
  once the picker's selection is complete.
- `client/src/components/AssetTray.tsx` — `onDeploy` signature extended to
  `(templateId: string, targetRegime: OrbitalRegimeLabel) => void`, or the tray opens
  `DeployRegimePicker` on template click instead of deploying immediately — implementer's choice,
  document whichever is chosen in the Definition of Done evidence.
- Test files: `client/src/__tests__/DeployRegimePicker.test.tsx`,
  `ManeuverPicker.test.tsx`, `TaskPicker.test.tsx`, `EngagePicker.test.tsx` (new, mirroring
  `KingDeploymentPicker.test.tsx`'s structure); `client/src/__tests__/App.test.tsx` (extend for
  the new picker-opening/submit flow); `server/src/engine/__tests__/TemplateRegistry.test.ts`
  (extend for the new `applicableEffects` field).

## Implementation Tasks

1. Add `applicableEffects` to `AssetTemplate` and populate it in `TemplateRegistry` from existing
   content (`_effectAffinity`) — additive, no existing field renamed or removed.
2. Build the four picker components, each a small, self-contained form using plain `<select>`s
   (no new UI library — matches `KingDeploymentPicker`'s established style), each constraining its
   own options to what the server will actually accept (regime affinity, online/role-eligible
   assets, known opponent contacts, effector-specific effects).
3. Wire all four into `App.tsx`/`AssetTray.tsx`, replacing the current empty/incomplete payload
   sends with fully-populated ones, gated so the action only submits once a complete selection
   exists (mirroring `KingDeploymentPicker`'s `disabled={!selectedMissionSetId || !selectedRegime}`
   pattern).
4. Confirm (read, don't assume) that no other call site anywhere in `client/src` still sends an
   empty/incomplete payload for these four action types once this package lands — a supersession
   sweep of `sendAction(` call sites.

## Tests to Add

- Unit tests per new picker component (option population, disabled-until-complete, correct
  payload shape on submit) — `client/src/__tests__/`.
- Extended `App.test.tsx` coverage: clicking each action opens its picker; submitting sends the
  real payload; the picker only appears when the corresponding action is legal
  (`legalityPreFilter`'s existing gating is unchanged and still governs whether the button/picker
  is reachable at all).
- Extended `TemplateRegistry.test.ts`: `applicableEffects` populated correctly per template,
  `undefined`/absent for non-effector templates.
- **Live end-to-end smoke test** (new, one-off script following the `IP-9038`/`IP-9056` live-test
  pattern, or a Playwright-driven browser test if the implementer prefers exercising the real
  rendered UI rather than just `GameClient`): start the built server, create+join a session, both
  players deploy their King, then as the active player: (a) deploy an asset with a real,
  server-accepted target regime (confirm the resulting asset's `trueRegime` is a real, non-blank
  value); (b) task a sensor against a real target regime (confirm a `BeliefStateEntry` appears at
  `'find'` precision or advances an existing one); (c) once online, maneuver an asset toward a new
  regime (confirm `maneuverState` is set); (d) once an effector is online and sufficient targeting
  precision exists, engage with a real effect (confirm the target's `activeEffects` gains an
  entry, or `destroyed` flips true for Destroy). This is the checklist item that actually closes
  BL-0062 — a unit test alone would not prove the UI can reach these server behaviors.

## Documentation Updates

- `docs/training/03-first-game.md` and `04-actions-reference.md` — once this ships and is
  `VERIFIED`, `08-training-manual-authoring` must re-run to remove the "known limitation" framing
  and replace it with a real screenshot-backed Maneuver/Task/Engage walkthrough (per
  `06-manual-traceability.md`'s own stated change-discipline note for this exact scenario).
- `docs/requirements/04-requirements-traceability-matrix.md` — update the FR-9420 row (currently
  `UNASSIGNED`/partial) once real tests exist.

## Definition of Done

- [ ] `applicableEffects` added to `AssetTemplate`, populated server-side, additive only.
- [ ] All four pickers built, each constraining its options to genuinely legal choices.
- [ ] `App.tsx`/`AssetTray.tsx` submit fully-populated payloads for all four action types; no
      remaining `sendAction` call site for these types sends an empty/incomplete payload
      (supersession sweep confirmed and recorded).
- [ ] Full automated test suite green, including the new unit tests.
- [ ] Live end-to-end smoke test passes: a real Deploy-with-regime, Task, Maneuver, and Engage
      each completed through the new UI path and confirmed server-accepted with genuine effect.
- [ ] No change to any server-side engine/transport file's behavior (a diff review confirms only
      additive `AssetTemplate`/`TemplateRegistry` changes on the server side).

## Verification Checklist

- [ ] App builds cleanly (`npm run build`, root workspace script).
- [ ] Full automated test suite passes (`npm run test`, root workspace script).
- [ ] Live end-to-end smoke test (see Tests to Add) independently reproduced by
      `09-package-verification` with its own fresh script/session, not a re-run of the
      implementer's own script.
- [ ] `git show --stat` on the implementation commit touches only the files this package names
      (or discloses any deviation explicitly, per this project's standing disclosed-deviation
      convention).
- [ ] `applicableEffects`'s values cross-checked directly against
      `server/src/content/effects/*.json`'s `allowedEffectorTemplateIds` for at least one
      effector template, confirming no drift between the two representations of the same fact.

## Dependencies

IP-8010 (VERIFIED, FS-108 — the six-panel UI this package extends), IP-3010/IP-3011 (VERIFIED —
asset templates/mission sets), IP-2010 (VERIFIED — Task/F2T2E server logic), IP-5010 (VERIFIED —
Maneuver/`Propagator` server logic), IP-4010/IP-4011 (VERIFIED — Engage/effect server logic),
IP-9056 (VERIFIED — establishes the plain-`<select>`-picker pattern this package's four new
components follow). **All dependencies already `VERIFIED` — this package is `READY` now.**

## Risks

- **Scope-boundary judgment call** (disclosed above): treating this as completing FS-103/FS-105/
  FS-108's already-approved player-facing selection workflows, not as requiring a fresh FS. If the
  owner disagrees, this routes back to `06-feature-specification` to formalize the targeting-UI
  workflow before `08-code-implementation` proceeds — flagged explicitly so the owner can object
  before build starts, not after.
- **Effect-catalog field choice**: promoting `_effectAffinity` (currently a disclosed-as-informal,
  underscore-prefixed content comment) to a real client-visible field is a small content-schema
  change: this package treats it as additive/non-breaking (existing consumers of `AssetTemplate`
  ignore fields they don't read), but any future content-authoring package should be aware the
  field is now load-bearing for the client, not just documentation.
- **UI/UX minimalism**: this package builds functionally-complete plain forms, not a polished
  interaction (e.g., no board-click-to-select-target affordance) — consistent with the project's
  existing MVP-minimalism precedent (`KingDeploymentPicker`, `Landing`), not a regression.

## Rollback Considerations

Purely additive on both server (a new optional field, ignored by anything not reading it) and
client (new components, changed call sites within `App.tsx`/`AssetTray.tsx` only). Rollback is a
straightforward revert of this package's commit with no data-migration or in-flight-session
concern (v1 has no persistence — GDS-02/NFR-6100).
