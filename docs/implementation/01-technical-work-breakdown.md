# Technical Work Breakdown

- **Owned by:** `07-implementation-planning` · **Status:** authored 2026-08-22 · **Source:** all
  8 approved Feature Specifications (`docs/features/FS-101` through `FS-108`), grounded in
  ADR-0001 (TypeScript full-stack) and GDS-03/07/09.

## 0. Toolchain (picked here, per this stage's ownership — ADR-0001 confirms the stack, not the
   specific tools)

No code exists yet; this is the first stage authorized to name concrete commands. Proposed,
recorded as this stage's own decision (not yet exercised — the first package to run, IP-0010,
proves it out):

- **Layout:** npm workspaces monorepo — `shared/` (types + message schema, GDS-09 as source),
  `server/` (Node.js + TypeScript engine/transport), `client/` (React + TypeScript, Vite).
- **Build:** `npm run build` — TypeScript project-references build across all three workspaces.
- **Test:** `npm test` — Vitest across all three workspaces (unit tests for `shared`/`server`
  logic; Vitest + React Testing Library for `client` components).
- **Start (dev):** `npm run dev` — server (tsx watch) + client (Vite dev server) concurrently.
- These are this stage's working assumption per its own authority to pick the toolchain once
  ADR-0001 exists (R-207, testing-tooling research, remains `PLANNED` — not blocking, since Vitest/
  RTL are the ecosystem-standard choice for this exact stack; IP-0010's own Verification Checklist
  is where this gets proven, not assumed further downstream).

## 1. Decomposition principle

One package per Feature Specification for pure-logic Features (no code/content split needed);
a **code/content split** for the two Features whose scope includes data templates a
`08-content-authoring` peer, not `08-code-implementation`, owns (FS-102's mission-set/asset-type
templates; FS-105's Five-D's effect-definition parameters) — mixing engine logic and content data
in one package would blur the stage-08 peer boundary the skills themselves draw. Plus one
foundational, no-FS scaffold package (IP-0010) every other package depends on.

## 2. Verb inventory (mandatory check, per capability)

