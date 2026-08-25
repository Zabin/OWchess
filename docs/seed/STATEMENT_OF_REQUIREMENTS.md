# OW CHESS
## Statement of Requirements (SOR) — v0.1 Draft

**Name:** *OW Chess*
**Document type:** Program Vision + System/Architecture Requirements + Functional/Non-Functional Requirements, combined into a single seed document
**Intended consumer:** Claude Code, as the bootstrap input for a documentation-driven-development pipeline (see §3 and the companion `CLAUDE_CODE_KICKOFF_PROMPT.md`)
**Status:** DRAFT — pending owner review of the assumptions in §16 before any code is authorized
**Author:** Drafted by Claude (Anthropic) from a design conversation with the project owner
**Date:** 2026-08-21

---

## 0. How to read this document

This SOR intentionally combines what a mature pipeline (see §3.1) would normally keep as separate tiers — Vision (01), Architecture (03), and Requirements (04) — into one document, because the project has no prior artifacts of its own to build on. Once Claude Code bootstraps the pipeline scaffold, this document should be **decomposed** into those native tiers rather than kept as a monolith going forward. Everything here is traceable by ID (`FR-####`, `NFR-####`, `OQ-##`) so that decomposition is mechanical, not interpretive.

Where a decision was made on the owner's behalf rather than stated explicitly, it is marked **[ASSUMPTION]** inline and re-listed in §16. Nothing marked as an assumption should be treated as locked — Claude Code should surface these to the owner at the `01-vision` gate before committing architecture around them.

---

## 1. Executive Summary

OW Chess is a two-player, web-browser, turn-based multiplayer strategy game built on the "find, fix, track, target, engage" (F2T2E) logic of real space-domain-awareness (SDA) and counterspace operations, expressed as a chess-like abstract strategy game rather than a simulation. Each player secretly deploys a **King satellite** — a mission-bearing asset with a mission set (e.g., SATCOM, ISR, PNT) and an orbital regime — and the game is won by locating, characterizing, and denying or destroying the opponent's King before they do the same to you.

Unlike the project's sibling simulator, **ZabSpaceExercise** (a PME wargaming tool optimized for training fidelity and facilitator-run scenarios), OW Chess is optimized for **two unassisted players, a short session length, and legible turn-by-turn strategic tension** — closer in spirit to chess or a hidden-movement board game (*Battleship*, *Twilight Struggle*, *Hunter*) than to a training simulator. It borrows ZabSpaceExercise's domain vocabulary and some engine concepts (access-window logic, effect taxonomy, propagator abstraction) but is **not** a mode of that simulator and does not inherit its Python/FastAPI codebase. **[ASSUMPTION — OQ-01]**

The game uses **fixed, strictly alternating turns** — classic chess-style I-go-you-go, not a shared real-time clock. On a player's turn they take one or more actions (maneuver, task an asset, deploy a new asset, or pass — see §7.2) up to their turn's AP allotment, then play passes to the opponent; the server enforces turn order and rejects any action attempted out of turn. **[ASSUMPTION — OQ-01b — strict alternating turns, as opposed to a simultaneous "WeGo" order-writing structure where both players commit moves and the server resolves them together; confirm at `01-vision`.]**

---

## 2. Program Goals & Success Criteria

