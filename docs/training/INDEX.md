# Training Corpus — Index

OW Chess has **one shared player-facing training corpus** (both players see the identical
interface and action set — no per-role manuals, unlike the sibling ZabSpaceExercise project this
pattern is modeled on). This corpus documents the shipped, `VERIFIED` application only (FR-9310)
— see `06-manual-traceability.md` for exactly what is and isn't yet covered.

| Module | Contents | Status |
|---|---|---|
| [`01-install-and-run.md`](01-install-and-run.md) | Zero-prior-experience install/build/run walkthrough | Complete, live-verified |
| [`02-interface.md`](02-interface.md) | The Landing/King-deployment/six-panel active-board UI tour | Complete, live-verified |
| [`03-first-game.md`](03-first-game.md) | First-game walkthrough, as far as the shipped UI supports | Complete for as-shipped scope; documents a confirmed UI gap blocking a full win-condition walkthrough |
| [`04-actions-reference.md`](04-actions-reference.md) | Every action type, asset template, mission set, effect, and win condition | Complete |
| [`05-troubleshooting-and-glossary.md`](05-troubleshooting-and-glossary.md) | Common failure modes + full glossary | Complete |
| [`06-manual-traceability.md`](06-manual-traceability.md) | Bidirectional FR-9000/NFR-10000 ⇄ manual-section matrix | Complete |

Screenshots live under [`docs/manual/`](../manual/INDEX.md).

First authoring pass: 2026-08-23, against commit `b8ec3bd` (IP-9038 + IP-9056 both `VERIFIED`,
integration-review-clean per `docs/reviews/integration-review-remediation-tranche-9038-9056.md`).
