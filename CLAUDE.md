# CLAUDE.md

Read automatically at the start of every session in this repo. These rules apply regardless of
which pipeline skill (if any) is active — they are self-checks Claude runs on its own language and
claims, not process to route through a stage.

They exist because of a real failure, recorded in full at `docs/pipeline/pipeline-journal.md`
(2026-08-23) and enforced structurally as governance rule **G6** in `.claude/skills/README.md`:
with 138/138 tests passing, 11 packages `VERIFIED`, and two clean integration reviews, the shipped
app could not end a game, had no event log, and had no stylesheet. Every defect was found by
running the app or grepping for callers — none was found by writing or reading a document.

## Severity self-check — translate before you write it down

Before describing a gap, defect, or backlog item, check the phrase you're about to use against
this table. If your own words are in the left column, the right column is what actually goes in
the report — not the left column with a lower severity number attached.

| If you're about to write... | Ask this instead, and write the answer | Why |
|---|---|---|
| "styling pass" / "polish" / "visual follow-up" | What does a user literally see, right now, when this ships as-is? | "Styling pass" described five unmet `Must` requirements and a broken vision commitment. It was filed Medium and repeated back to the owner as settled for days. |
| "nit" / "minor" / "small follow-up" | If I ignore this, what can the user specifically not do? | Smallness of the *fix* is not smallness of the *gap*. A one-line change to an unreachable function is still a Critical finding if the function was never called. |
| "not blocking" | Not blocking *what*, exactly — the build, or the actual thing the user asked for? | Every unmet `Must` requirement blocks the release, even when it doesn't block `npm run build`. Those are different gates; only one of them matters at the end. |
| "known limitation" / "out of scope for now" | Was this scoped out on purpose by the owner, or is it just where the work stopped? | A limitation nobody chose is a gap wearing a calmer name. |
| "verified" / "all tests passing" / "package VERIFIED" | Verified against what — my own definition of done, or something I can't quietly edit? | If the same work wrote the spec, the code, and the verification, "verified" only proves internal consistency. State what independent bar was checked. |
| "should work" / "this wires up X" | Have I actually run it and watched it happen, or am I inferring it from the diff? | Say which one. "Should work" from a diff read and "confirmed working" from a live run are different claims and must not be worded the same. |

## Before reporting any status as good news

1. **Can you show it, not just describe it?** A screenshot, a captured session, or a pasted
   terminal transcript from an actual run beats a summary of what the code should do. If you
   can't produce one in a minute, that itself is worth saying.
2. **What would a user see differently after this?** If the honest answer is "nothing yet," say
   that plainly and name what still has to happen before they would notice — don't let "the
   module is wired" stand in for "a person can see the effect."
3. **Did you check this against something outside the work itself?** A package grading its own
   definition of done, or a test suite written by the same pass that wrote the code, is not
   independent evidence. Say what the independent bar was — the owner's own words, a reference
   implementation, a live run, a screenshot — or say there wasn't one yet.

## Full enforcement

The mechanical version of this — reachability sweeps, mandatory demonstration artifacts, and
automatic no-go conditions — lives in the pipeline skills as governance rule **G6**, summarized in
`.claude/skills/README.md`. This file is the plain-language version Claude applies to its own
wording in every session, pipeline-driven or not.

## Architecture — module overview

Full detail: `docs/architecture/03-architecture.md` (GDS-03). One job per module; `GameEngine` is
the single entry point for "an action arrived" and delegates rather than computing outcomes itself.