| Capability | resolve | render | apply | persist | review |
|---|---|---|---|---|---|
| Turn/session lifecycle (FS-101) | IP-1010 (win-condition checks) | IP-8010 (turn/AP/status panel) | IP-1010 (AP spend, phase transitions) | IP-1010 (`SessionState`/`PlayerState` in-memory, GDS-07) | `09-package-verification`/`10-integration-review` |
| Asset roster (FS-102) | IP-3010 (deploy/online-lifecycle logic) | IP-8010 (asset tray) | IP-3010 (cost deduction) | IP-3010 (`Asset` records) | `09`/`10` |
| Sensing/F2T2E (FS-103) | IP-2010 (precision advancement, decay) | IP-8010 (intel panel) | IP-2010 (`applyTasking`) | IP-2010 (`BeliefStateEntry` per-player, GDS-07) | `09`/`10` |
| Orbital mechanics (FS-104) | IP-5010 (`currentRegime`, `planManeuver`) | IP-8010 (orbital board) | IP-5010 (`advance`, maneuver completion) | IP-5010 (`Asset.trueRegime`/`maneuverState`) | `09`/`10` |
| Effect resolution (FS-105) | IP-4010 (engagement gating/dispatch) | IP-8010 (event log, effect markers) | IP-4010 (`resolveEngagement`, `tickActiveEffects`); IP-6010 (`applyDeception`, the Deceive path specifically) | IP-4010 (`EffectStateEntry`, denial-streak) | `09`/`10` |
| Fog-of-war (FS-106) | IP-6010 (`computeOpponentView`, `applyDeception`) | IP-8010 (own/known/unknown render — consumes, doesn't compute) | IP-6010 (single construction point) | n/a (derived per-message, never stored server-side beyond `PlayerState`) | `09`/`10` (this Feature's own dedicated test surface) |
| Transport (FS-107) | IP-7010 (message routing) | n/a (transport, not presentation) | IP-7010 (push, disconnect notify/choice) | n/a (stateless relay over `GameEngine`'s state) | `09`/`10` |
| Presentation (FS-108) | IP-8010 (client-side legality pre-filter) | IP-8010 (all six panels) | IP-8010 (`ActionMessage` submission) | n/a (client-local UI state only, FS-108 §State Changes) | `09`/`10` |

Every verb has a named package or an explicit "n/a" with reason (e.g. fog-of-war has no
independent `persist` verb by design — GDS-06's invariant is that opponent-facing state is
*computed per-message*, never stored, so a `persist` cell here would itself be a defect). No
silent gaps.

## 3. Packages and split rationale

| Package | FS/BL source | Owning stage-08 peer | Split rationale |
|---|---|---|---|
| IP-0010 | — (foundational scaffold) | `08-code-implementation` | No FS specifies project scaffolding; every other package depends on `shared/` types + the monorepo build existing first. Named explicitly rather than left implicit, since a guessed scaffold is exactly the kind of drift this skill's quality gate forbids. |
| IP-1010 | FS-101 (FEAT-1000) | `08-code-implementation` | Single coherent `TurnManager`/`GameEngine` session-and-turn-loop unit; no code/content split needed (no data templates in scope). |
| IP-3010 | FS-102 (FEAT-3000), code portion | `08-code-implementation` | Template-registration/deploy/online-lifecycle *mechanism*. |
| IP-3011 | FS-102 (FEAT-3000), content portion | `08-content-authoring` | The 3 mission-set + 6 asset-type *data* templates — a content package, per the skill's own code/content peer split; depends on IP-3010's registration mechanism existing to hold the data. |
| IP-2010 | FS-103 (FEAT-2000) | `08-code-implementation` | `BeliefState` tasking/precision/decay logic; no content split (no data templates in this Feature's scope). |
| IP-5010 | FS-104 (FEAT-5000) | `08-code-implementation` | `Propagator` — one coherent module boundary, including the newly-adopted Maneuver Cost Table's arithmetic. |
| IP-4010 | FS-105 (FEAT-4000), code portion | `08-code-implementation` | `EffectResolver` engagement gating/dispatch/degrade-stacking/denial-streak *mechanism*. |
| IP-4011 | FS-105 (FEAT-4000), content portion | `08-content-authoring` | The Five D's effect-definition *parameters* (durations, the mission-denial threshold) — content, depends on IP-4010's mechanism existing to consume it. |
| IP-6010 | FS-106 (FEAT-6000) | `08-code-implementation` | `BeliefState.computeOpponentView` + the structural `PlayerState`/`OpponentView` type boundary — deliberately thin and separately packaged, matching the Feature's own "dedicated test surface" design intent (not folded into IP-2010, even though both touch `BeliefState`, because FS-106's own Scope explicitly separates "producing belief-state content" from "enforcing what leaves the server"). **Also owns `BeliefState.applyDeception`** (GDS-09) — a belief-mutation method neither FS-103/FS-105 claimed; assigned here during this planning pass (§Verb inventory gap, closed) since IP-6010 already owns `BeliefState`'s mutation surface for the enforcement boundary. |
| IP-7010 | FS-107 (FEAT-7000) | `08-code-implementation` | WebSocket transport/session-continuity — a distinct runtime concern (network boundary) from every engine module above. |
| IP-8010 | FS-108 (FEAT-8000) | `08-code-implementation` | Client UI — one coherent presentation-layer package over every other package's already-defined output; not split further since GDS-08's six panels share one render/input-submission loop and one client-side legality pre-filter, not six independent concerns. |

No supersession sweep applies — this is the project's first implementation pass; there is no
existing model any package retires (recorded here as the explicit, positive "nothing to sweep"
result the quality gate asks for).

## 4. Sequencing (mirrors the Feature Dependency Graph, `docs/feature-planning/04-feature-
   dependency-graph.md`)

```
IP-0010
  └─▶ IP-1010 ──▶ IP-3010 ──▶ IP-3011 ──▶ IP-2010 ──▶ IP-6010 ──┬─▶ IP-7010 ──▶ IP-8010
                                                                  │
      IP-5010 (parallel, after IP-1010/IP-3010) ───────────────────────────────┤
      IP-4010 ──▶ IP-4011 (after IP-6010, needs applyDeception) ──────────────┘
```

Critical path (6 packages, matching the release plan's critical path FEAT-1000→3000→2000→6000→
7000→8000): **IP-1010 → IP-3010 → IP-2010 → IP-6010 → IP-7010 → IP-8010** (IP-3011 rides alongside
IP-3010 without extending the path — content authoring can proceed once the registration mechanism
is `VERIFIED`, in parallel with IP-2010's own work). IP-5010 is off the critical path but a hard
dependency of IP-8010. **IP-4010/IP-4011 moved off the "parallel with IP-2010" position originally
planned**: authoring IP-4010 surfaced that `BeliefState.applyDeception` (GDS-09) had no assigned
owner in the initial pass; it's now assigned to IP-6010 (§3 table), which makes IP-4010 depend on
IP-6010 rather than run parallel to it. All three of IP-5010/IP-4010/IP-4011 must reach `VERIFIED`
before IP-8010 is `READY` (FS-108 depends on every other Feature), even though none of them
lengthen the 6-package critical path itself.

## 5. Authorization (G3)

All 11 packages implement Features the current, owner-approved release plan
(`docs/feature-planning/01-release-plan.md`) already buckets into the single MVP release, in
exactly the shape their source FS describes — release-plan coverage is each package's G3 basis
(cited per-package below; no package here diverges from or falls outside that plan). No fresh
owner go-ahead is required for any of these 11 packages on that basis. **This does not waive G3
generally** — a future package outside the release plan, or diverging from its FS in shape, still
needs its own explicit go-ahead.

## 6. Remediation tranche — real server bootstrap (2026-08-23, BL-0038/BL-0027)

Not a feature — a bug-remediation package with no owning FS, per this skill's `IP-9xx0` ID
convention. Triggered by the owner's MSTR-001 v0.4 (C10) decision to require a real human
playtest before the MVP release's G4 gate: the game has never run end-to-end as a real process
(`server/src/index.ts` remains a scaffold, `export {}`), which `10-integration-review`'s own
`integration-review-mvp-tranche.md` (F2) and the Release Assessment (BL-0051) already flagged as
a residual risk. One package, not split, because the three pieces (WebSocket bootstrap, HTTP
session create/join, dist-content-copy fix) are only separately meaningful when combined — a
WebSocket bootstrap with no way to create a session first, or a session-creation endpoint with no
transport to connect to afterward, is not independently useful, and none of the three has a
separate verification story worth its own package.

**Verb inventory for "run the game for real":** *bootstrap* (accept real socket connections —
`IP-9038`), *create/join* (produce a session over the network at all — a genuine gap: `IP-1010`
built `SessionStore.createSession`/`joinSession` as pure functions, but no package ever exposed
them over HTTP or gave the client any UI to call them; FS-101's own W1 workflow assumed a
"shareable join link" exists without any package ever being assigned to produce one — `IP-9038`
closes this too, disclosed as a deviation beyond BL-0038/BL-0027's literal text), *serve* (the
built client needs to reach a browser at all — `IP-9038`, static-file serving from the same
process, chosen over a two-process dev-server+API split specifically because FR-9410 requires a
zero-prior-experience install walkthrough, and "start one process, open one URL" is a
meaningfully simpler instruction than "run two processes and configure a proxy"), *persist
content into `dist/`* (`IP-9038`, a build-script fix, no application-logic change).

**Authorization (G3):** BL-0038/BL-0027 are pre-existing, disclosed deviations from packages
already covered by the release plan (IP-7010's own Deviation note named BL-0038 explicitly;
IP-3011's named BL-0027). Closing a disclosed gap in an already-authorized package's own stated
scope is covered by that same release-plan authorization — no fresh owner go-ahead needed. The
session-creation/join HTTP+UI addition, while not literally named by BL-0038/BL-0027's text, is
necessary to make FS-101's own already-approved W1 workflow ("two players join a session via a
shareable link") actually functional, and FR-9410/9420 (owner-authorized, MSTR-001 C10) require
the game to actually run — this is completing already-approved scope, not new scope.

## 7. Remediation — King-deployment wire exposure (2026-08-23, BL-0056)

Not a feature — a bug-remediation package with no owning FS, discovered by IP-9038's own live
end-to-end smoke test. `SessionStore.submitKingDeployment` (IP-1010) is fully unit-tested but has
never had any caller outside test setup code: no `ActionType`/message covers it, and
`GameEngine.handleAction`'s dispatch structurally cannot carry it (it requires
`session.phase === 'active'`, but a session's `SessionState` doesn't exist — `getSession` returns
`undefined` — until *after* both players' King selections resolve). One package: the wire message,
the transport wiring, and the client picker UI are only meaningful together, and none has an
independent verification story.

**Verb inventory:** *submit* (a client sends its secret King selection — new `DeployKingMessage`,
handled directly in `websocketServer.ts`, parallel to the existing `ActionMessage`/
`DisconnectResponse` cases, since this precedes `GameEngine.handleAction`'s phase gate entirely),
*report status* (a connecting/waiting client needs to know it's in the pre-active `'deploying'`
phase rather than getting `handleConnection`'s existing "session no longer exists" rejection,
which is what happens today since `broadcastToOne` treats "no `SessionState` yet" as
indistinguishable from "no session at all" — new `DeploymentStatusMessage`), *transition* (once
both submit, the session becomes `'active'` and the existing `StateDeltaMessage`/`broadcastStateDelta`
flow takes over unchanged — no new mechanism needed here, `SessionStore.submitKingDeployment`
already creates the real `SessionState` on the second submission), *pick* (a client needs a
mission-set + regime UI — new `KingDeploymentPicker.tsx`, sourcing its options from the
`TemplateCatalogMessage` IP-9038/BL-0048 already established as the pattern for server-authored,
static, both-players-identical data — extended to also carry `MissionSetTemplate[]`, which it
currently does not).

**Authorization (G3):** covered — this closes a pre-existing gap in FS-101's own already-approved
W1/W2 workflow (secret King deployment is explicitly named there); FR-9420 (owner-authorized,
MSTR-001 C10) requires the game to actually be playable, which this gap is the sole remaining
blocker to. Completing already-approved scope, not new scope.