| # | Goal | Success looks like |
|---|------|---------------------|
| G-1 | A complete, replayable 2-player core loop | Two people can open a link, both join, play a full game to a win condition, in one browser tab each, with no installation |
| G-2 | Legible hidden-information strategy | A new player can explain *why* they lost within one game — the fog-of-war and tracking chain are readable, not opaque |
| G-3 | Doctrinally grounded but game-first | Mission sets, sensors, and effectors map to real SDA/counterspace concepts (traceable to ZabSpaceExercise's research corpus) but mechanics are simplified enough to resolve in seconds, not simulated minutes |
| G-4 | Reusable, extensible asset model | Adding a new asset, mission set, or effector is a data change (JSON/YAML template), not a code change, mirroring ZabSpaceExercise's validated asset template library |
| G-5 | Pipeline-disciplined build | Every feature is traceable from vision → requirement → package → verified code, using the hierarchy pipeline described in §3 |
| G-6 | Session-only multiplayer, zero setup | No accounts, no server ops burden for the owner beyond running one process; a shareable link is the entire onboarding flow |

**Explicitly not a goal for v1:** AI/bot opponents, ranked matchmaking or ELO, spectator mode, mobile-native apps, more than 2 players, persistent player accounts/progression across sessions. Any of these may become a later phase (see §5.3) but none gate the v1 release.

---

## 3. Development Process

### 3.1 The hierarchy pipeline

This project should be developed using the same documentation-driven-development pipeline pattern used in `ZabGBCprocgenMusic` (see `.claude/skills/README.md` in that repo for the canonical description). Claude Code should **adapt, not copy verbatim** — the stage numbers, artifact types, and hard rules (G1–G5) transfer directly; the GBC-specific content does not.

| Stage | Skill | Produces | Where |
|---|---|---|---|
| 00 | `00-pipeline-manager` / `00-intake` | Pipeline journal, backlog harvest/triage, next-step execution | `docs/pipeline/` |
| 01 | `01-vision` | Program vision (MSTR-001), GDS-00 Vision, assumptions register | `docs/master/`, `docs/architecture/` |
| 02 | `02-research-*` | Research encyclopedia entries (R-###), grounding domain facts | `docs/research/` |
| 03 | `03-architecture-design-synthesis` | GDS-01…10 ladder, ADS-xxx, ADRs | `docs/architecture/` |
| 04 | `04-requirements-engineering` | FR-####, NFR-####, RTM | `docs/requirements/` |
| 05 | `05-feature-decomposition` | Release plan, epic/feature catalog | `docs/feature-planning/` |
| 06 | `06-feature-specification` | Feature specs (FS-###) | `docs/features/` |
| 07 | `07-implementation-planning` | Implementation packages (IP-####) | `docs/implementation/` |
| 08 | `08-code-implementation` / `08-content-authoring` / `08-refactoring` | Source, tests, content data | repo root, `docs/` |
| 09 | `09-package-verification` / `09-content-review` | Verification reports (VR-####) | `docs/implementation/verification/` |
| 10 | `10-integration-review` | Integration report per release | `docs/reviews/` |
| 11 | `11-release-readiness` | GO/NO-GO assessment | `docs/reviews/` |

**This document is the seed for stages 01, 03, and 04.** Claude Code's first job (see the companion kickoff prompt) is to stand up the `.claude/skills/` pipeline scaffold, then run `01-vision` using §1–§6 of this SOR as source material, then `03-architecture-design-synthesis` using §7–§9, then `04-requirements-engineering` using §10–§11 — producing the properly-tiered, ID-traceable docs this monolith is a stand-in for.

### 3.2 Hard rules (carried forward as G1–G5)

- **G1 — Write scope.** Each pipeline stage writes only its own output; no stage before 08 writes production code; findings route back upstream, never patched downstream.
- **G2 — Status honesty.** `NOT STARTED / READY / IN PROGRESS / BLOCKED / COMPLETE / VERIFIED` — no other vocabulary, no silent skips.
- **G3 — Package authorization.** A fully-specified implementation package is not permission to build it. The owner authorizes each package explicitly before `08-*` starts it. **No bootstrap carve-out** — this applies from the very first package.
- **G4 — Release GO.** Stage 11's recommendation is advisory; the owner makes the release call.
- **G5 — Permanent gates.** After every `08-*` run: the app must build/start cleanly, and the full automated test suite must pass. A package that breaks either is not `COMPLETE`.

### 3.3 What to reuse from ZabSpaceExercise vs. build fresh

| Concept | Reuse how | Notes |
|---|---|---|
| Domain research (doctrine, SDA/counterspace vocabulary, effect taxonomy) | **Reuse directly** — cite `docs/research/` from ZabSpaceExercise as source material for this project's own `02-research-*` pass | Sourcing standard from that project (public/unclassified only) carries over unchanged, see §12 |
| `Propagator` interface concept (Kepler+J2 vs. real SGP4/TLE behind one interface) | **Reuse the pattern**, reimplement in this project's own stack | See §7.6 — hybrid fidelity requirement |
| Six access-channel model (`command_uplink`, `telemetry_downlink`, `sensor_observation`, `jam_footprint`, `weapon_engagement`, `rpo_proximity`) | **Reuse the taxonomy**, simplify the gating logic for turn-scale play | See §7.7 |
| Five D's effect taxonomy (Deceive/Disrupt/Deny/Degrade/Destroy) | **Reuse directly** | See §7.8 |
| Fog-of-war / belief-state rendering (each side sees only its own SDA picture) | **Reuse the principle**, this project's fog model is simpler (no belief-state divergence tracking) | See §7.5 |
| JSON/YAML asset template library, schema-validated | **Reuse the pattern** | See §12 |
| Python/FastAPI backend, session/CellController architecture, event-log/AAR replay | **Do not reuse the code** — different language/stack (see §8), though the *architectural shape* (authoritative server, per-session state, immutable event log) is worth carrying forward as a pattern | See §8.3, §14 |

---

## 4. Target Users

| Persona | Description | What they need from the game |
|---|---|---|
| **The two players** | Adults with an interest in wargaming/military strategy (the owner's stated interest area), not necessarily space-domain experts | A rules-legible game that rewards deduction and planning, not memorized doctrine trivia |
| **The owner as designer/maintainer** | Builds and iterates on the game via Claude Code sessions | Traceable requirements, a data-driven asset model so new content doesn't require touching game logic, an SOR precise enough that implementation doesn't require guessing intent |

No accessibility, localization, or platform-support tier beyond "modern desktop browser" is assumed for v1 — see NFR-6xxx and §16 for what's explicitly deferred.

---

## 5. Scope

### 5.1 In scope for v1 (MVP)

- Two-player turn-based sessions over a shareable link, no accounts
- King deployment (mission set + orbital regime selection) as the opening move for both players, resolved simultaneously and secretly
- A turn/action-budget loop supporting: maneuver, task an asset, deploy a new asset, pass (see §7.2 — the list is explicitly extensible)
- A starting roster of **3 mission sets**, **~6 sensor/tracking asset types** (mixed ground and space-based), and **~4 effector types**, sufficient to exercise the full find→fix→track→target→engage chain at least two different ways (see §7.4–§7.5 for the exact starting roster)
- Hybrid orbital mechanics: real propagation math under the hood, simplified band/slot presentation to the player (§7.6)
- Server-authoritative fog-of-war: each player renders only their own SDA picture (§7.7)
- A cost/time economy distinguishing space-based vs. ground-based assets (§7.5, §10 FR-2xxx)
- Win conditions: King destruction, King mission-denial-by-duration, and a resignation/timeout path (§7.9)
- A single persistent game board view plus supporting panels (asset tray, action menu, event log) — see §9
- Automated test coverage for game-state resolution logic (deterministic core, per NFR-3xxx)

### 5.2 Explicitly out of scope for v1

- AI/bot opponent
- More than 2 players / spectators
- Ranked play, matchmaking, ELO, persistent accounts or cross-session progression
- Mobile-native builds (a responsive browser layout is in scope; a dedicated mobile UI is not)
- Real named/current satellites via TLE import (ZabSpaceExercise supports this; OW Chess uses fictional/generic assets only for v1 — simpler licensing/sourcing story and avoids the game reading as endorsing real-world targeting)
- Campaign/mission structure carried over from the earlier "ORBITAL COMMAND" concept — that was a single-player, doctrine-driven campaign design; this is a competitive 2-player game. They may share an asset/mission-set vocabulary later, but v1 does not attempt to unify them. **[ASSUMPTION — OQ-01]**

### 5.3 Candidate later phases (not authorized, listed for roadmap continuity)

Numbered loosely in the style of ZabSpaceExercise's `R0`–`R13` roadmap convention — **none of these are scoped or authorized**, they exist so `05-feature-decomposition` has somewhere to file scope that surfaces early:

- **R1** — Expanded asset roster (additional mission sets: PNT, ELINT/SIGINT; additional effectors: dazzle, cyber)
- **R2** — Ranked/rated play, match history
- **R3** — Spectator mode / replay sharing (leans on the AAR-replay pattern from ZabSpaceExercise)
- **R4** — Real-satellite TLE import as an optional "historical scenario" mode
- **R5** — AI opponent for solo practice
- **R6** — Campaign/narrative mode bridging toward the ORBITAL COMMAND concept
- **R7** — 3+ player / team play

---

## 6. Relationship to Prior Work

| Project | Relationship to OW Chess |
|---|---|
| **ZabSpaceExercise** (Space Control & Orbital Warfare Exercise Simulator) | Sibling, not parent. Source of doctrine research, vocabulary, and architectural *patterns* (see §3.3). Zero shared runtime code planned for v1. |
| **ORBITAL COMMAND** (prior React game-design prompt, 12-mission single-player campaign grounded in USSF doctrine) | Adjacent, not merged. Different game (single-player campaign vs. 2-player competitive). May converge later (§5.3, R6) but treated as a separate codebase for v1. |
| **ZabGBCprocgenMusic** | Source of the development-process pattern only (§3) — no shared domain content. |
| **ZabOW** | Intended GUI style reference. The repo's default branch is empty (README only); the owner has pointed to branch `claude/orbital-warfare-campaign-FWLKi` as the actual style reference. This document's author (Claude, in chat) was blocked from reading that branch by GitHub's robots restrictions on browsing non-default-branch trees — **its content has not yet been reviewed**. §9.1's default direction should be treated as unconfirmed until Claude Code (which should have normal repo access) reads that branch directly. |

---

## 7. Core Game Design (Concept of Operations)

### 7.1 The King mechanic

Each player's opening move, made simultaneously and secretly:

1. Select a **mission set** for the King (from the v1 roster in §7.4)
2. Select an **orbital regime** for the King (from the v1 regime set in §7.6)
3. (Optional, if the mission set allows) select any mission-set-specific parameters exposed by that asset's template (§12)

Neither player sees the other's King parameters until their own sensors earn that information through play (§7.7). The King cannot be redeployed once placed — it can maneuver (§7.2) but its mission set is fixed for the game. Losing the King (destroyed, or mission-denied past the loss threshold — §7.9) ends the game.

### 7.2 Turn structure / action economy

OW Chess uses **fixed, strictly alternating turns** — the server enforces exactly one active player at a time, chess-style:

- On their turn, a player receives a fixed **action point (AP) allotment** (exact value is an `04-requirements-engineering` tuning question, not fixed here) and may spend it on one or more actions before ending their turn, or pass immediately
- Available actions include, at minimum:
  - **Maneuver** — change an asset's orbital parameters within its maneuver budget (§7.6)
  - **Task an asset** — point a sensor at a target regime/track, or arm/aim an effector
  - **Deploy a new asset** — bring a new sensor or effector online (subject to the cost/time economy, §7.5)
  - **Pass** — end the turn without spending remaining AP (whether unspent AP carries over to the next turn, and any cap on carryover, is a tuning question)
- This list is **explicitly extensible** — the owner's brief called it non-exhaustive; `05-feature-decomposition` should treat additional action types (e.g., "recall/safe an asset," "cross-cue two sensors") as normal backlog candidates, not scope creep
- Because turns are strictly alternating, there is no concurrent-action race to resolve — the server simply rejects any action submitted by the non-active player (NFR-3xxx still matters for deterministic *effect* resolution within a turn, e.g. multi-step engagement outcomes)
- Asset deployment time-to-online (§7.5) and maneuver transfer time (§7.6) are denominated in **turns**, not wall-clock time, so game pacing is fully determined by turns taken, not by how quickly either player acts — this also means a game can be played async over any timescale without changing the rules

### 7.3 The find-fix-track-target-engage chain

The core strategic loop, directly modeling real counterspace doctrine (grounded in ZabSpaceExercise's research corpus) but compressed to a handful of discrete steps:

1. **Find** — a wide-area search sensor (e.g., a ground-based SDA radar) detects *that something is present* in a searched orbital regime, without characterizing it
2. **Fix** — repeated or higher-quality observation narrows the detection to an approximate orbital slot/regime and coarse characterization (e.g., "likely a maneuvering asset in Sun-synchronous LEO")
3. **Track** — a dedicated tracking-quality sensor (space-based SDA asset, or an array of ground sites) produces a maintained track good enough to predict future position
4. **Target** — a track is refined to targeting-quality data — sufficient geometry/timing confidence for an effector to have a meaningful probability of effect
5. **Engage** — an effector is tasked against the targeting-quality track, producing one of the Five D's outcomes (§7.8)

Each step is gated by asset capability (a wide-area search sensor cannot produce targeting-quality data; only certain assets can) — this is the primary strategic tension: cheap/fast assets find broadly but imprecisely, expensive/slow assets confirm narrowly but precisely, and the opponent can see (or infer) your search pattern and try to evade or deceive it.

### 7.4 Mission sets (v1 starting roster)

| Mission set | Concept | King-eligible? |
|---|---|---|
| **SATCOM** | Communications relay; long-dwell, less maneuverable | Yes |
| **ISR** | Imagery/reconnaissance; higher-value target, may have some maneuver budget for evasion | Yes |
| **PNT-lite** *(placeholder name)* | Positioning/timing-analog mission set; different orbital-regime affinity than the other two, to keep King placement decisions meaningfully different | Yes |

**[ASSUMPTION — OQ-04]** — three mission sets is a starting-roster size guess to keep v1 buildable; §5.3/R1 lists roster expansion as a candidate later phase.

### 7.5 Asset roster (v1 starting set) and the cost/time economy

| Asset | Type | Chain role | Basing | Relative cost/time [ASSUMPTION — OQ-05] |
|---|---|---|---|---|
| Wide-area SDA radar | Sensor | Find | Ground | Low cost, fast to bring online, coarse data only |
| Ground-based tracking array | Sensor | Track/Target | Ground | Medium cost, medium time, needs multiple sites cross-cued for targeting-quality |
| Space-based SDA sensor | Sensor | Fix/Track | Space | Higher cost, slower to deploy (must itself reach a useful orbital regime), better data per unit |
| Optical/imaging sensor | Sensor | Fix | Ground or space variant | Regime- and lighting-constrained (day/night, weather-analog) — a natural counter-play surface |
| Kinetic/RPO effector | Effector | Engage (Deny/Destroy) | Space | High cost, slow to reach engagement geometry, most decisive effect |
| EW/jamming effector | Effector | Engage (Disrupt/Degrade) | Ground | Lower cost, reversible/non-permanent effect, good for "push off mission" win path |

The **ground vs. space cost/time asymmetry is a required mechanic** (explicitly requested): ground-based assets should generally be cheaper and faster to bring to bear but geometrically constrained (only useful when a target is in view/regime); space-based assets should generally be more capable or persistent but costlier and slower to position. Exact numeric costs are a `04-requirements-engineering`/tuning matter, not fixed by this SOR — see OQ-05.

### 7.6 Orbital mechanics — hybrid fidelity requirement

Per the owner's explicit choice: **simple for gameplay, real math underneath.**

- Internally, asset positions are propagated using real orbital mechanics (at minimum Kepler + J2 perturbation, matching ZabSpaceExercise's `Propagator` interface pattern) — not because the player needs to see raw orbital elements, but so that the game's geometry (what's in view of what, when an access window opens) is physically consistent and future-extensible (e.g., toward real SGP4/TLE import in R4)
- Externally, the player-facing presentation abstracts this into **discrete, chess-legible regimes/slots** — e.g., named bands (Low/Mid/High, or LEO/MEO/GEO-analog) crossed with a small number of inclination/plane classes — so that maneuver and placement decisions are graspable at a glance, not read off a raw ephemeris
- Maneuver actions (§7.2) consume a fuel-analog budget and take real orbital transfer time to complete (modeled, not necessarily fully simulated tick-by-tick) — the exact abstraction (e.g., "maneuvers resolve after N turns, cost M fuel-analog units, based on the real delta-v the underlying transfer would require") is an architecture-stage (`03`) design question grounded in this requirement, not resolved here
- The `Propagator` **interface boundary must be preserved** in this codebase's architecture even though the implementation differs, so that a future higher-fidelity mode (or shared code with ZabSpaceExercise) is an implementation swap, not a rewrite

### 7.7 Fog of war / intelligence model

- The server holds ground truth; **each client renders only that player's own belief state** — this must be enforced server-side (never send the opponent's true asset data to a client that hasn't earned it), mirroring ZabSpaceExercise's server-enforced fog-of-war
- Information is earned through the find→fix→track→target chain (§7.3) — a detection produces a coarse/uncertain belief-state entry; better sensors narrow that uncertainty; nothing is ever "free" intel
- Belief-state entries should **decay or go stale** if not refreshed (a track not maintained should degrade in confidence over time) — this creates ongoing pressure to keep sensors tasked, not just achieve one high-water-mark of intel and stop
- Simplification vs. ZabSpaceExercise: this project does **not** need branch-compare/AAR belief-state divergence tooling — v1 needs current-state fog-of-war only, not historical belief reconstruction

### 7.8 Effects — the Five D's

Reuse the taxonomy directly: **Deceive, Disrupt, Deny, Degrade, Destroy.**

| Effect | Nature | Typical source | Typical use in the win-condition context |
|---|---|---|---|
| Deceive | Feeds false data, no physical effect | EW/cyber-analog | Counter-intel play — mislead the opponent's tracking |
| Disrupt | Temporary, reversible interference | EW/jamming | "Push the King off mission" path toward the duration-based win condition (§7.9) |
| Deny | Temporary or conditional loss of function | EW, positional blocking | Buys time, doesn't end the game alone |
| Degrade | Partial, potentially cumulative reduction in capability | Sustained EW, minor kinetic | Wears down a target over multiple turns |
| Destroy | Permanent, irreversible | Kinetic/RPO effector | Immediate win if applied to the opposing King |

### 7.9 Win conditions

1. **Destruction win** — the opposing King is destroyed
2. **Mission-denial win** — the opposing King is held in a Disrupted/Denied/Degraded state (any combination, effect-taxonomy-consistent) continuously for a defined number of consecutive turns, representing "pushed off mission long enough" per the owner's brief. Exact turn-count threshold is a tuning question (OQ-06).
3. **Resignation** — either player may concede
4. **Timeout/stalemate** — a maximum total turn count **[ASSUMPTION — OQ-07]** with a defined tiebreak (e.g., whichever King has taken more cumulative effect) if neither win condition is met

### 7.10 What a menu-driven action turn must expose to the player

Directly from the owner's brief ("the system must offer through a menu what actions a player can take, what assets it can deploy"): at any moment, the UI must make legible —

- Whose turn is active, and the active player's current AP available this turn
- Every currently-legal action given current AP, current asset states, and current game phase (no dead menu entries — illegal actions should be hidden or clearly disabled with a reason, not silently rejected after the fact)
- Every asset the player could deploy *now*, with its cost/time-to-online shown before commit
- The mission set of the player's own King, and — once earned — everything currently known (however uncertain) about the opponent's assets

---

## 8. System Architecture

### 8.1 Technology stack **[ASSUMPTION — OQ-02]**

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | React + TypeScript | Matches the owner's prior React work (rank-insignia reference tool, ORBITAL COMMAND prompt); strong ecosystem for the panel-heavy UI in §9 |
| Board/orbital rendering | SVG or Canvas2D (not a 3D globe) | The v1 presentation is explicitly a simplified band/slot abstraction (§7.6), not ZabSpaceExercise's 3D globe — a 2D radial or lane-based rendering is a more natural fit and far cheaper to build |
| Client/server transport | WebSocket (e.g., native `ws` or Socket.IO) | Not strictly required by a turn-based design, but push-based turn-change/state-update notifications avoid polling and keep the non-active player's client current the instant the opponent ends their turn (§7.2) |
| Backend | Node.js + TypeScript | Single language across client/server, simplifies shared type definitions (game-state schema, asset templates) between frontend and backend |
| Orbital math | A JS/TS orbital-propagation library (e.g., `satellite.js`) or a small custom Kepler+J2 module | Satisfies the hybrid-fidelity requirement (§7.6) without requiring a Python subprocess |
| Game-state persistence | In-memory, per-session, server-authoritative (no database for v1) | Matches scope (§5.2 — no accounts/cross-session progression); mirrors ZabSpaceExercise's session-scoped state pattern |
| Session/matchmaking | Shareable link → session ID → join (no lobby browser, no accounts) | Matches G-6 |
| Deployment | Single Node process, deployable to any Node host or run locally | No infrastructure requirement beyond that; exact hosting choice deferred to the owner (OQ-08) |

This is a **recommendation for `03-architecture-design-synthesis` to formalize as an ADR**, not a locked decision — Claude Code should confirm it with the owner at that stage rather than treat it as unchangeable.

### 8.2 Client architecture

- A single-page application with the panel inventory in §9.2
- Client holds only the belief-state it has been sent — it must not compute or infer opponent ground truth locally under any circumstances (fog-of-war is a server property, §7.7)
- Optimistic UI is acceptable for the player's *own* actions (e.g., show a maneuver as "pending" immediately) but the server's resolution is always authoritative and can override/reject a pending action

### 8.3 Server architecture

- One authoritative process per game session holding: both players' true asset states, both players' belief states (derived, not independently stored — computed from ground truth + earned intel), the AP/action economy, and the event/turn log
- Turn resolution loop: enforce strict turn order (reject any action from the non-active player), grant the active player's AP allotment at turn start, accept and validate incoming actions against current legality (§7.10), advance the turn to the opponent on pass or AP exhaustion, broadcast the resulting state delta to each client **filtered through that client's fog-of-war**
- An **immutable action/event log** per session — not for full AAR/replay tooling (out of scope, §5.2) but because it is cheap to maintain, aids debugging, and keeps the door open for R3 (§5.3) later

### 8.4 Data model (high level — full schema is a `03`/`04` deliverable, not this SOR)

- **Asset template** (JSON/YAML, schema-validated, mirroring ZabSpaceExercise's validated asset library): id, display name, asset class (sensor/effector/King-eligible mission asset), mission set (if applicable), basing (ground/space), chain role(s) (§7.3), cost, time-to-online, effect type(s) produced (§7.8), regime affinities/constraints
- **Game session state**: per-player King reference, per-player asset instances (each referencing a template + current orbital state + current tasking), per-player AP, per-player belief-state (derived), event log, win-condition progress trackers
- **Belief-state entry**: subject asset (or "unknown contact"), confidence/precision level (find/fix/track/target — §7.3), last-updated timestamp (for decay, §7.7), source sensor

### 8.5 Non-goals for the architecture

- No database, no auth system, no account model for v1 (§5.2)
- No microservices — a single process is sufficient at this scale
- No mobile-native client
- No AI/bot player logic embedded in the server

---

## 9. GUI / UX Requirements

### 9.1 Visual direction **[ASSUMPTION — OQ-03]**

`ZabOW`'s default branch contains no content beyond a bare README. The owner has since pointed to branch `claude/orbital-warfare-campaign-FWLKi` as the real style reference, but this document's author was blocked from reading it (GitHub disallows automated browsing of non-default-branch trees for the tool used to draft this SOR). **Claude Code should read that branch directly as one of its first actions** and revise this section accordingly before any real visual work begins. Pending that, this SOR proposes a **default direction** so design work isn't blocked in the meantime:

- A dark, high-contrast "ops console" aesthetic, directly in the spirit of ZabSpaceExercise's established palette (deep blue-black backgrounds, cool desaturated accent colors for orbital tracks, a distinct warm/alert color reserved for hostile/unknown contacts and effect resolution)
- Panel-based layout (not a single freeform canvas) — consistent with a "menu-driven" game per the owner's brief, not a click-anywhere simulator
- Legible-at-a-glance iconography for mission sets, asset classes, and effect types over dense text labels, given the panel-heavy layout in §9.2

**This should be treated as a placeholder, explicitly flagged to the owner at the `01-vision` gate**, and superseded by whatever Claude Code actually finds on the `claude/orbital-warfare-campaign-FWLKi` branch — not built out in detail until that real reference material has been read.

### 9.2 Panel/screen inventory

| Panel | Purpose |
|---|---|
| **Orbital board** | The primary view — simplified regime/slot representation (§7.6) showing the player's own assets at full fidelity and the opponent's assets only to the belief-state precision earned (§7.7) |
| **Action menu** | Every legal action available now, per §7.10 |
| **Asset tray** | Assets available to deploy, with cost/time-to-online shown before commit |
| **Mission/King status** | The player's own King's mission set, health/effect-state, and AP economy |
| **Intel panel** | Everything currently known about the opponent, at whatever precision has been earned, with staleness indicated (§7.7) |
| **Event log** | A running, human-readable log of resolved actions and effects (both earned-visible opponent actions and the player's own) |

### 9.3 Responsiveness & accessibility

- Target: modern desktop browsers (Chrome/Firefox/Safari/Edge, current stable versions) at typical laptop/desktop viewport widths — full mobile-responsive layout is **not** required for v1 (§5.2), but the panel-based layout in §9.2 should not actively break on a tablet-sized viewport
- Standard web accessibility hygiene (sufficient color contrast especially given the dark theme in §9.1, keyboard-navigable menus, no color-only signaling for hostile/friendly distinction) — a full WCAG audit is not scoped for v1 but should not be actively violated

---

## 10. Functional Requirements

*(Numbered for traceability. This is a representative v1 set, not exhaustive — `04-requirements-engineering` should treat gaps found during architecture/feature work as normal backlog items, per G1.)*

### FR-1xxx — Session & Game Flow

- **FR-1001** The system shall allow a player to create a new game session and receive a shareable join link.
- **FR-1002** The system shall allow a second player to join an existing session via that link.
- **FR-1003** The system shall not start the game until both players have joined.
- **FR-1004** The system shall require both players to secretly select their King's mission set and orbital regime before the game begins, and shall not reveal either selection to the opponent.
- **FR-1005** The system shall resolve both Kings' deployments simultaneously once both are submitted, then begin strictly alternating turns (§7.2).
- **FR-1006** The system shall grant each player a fixed action-point (AP) allotment at the start of their own turn (allotment value TBD at `04`).
- **FR-1007** The system shall present only currently-legal actions to each player (§7.10).
- **FR-1008** The system shall allow a player to pass, ending their turn (whether unspent AP carries over is TBD at `04`).
- **FR-1009** The system shall enforce strict turn order, rejecting any action submitted by the non-active player.
- **FR-1010** The system shall allow either player to resign at any time, ending the game with the opponent as winner.
- **FR-1011** The system shall enforce a maximum total turn count and resolve a tiebreak if reached (§7.9).

### FR-2xxx — Assets & Mission Sets

- **FR-2001** The system shall define a data-driven asset template schema (§8.4) such that adding a new asset does not require game-logic code changes.
- **FR-2002** The system shall support the v1 mission-set roster (§7.4) and mark each as King-eligible or not.
- **FR-2003** The system shall support the v1 asset roster (§7.5), each tagged with basing (ground/space), chain role(s), cost, and time-to-online.
- **FR-2004** The system shall enforce the ground/space cost-and-time asymmetry described in §7.5 for every asset in the roster.
- **FR-2005** The system shall allow a player to deploy a new asset, deducting the appropriate cost and beginning the appropriate time-to-online countdown.
- **FR-2006** The system shall prevent use of an asset before its time-to-online has elapsed.

### FR-3xxx — Sensing, Fog-of-War & Tracking

- **FR-3001** The system shall maintain, per player, a belief-state of the opponent's game state derived only from that player's own sensors' earned intel (§7.7).
- **FR-3002** The system shall never transmit opponent ground-truth data to a client beyond what that player's belief-state currently contains.
- **FR-3003** The system shall model the find→fix→track→target chain (§7.3) such that each precision level requires an asset capable of producing it.
- **FR-3004** The system shall degrade belief-state confidence over time if not refreshed by continued sensor tasking (§7.7).
- **FR-3005** The system shall allow a player to task a sensor at a target regime, track, or contact.
- **FR-3006** The system shall reflect, in the intel panel (§9.2), the current precision level and staleness of every belief-state entry.

### FR-4xxx — Effectors & Engagement

- **FR-4001** The system shall support the v1 effector roster (§7.5) and the Five D's effect taxonomy (§7.8).
- **FR-4002** The system shall require targeting-quality track data (§7.3) before an effector engagement action becomes legal against a given contact.
- **FR-4003** The system shall apply the correct effect (Deceive/Disrupt/Deny/Degrade/Destroy) to the target asset's state upon successful engagement.
- **FR-4004** The system shall support cumulative/stacking Degrade effects where the asset template specifies it (§7.8).
- **FR-4005** The system shall track, per King, the number of consecutive turns any active Disrupt/Deny/Degrade state has persisted, for the mission-denial win condition (§7.9).

### FR-5xxx — Orbital Mechanics & Maneuver

- **FR-5001** The system shall propagate every asset's true position using a real orbital-mechanics model (minimum Kepler + J2, §7.6), regardless of what precision is exposed to either player.
- **FR-5002** The system shall present orbital state to players as discrete, named regimes/slots (§7.6), not raw orbital elements.
- **FR-5003** The system shall allow a player to maneuver an owned asset within that asset's fuel/maneuver budget.
- **FR-5004** The system shall model maneuver actions as consuming budget and taking modeled transfer time before completion.
- **FR-5005** The system shall implement orbital propagation behind an interface boundary (mirroring ZabSpaceExercise's `Propagator` pattern) such that a higher-fidelity implementation can be swapped in without changing calling code.

### FR-6xxx — Multiplayer & Networking

- **FR-6001** The system shall push turn-change and resolved-action notifications to both clients over WebSocket, so neither client needs to poll to learn it's their turn.
- **FR-6002** The system shall treat the server as the sole authority for game state; client-side prediction, if implemented, shall never be treated as authoritative.
- **FR-6003** The system shall handle a player's disconnect/reconnect within a session without corrupting game state (exact grace-period behavior TBD at `04`).

### FR-7xxx — UI/Presentation

- **FR-7001** The system shall render the panel set defined in §9.2.
- **FR-7002** The system shall visually distinguish the player's own assets, known opponent assets, and unknown/uncertain contacts.
- **FR-7003** The system shall show, for every deployable asset, its cost and time-to-online before the player commits to deploying it.
- **FR-7004** The system shall show current AP and accrual rate at all times during an active game.
- **FR-7005** The system shall log resolved actions and effects to a visible, human-readable event log (§9.2).

### FR-8xxx — Persistence & Logging

- **FR-8001** The system shall maintain an immutable, ordered event log for the duration of a session (§8.3).
- **FR-8002** The system shall not persist game state beyond the life of the session (no database, §8.5) for v1.

---

## 11. Non-Functional Requirements

### NFR-1xxx — Performance / Latency

- **NFR-1001** Turn-change and resolved-action notifications shall reach both clients within a latency budget suitable for a turn-based game (target: a few seconds under normal broadband conditions; exact SLA TBD at `04`) — this is not a twitch/action game and does not need frame-perfect sync, but a player should never be left looking at a stale "waiting for opponent" state after the opponent has actually moved.
- **NFR-1002** The orbital propagation model shall be efficient enough to update all in-play assets within each resolution tick without perceptible UI stall.

### NFR-2xxx — Security

- **NFR-2001** The server shall never send a client data that player's fog-of-war has not earned (§7.7) — this is a security/anti-cheat requirement, not only a gameplay one, since a client-side leak is trivially inspectable via browser devtools.
- **NFR-2002** Session join links shall be unguessable (sufficiently random session identifiers) given the no-accounts design (§8.3) — this is the only access control for v1.

### NFR-3xxx — Reliability / Determinism

- **NFR-3001** Given the same sequence of server-received actions, game-state resolution shall be deterministic (supports debugging and, later, any replay work in R3).
- **NFR-3002** A single session crash shall not affect other concurrent sessions (process/session isolation).

### NFR-4xxx — Usability

- **NFR-4001** A first-time player shall be able to determine, without external documentation, what actions are currently available to them (§7.10) — the UI itself is the rules reference for legal moves; a separate rules document may supplement but should not be required for basic play.
- **NFR-4002** The UI shall never present an action as available and then reject it as illegal after the fact under normal play (§7.10, FR-1007) — legality shall be computed client-visibly before submission.

### NFR-5xxx — Maintainability / Pipeline Compliance

- **NFR-5001** New assets, mission sets, and effectors shall be addable via data (template) changes only, without game-logic code changes, per FR-2001.
- **NFR-5002** The codebase shall follow the documentation-driven-development pipeline and hard rules in §3 for all non-trivial changes.
- **NFR-5003** The `Propagator`-equivalent orbital module shall remain isolated behind a clean interface (FR-5005) specifically to protect future fidelity upgrades (R4) from becoming a rewrite.

### NFR-6xxx — Compatibility

- **NFR-6001** The client shall run in current-stable versions of Chrome, Firefox, Safari, and Edge without polyfills for unsupported-baseline features.
- **NFR-6002** The client shall degrade gracefully (clear error state, not silent failure) if WebSocket connectivity is lost mid-session.

---

## 12. Data & Content Requirements

- Asset templates (§8.4) shall be defined in a schema-validated JSON or YAML format, directly analogous to ZabSpaceExercise's validated asset template library — this is both a content-authoring convenience and a `08-content-authoring` pipeline-stage requirement (content is data, not code, per G1).
- All doctrinal/domain content (mission-set naming, effect taxonomy, sensor/effector real-world grounding) shall cite ZabSpaceExercise's research corpus (`docs/research/` in that repo) as source material during `02-research-*`, subject to that project's existing sourcing standard: reputable open/public sources only, no classified material, fictional/generic assets by default (§5.2 — OW Chess does not implement real-satellite TLE import for v1 at all).

---

## 13. Testing & Verification Requirements

- Per gate **G5** (§3.2): after every implementation package, the application must build/start cleanly and the automated test suite must pass, or the package is not `COMPLETE`.
- The deterministic game-state resolution core (§8.3, NFR-3001) shall have unit/integration test coverage sufficient to verify: legal-action enumeration (FR-1007), fog-of-war non-leakage (NFR-2001), the find→fix→track→target gating chain (FR-3003), and all win-condition paths (§7.9).
- `09-package-verification` shall produce a Verification Report (VR-####) per completed package, per the pipeline's own convention (§3.1) — this SOR does not attempt to enumerate test cases itself; that is a `07`/`08` deliverable.

---

## 14. Explicitly Deferred / Not This Document's Job

The following are real, necessary decisions that this SOR deliberately does **not** make, because they belong to a later, better-informed pipeline stage:

- Exact numeric tuning (AP cadence, asset costs, time-to-online values, mission-denial duration threshold, maximum session length) — `04-requirements-engineering` / `06-feature-specification`
- Exact orbital-regime/slot taxonomy (how many bands, how many plane classes) — `03-architecture-design-synthesis`, grounded in §7.6
- Exact maneuver-transfer-time formula — `03-architecture-design-synthesis`
- Full asset-template schema — `03`/`04`
- Visual design system beyond the placeholder direction in §9.1 — blocked on real ZabOW reference material, then `03`/design work

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **SDA** | Space Domain Awareness — the practice of detecting, tracking, and characterizing objects in orbit |
| **King** | This game's term for each player's mission-critical asset; loss ends the game |
| **F2T2E** | Find, Fix, Track, Target, Engage — the doctrinal targeting chain this game's core loop is modeled on |
| **RPO** | Rendezvous and Proximity Operations |
| **Fog-of-war / belief-state** | The imperfect, earned-only picture each player has of the opponent's true game state |
| **AP** | Action Points — the resource spent to take actions during play |
| **Five D's** | Deceive, Disrupt, Deny, Degrade, Destroy — the effect taxonomy for engagements |
| **Propagator** | The architectural interface boundary isolating orbital-mechanics computation from the rest of the game logic |

---

## 16. Assumptions & Open Questions Log

Every item below was decided on the owner's behalf to keep this document complete and actionable. **None are locked** — Claude Code should confirm or revise each with the owner at the `01-vision` gate before downstream stages depend on them.

| ID | Assumption made | Where it appears | Confirm/revise before... |
|---|---|---|---|
| **OQ-01** | This is a standalone game, not a merge with the ORBITAL COMMAND campaign concept or a mode of ZabSpaceExercise | §1, §5.2, §6 | `01-vision` |
| **OQ-01b** | Turn structure is strict alternating (I-go-you-go, chess-style) rather than simultaneous "WeGo" order-writing | §1, §7.2 | `01-vision` — confirm this reading of "fixed turn based" before `03` locks the server's turn-resolution model |
| **OQ-02** | Tech stack: React/TypeScript frontend, Node.js/TypeScript backend, WebSocket transport (for push notification of turn changes, not live sync), no database | §8.1 | `03-architecture-design-synthesis` (formalize as ADR) |
| **OQ-03** | Default "ops console" dark visual direction, pending review of `ZabOW` branch `claude/orbital-warfare-campaign-FWLKi` (not yet read by this document's author — see §9.1) | §9.1 | Immediately — Claude Code should read that branch before any real UI/visual design work begins |
| **OQ-04** | v1 mission-set roster size (3) and content | §7.4 | `04-requirements-engineering` |
| **OQ-05** | v1 asset roster (6 sensors/effectors) and relative cost/time tiers (qualitative only, no numbers set) | §7.5 | `04-requirements-engineering` / `06-feature-specification` |
| **OQ-06** | Mission-denial win condition uses a duration threshold (exact value unset) rather than, e.g., a point/damage total | §7.9 | `04-requirements-engineering` |
| **OQ-07** | A maximum session length exists at all, with a tiebreak rule | §7.9 | `04-requirements-engineering` |
| **OQ-08** | Deployment/hosting target is unspecified beyond "a single Node process, run locally or on any Node host" | §8.1 | `03-architecture-design-synthesis` |
| **OQ-09** | v1 scope is MVP-first with the full end-state vision captured as a roadmap (§5.3) rather than attempting the complete vision in one release | §5, §5.3 | `01-vision` |
| **OQ-10** | AP cadence, action costs, and all other numeric balance values are unset placeholders, not tuned by design intent | §7.2, §10, §14 | `06-feature-specification` (analogous to ZabGBCprocgenMusic's own `BL-0005`-class deferrals for untuned first-guess values) |

---

## 17. Requirements Traceability (goals → requirement categories)

A lightweight RTM — the full traceability matrix is a `04-requirements-engineering` deliverable; this is enough to sanity-check that every program goal (§2) has requirement coverage before this document leaves the owner's hands.

| Goal | Covered primarily by |
|---|---|
| G-1 (complete replayable core loop) | FR-1xxx, FR-2xxx, FR-3xxx, FR-4xxx |
| G-2 (legible hidden-information strategy) | FR-3xxx, FR-7xxx, NFR-4xxx |
| G-3 (doctrinally grounded, game-first) | §7.3–§7.8, §12 |
| G-4 (data-driven, extensible asset model) | FR-2001, NFR-5001, §12 |
| G-5 (pipeline-disciplined build) | §3, NFR-5002 |
| G-6 (session-only, zero-setup multiplayer) | FR-1001–1003, NFR-2002, §8.5 |

## 18. Appendix A — Worked Example: A Sample Opening Sequence

This walks through the exact strategic pattern described in the owner's original brief, mapped onto the mechanics defined above, to make the abstract requirements concrete for whoever implements them.

1. **Both players deploy Kings simultaneously (FR-1004/1005).** Player A places an ISR King in a Sun-synchronous-analog polar regime (favorable for imaging geometry). Player B places a SATCOM King in a GEO-analog regime. Neither knows the other's choice yet.
2. **Player A opens with a wide-area search asset.** Reasoning that a polar/Sun-synchronous regime is a plausible ISR-mission home, Player A deploys a **ground-based wide-area SDA radar** sited to cover the northern search fan (§7.5). This is the cheapest, fastest asset in the roster — a deliberate low-commitment opening probe.
3. **The radar produces a Find, not a Fix.** Per §7.3, the wide-area radar can only establish that *something* is present in the searched regime — coarse presence, no characterization. This is enough information to justify further investment, not enough to act on.
4. **Player A escalates to Fix/Track.** Having gotten a Find, Player A now weighs the ground-vs-space cost/time tradeoff explicitly named in the brief: task an **array of ground-based tracking sites** for a faster but geometry-constrained Fix, or commit to deploying a **space-based SDA asset** into a matching orbital regime for a slower but more persistent Track. Either path is legal; the choice is a real strategic tradeoff (§7.5), not a scripted next step.
5. **A maintained Track allows a Target-quality refinement.** Once tracking-quality data exists (FR-4002 requires this before any engagement action becomes legal), Player A can commit further sensor tasking to push the belief-state precision to targeting quality.
6. **Player A selects an effector matched to the win condition being pursued.** If the goal is the mission-denial win path (§7.9), an EW/jamming effector (Disrupt/Degrade) is the natural choice — cheaper, faster, reversible, and sufficient to accumulate the continuous-duration threshold (FR-4005). If the goal is the destruction win path, a kinetic/RPO effector is required instead — slower and costlier, but decisive on a single successful engagement.
7. **Meanwhile, Player B is not passive.** Every action Player A takes is, in principle, detectable by Player B's own sensors (subject to Player B's own fog-of-war and tasking choices) — Player B may notice northern radar activity and infer they're being searched for, prompting a maneuver (§7.6) to shift regime, a deceive-class counter-action (§7.8), or a symmetric hunt for Player A's own King.

This sequence should be directly usable as the seed for the game's first tutorial/example scenario during `06-feature-specification`, and as a reference case when writing automated tests for the find→fix→track→target→engage chain (§13).

## 19. Appendix B — Risks & Mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Fog-of-war leaks via client inspection | A single missed check that sends opponent ground truth to a client silently breaks the entire game (NFR-2001) | Treat fog-of-war filtering as a single, centrally-tested server boundary (FR-3002), not something re-implemented per feature |
| A hard turn lock stalls the game if one player disconnects or simply doesn't come back | Strict alternating turns (OQ-01b) mean the other player is stuck waiting indefinitely with no built-in escape | Decide at `04`/`06` whether to add a per-turn time limit, an auto-pass, or a forfeit-on-timeout rule — don't default to "wait forever" by omission |
| Untuned numeric balance (OQ-05, OQ-06, OQ-10) ships accidentally as if it were final | A first-guess AP cadence or cost table that "works" in testing can calcify into the shipped baseline without ever being deliberately tuned | Explicitly tag first-guess values in code/config comments (mirroring ZabGBCprocgenMusic's own `BL-0005` convention for untuned placeholders) so they're never mistaken for deliberate design |
| Hybrid orbital-mechanics requirement (§7.6) is architecturally harder than a pure abstraction would be | Real Kepler+J2 propagation adds genuine implementation cost that a "just use a grid" design wouldn't have | The `Propagator`-interface isolation (FR-5005) is required specifically so this cost is paid once, in one module, not threaded through gameplay code |
| ZabOW style reference (branch `claude/orbital-warfare-campaign-FWLKi`) hasn't actually been read yet by this document | Visual design work could proceed against §9.1's placeholder and drift from what the owner actually wants, or stall unnecessarily waiting on it | Claude Code should read that branch directly at repo setup (it has normal git access where this document's author didn't) and revise §9.1 before real visual work, not after |
| Scope creep from the "non-exhaustive" action list (§7.2) | The owner explicitly left the action list open-ended, which is healthy for design but risky for a v1 ship date | Route new action-type ideas through `00-intake` into the backlog like any other feature request (§3.1) rather than adding them ad hoc mid-implementation |

---

*End of Statement of Requirements v0.1. See the companion `CLAUDE_CODE_KICKOFF_PROMPT.md` for how to hand this document to Claude Code.*