| Module | Job | Notes |
|---|---|---|
| `TurnManager` | Owns whose turn is active, AP allotment/spend, turn-advance (pass / AP-exhaustion). Only module allowed to reject an out-of-turn action. | Server-side only. **Known defect:** `GameEngine.ts` also keeps a private, hookless `TurnManager` map separate from the hooked instance `createGameEngine.ts` wires up — the `pass` branch uses the hookless one, so passing fires no turn-end hooks. Only AP-exhaustion-to-0 reaches the real path. |
| `GameEngine` | Orchestrates one session: true state for both players' assets/Kings, dispatches actions to the right resolver, runs the win-condition check after every resolved action. | `checkWinConditions` currently has zero production callers — nothing invokes it after an action resolves, so a game cannot end. |
| `Propagator` | FR-5005 boundary. `computePosition(asset, atTurn)` + `planManeuver(asset, targetRegime)`. Internally Kepler+J2; externally maps to the discrete regime taxonomy. | `Propagator.advance()` has zero production callers — orbital math never runs; `meanAnomalyDeg` stays 0. |
| `BeliefState` | Per-player derived (not stored) belief-state of the opponent — IS the fog-of-war boundary (NFR-2001), not a bolted-on filter. | |
| `EffectResolver` | Applies a Five D's effect to a target's true state on successful engagement; reads targeting-quality confirmation from `BeliefState` first. | Deceive is currently backwards — see `memory.md`'s effect-definitions caveat. |
| WebSocket transport layer | Serializes/deserializes action submission and state-delta push; no game logic. | `session.eventLog` is initialized to `[]` and never appended — the Event Log panel is always empty. |
| Client UI layer | Renders belief-state/state-delta it's sent; submits actions; never computes legality or opponent state itself. Optimistic UI for the player's own pending actions is permitted, never authoritative. | GDS-08 owns detail; `resign` has no UI path (the client's `ActionKind` narrows `ActionType` and drops it). |

## Data layout

- **Content templates** (mission sets, asset types, effect definitions): `server/src/content/**/*.json`, loaded by `TemplateRegistry`/`EffectDefinitionRegistry`. Quick-reference tables: `memory.md`.
- **Shared wire/domain types**: `shared/src/interfaces.ts` (`AssetTemplate`, `OrbitalRegimeLabel`, `FiveDsEffect`, etc.), `shared/src/messages.ts` (`ClientToServerMessage`/`ServerToClientMessage` union types).
- **Server engine**: `server/src/engine/` — `GameEngine.ts`, `TemplateRegistry.ts`, `createGameEngine.ts` (composition root that wires the hooked `TurnManager`, turn-end hooks, and action handlers), `SessionStore.ts` (in-memory session state — no persistent DB in v1), action handlers (`deployAction.ts`, `maneuverAction.ts`, `taskAction.ts`, `engageAction.ts`).
- **Server transport**: `server/src/websocketServer.ts` (message-switch dispatch), `server/src/index.ts` (process entry point).
- **Client**: `client/src/App.tsx` (top-level state + picker routing), `client/src/gameClient.ts` (WS client wrapper), `client/src/components/` (`AssetTray.tsx`, `OrbitalBoard.tsx`, `DeployRegimePicker.tsx`, `ManeuverPicker.tsx`, `TaskPicker.tsx`, `EngagePicker.tsx`, `KingDeploymentPicker.tsx`).
- **No `.css` files exist anywhere in the repo** as of this writing — `OrbitalBoard.tsx` is unstyled flat `<div>` lists; there is no stylesheet link in `index.html`. This is the subject of the Wave-2 visual remediation (`/root/.claude/plans/immutable-giggling-scroll.md`), not yet started.

## Known Good Behavior

What is confirmed, by live testing (not just passing unit tests — see G6), to actually work end to
end through the real wire path as of commit `76e0d91` (IP-9062):

- **Deploy**: a client can deploy an asset template to a regime within its `regimeAffinity`; the
  server assigns a real `trueRegime` and the deploying player's own state reflects it.
- **Task**: a client can task a sensor-role asset at an opponent's belief entry; belief precision
  genuinely advances toward `'target'` over repeated tasking, following the F2T2E chain.
- **Maneuver**: a client can submit a maneuver to any of the 9 regimes; the server accepts it and
  the asset enters maneuvering state.
- **Engage**: a client can apply an effect (constrained to the effector's `applicableEffects` when
  present) to an opponent belief-entry target; `Disrupt` has been confirmed to apply correctly.
- **King deployment lifecycle** (IP-9056): both players can deploy a King via mission-set + regime
  picker before the session reaches `'active'` phase; a real two-client WS smoke test confirmed
  the session transitions correctly.

What is confirmed, by the same direct testing, to **not** work — do not report these as done
without re-verifying against a live run:

- A game cannot be ended (`checkWinConditions` unreachable).
- The Event Log panel is always empty (`session.eventLog` never appended).
- Orbital propagation math never executes (`Propagator.advance()` unreachable).
- `pass` skips all turn-end hooks (deploy tick, maneuver tick, effect tick, belief decay) — only
  AP-exhaustion-to-0 reaches the hooked `TurnManager`.
- Deceive corrupts the deceiver's own belief map with the target's true regime, rather than
  planting a false regime in the victim's.
- `resign` has no UI path.
- There is no visual board (no CSS, no canvas/SVG, no 2D or 3D map) and `npm run dev` is broken
  (`client/vite.config.ts` has no `server.proxy`).

## Status

**Version 0.5** (per `docs/master/MSTR-001-program-vision.md`, amended 2026-08-23 to supersede C9
with C9a — ZabSpaceExercise canvas-globe reference — and add C11, the playability certification
bar). Not yet released; **no `11-release-readiness` GO has been given** for this version — a prior
GO recommendation under the pre-C11 quality bar was superseded by this project's own MVP
post-mortem (see the severity self-check above) and must not be cited as current.

- Test suite: **138 tests** (1 shared + 90 server + 47 client), green as of `76e0d91`.
- `IP-9038` VERIFIED · `IP-9056` VERIFIED · `IP-9062` **COMPLETE** (implemented and self-tested,
  not yet independently verified by `09-package-verification`).
- The four-wave remediation plan (`/root/.claude/plans/immutable-giggling-scroll.md`) has
  completed only **Wave 0** (vision/architecture/requirements amendment for the C9a board
  reference and the C11 playability bar). Waves 1 (playability), 2 (visual), and 3 (verification,
  including this project's first-ever `09-content-review` run) are not started.
- This line is the one `11-release-readiness` updates on an owner GO (its own workflow step 5) —
  if you are reading a stale copy of this line, check `docs/implementation/00-master-build-plan.md`
  and `docs/pipeline/pipeline-journal.md`'s Position block for the current authoritative state, and
  flag the discrepancy via `00-pipeline-manager sync` rather than trusting either blindly.
- **`python-mvp/` (added 2026-08-25): a Sprint-0 hot-seat MVP, explicitly ahead of the pipeline**
  (an owner-authorized spike — see `python-mvp/README.md` for the full exception statement). A
  single FastAPI process, Python engine modules mirroring GDS-03's split, a "pass the device"
  hot-seat turn loop, and a server-rendered SVG board. Demonstrated live, start-to-finish, over a
  real running instance: King deployment, Deploy, Task (F2T2E climbing to `target` precision),
  Engage (`destroy` ending a game via King destruction), Maneuver, Pass, and Resign (win via
  resignation). Both of this file's documented TypeScript-build defects — the hookless-`TurnManager`
  `pass` bug and Deceive corrupting the deceiver's own belief map — are fixed (not ported) in this
  Python engine; see that README for what was actually verified vs. asserted, including a real
  content-roster asymmetry it surfaced (only `ew-jamming-effector` can Deceive, and no mission set
  that includes it has a `target`-capable sensor). This does not change anything above this line —
  the TypeScript build described by the rest of this file is untouched, and this MVP is not yet
  the subject of any pipeline package or ADR.
