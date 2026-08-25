# 06 — Manual Traceability Matrix

Bidirectional index between the FR-9000/NFR-10000 requirements baseline, the operator-visible
capabilities they cover, and the training-corpus sections that document them (FR-9210). Read
`docs/requirements/01-functional-requirements.md`/`02-non-functional-requirements.md` for the
requirements' own text.

## Forward: requirement → manual section

| Requirement | Manual section(s) | Status |
|---|---|---|
| FR-9110 (coverage) | `02-interface.md`, `04-actions-reference.md`, `05-troubleshooting-and-glossary.md` | **Partially satisfied** — every operator-visible panel/action is documented, but 3 of 6 action types (Maneuver, Task, Engage) cannot be exercised through the shipped UI to confirm coverage end-to-end; documented as a confirmed gap rather than silently covered. |
| FR-9120 (source anchoring) | All modules (each ends with a `> Sources:` footer) | **Satisfied.** |
| FR-9210 (bidirectional index) | This module | **Satisfied.** |
| FR-9310 (as-built-only content) | All modules | **Satisfied** — every claim traces to code read or a live Playwright drive this session; the Deploy/Task/Maneuver/Engage UI gap is stated as a gap, not glossed over. |
| FR-9320 (currency-on-change) | This module (the mechanism) | **Established, not yet exercised** — this is the corpus's first authoring pass; no code change has yet occurred against it to prove the update discipline. |
| FR-9410 (zero-experience install walkthrough) | `01-install-and-run.md` | **Satisfied** — live-verified this session (build, run, browser load all reproduced against commit `b8ec3bd`). |
| FR-9420 (first-full-game walkthrough with screenshots) | `03-first-game.md` | **Not fully satisfied.** Real screenshots captured for session creation → King deployment → active board → one asset deployment (5 genuine Playwright captures under `docs/manual/`). A screenshot-backed walkthrough to an actual win condition could not be produced because the shipped client cannot supply the Maneuver/Task/Engage targeting parameters the server requires — this is a **shipped-code gap**, not a documentation gap (see Recommendations in this run's completion summary, routed to `00-intake`). |
| NFR-10100 (module size/audience fit) | All modules | **Satisfied** — every module is well under 300 lines; jargon defined at first use or in the glossary. |
| NFR-10200 (screenshot fidelity) | `docs/manual/` | **Satisfied** — all 5 images are genuine Playwright captures of the real running app (commit `b8ec3bd`), none mocked. |

## Reverse: manual section → what it documents

| Section | Documents | Verified via |
|---|---|---|
| `01-install-and-run.md` | Install, build, run, first browser load | Live reproduction this session |
| `02-interface.md` | Landing, KingDeploymentPicker, six-panel active board | Live reproduction + code reading (all `client/src/components/*.tsx`) |
| `03-first-game.md` | Session lifecycle W1/W2 (FS-101), Deploy action, the Task/Maneuver/Engage UI gap | Live reproduction; `server/src/engine/{deployAction,taskAction,maneuverAction,engageAction}.ts` |
| `04-actions-reference.md` | All 6 `ActionType` values, all 7 asset templates, all 3 mission sets, all 5 effects, win conditions | Direct read of `server/src/content/**/*.json`, `shared/src/interfaces.ts`, `server/src/engine/GameEngine.ts` |
| `05-troubleshooting-and-glossary.md` | Common failure modes, F2T2E/Five D's/fog-of-war/AP/King/regime/precision terminology | Live reproduction (port-in-use case) + `shared/src/types.ts`/`interfaces.ts` |
| `docs/manual/*.png` | 5 real screenshots: landing, King deployment picker, King deployment waiting, active board (turn 1), active board (after a deploy) | Captured live via Playwright this session against commit `b8ec3bd` |

## Screenshot inventory (`docs/manual/`)

| File | Captures |
|---|---|
| `landing.png` | The Landing screen before any session exists. |
| `king-deployment-picker.png` | Player 1's King Deployment screen, mission-set/regime selects populated from the real template catalog. |
| `king-deployment-waiting.png` | Player 1's screen immediately after submitting their King deployment, before Player 2 has submitted. |
| `game-board-active.png` | Both players' active board immediately after both Kings are deployed (turn 1, before any action). |
| `game-board-after-deploy.png` | Player 1's board after successfully deploying one asset — shows the confirmed blank-regime gap described in `03-first-game.md`. |

## Change discipline (FR-9320)

Whenever a stage-08 code package changes any file this matrix cites in its "Verified via" column,
`08-training-manual-authoring` must re-run against the new behavior and update the affected
section(s) plus this matrix's rows before the package's change is considered fully integrated
into the corpus. In particular: **if a future package adds the missing Maneuver/Task/Engage
targeting UI (or Deploy's regime picker), this matrix's FR-9420 row and `03-first-game.md` must be
revisited immediately** — that change would newly enable a genuine win-condition walkthrough this
pass could not produce.

> Sources: `docs/requirements/01-functional-requirements.md` (FR-9000 family),
> `docs/requirements/02-non-functional-requirements.md` (NFR-10000 family). Satisfies FR-9210.
