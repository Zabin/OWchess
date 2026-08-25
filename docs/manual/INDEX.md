# Manual Screenshots — Index

All images below are genuine Playwright captures of the real running application (commit
`b8ec3bd`), taken this session with a fresh two-browser-context script driving an actual game
session end to end. None are mockups, wireframes, or hand-edited (NFR-10200).

| File | Caption | Used in |
|---|---|---|
| [`landing.png`](landing.png) | The Landing screen before any session exists — "Create Game" / "Join Game." | `docs/training/01-install-and-run.md`, `02-interface.md` |
| [`king-deployment-picker.png`](king-deployment-picker.png) | Player 1's King Deployment screen: mission-set and orbital-regime selects, populated from the real server-provided template catalog. | `docs/training/02-interface.md` |
| [`king-deployment-waiting.png`](king-deployment-waiting.png) | Player 1's screen immediately after submitting their King deployment, before Player 2 has submitted theirs. | `docs/training/02-interface.md` |
| [`game-board-active.png`](game-board-active.png) | Both players' active board immediately after both Kings are deployed — turn 1, before any in-game action. | `docs/training/03-first-game.md` |
| [`game-board-after-deploy.png`](game-board-after-deploy.png) | Player 1's board after deploying one asset — also documents the confirmed blank-orbital-regime gap (see `docs/training/03-first-game.md`). | `docs/training/03-first-game.md` |

Capture method: `server/verify-training-corpus.mjs` (a one-off script written this session,
started the real built server on a scratch port, drove two Playwright browser contexts through
the real `http://localhost:.../` app, and saved each `page.screenshot()` — not committed to the
repo, since it's a one-time capture tool, not a maintained test).
