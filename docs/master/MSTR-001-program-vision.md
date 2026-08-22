# MSTR-001 — Program Vision: OW Chess

- **Document ID:** MSTR-001 · **Version:** 0.3 · **Status:** 🟢 Gate-confirmed — the owner has
  resolved the four items that were blocking this gate (OQ-01, OQ-01b, OQ-02, OQ-09; see §8 and the
  [Strategic Assumptions Register](../architecture/strategic-assumptions-register.md)). Remaining
  open items (OQ-04–OQ-08, OQ-10) were never gating this vision — they proceed to their named
  downstream stage as originally scoped. **v0.3 amends C4** (two-body-only propagation for v1,
  J2/SGP4 deferred behind the `Propagator` seam) — see §8.
- **Date:** 2026-08-21 (v0.1–v0.2); 2026-08-22 (v0.3) · **Owned by:** `01-vision` skill
- **Derived from:** [`docs/seed/STATEMENT_OF_REQUIREMENTS.md`](../seed/STATEMENT_OF_REQUIREMENTS.md)
  v0.1 (project owner, 2026-08-21), §1–§6, read in full before authoring this document, per the
  owner's [kickoff instruction](../seed/CLAUDE_CODE_KICKOFF_PROMPT.md).
- **Design-facing restatement:** [`docs/architecture/00-vision.md`](../architecture/00-vision.md)
  (GDS-00)

## §0 Provenance — what is harvested vs. what is new

This project's **documentation-driven-development pipeline** (this skill hierarchy, the
journal/backlog mechanism, the G1–G5 governance rules, the artifact ID conventions) is **adapted**
from a separate, unrelated project, `ZabGBCprocgenMusic` (a Game Boy Color procedural-music ROM) —
only the *process pattern* carries over; none of that project's content (chiptune generation,
Game Boy hardware specifics) is relevant here and none of it has been copied.

This project's **domain content** (SDA/counterspace doctrine, the six-access-channel model, the
Five D's effect taxonomy, the `Propagator` interface pattern, server-enforced fog-of-war/
belief-state rendering, the schema-validated asset-template library convention) is reused
**conceptually** from a sibling project, `ZabSpaceExercise` (a PME wargaming simulator) — cited as
source material during `02-research-*`, never as shared runtime code. `ZabSpaceExercise` is a
Python/FastAPI, facilitator-run, training-fidelity tool; OW Chess is a from-scratch TypeScript(?)
two-player competitive game with no shared codebase, no accounts, and a deliberately simpler fog
model (no belief-state-divergence/AAR-replay tooling).

This project's **visual/UX style reference** is `ZabOW` — see §9.1-equivalent note below: the
branch the owner pointed to (`claude/orbital-warfare-campaign-FWLKi`) has since been merged into
`ZabOW`'s `main` branch (PR #1, merged 2026-08-21) and the source branch deleted as normal
post-merge cleanup. Its content — a mobile-first React game, "ORBITAL COMMAND: Operation
Contested Orbit" — has now been read directly from `main`. See §4 below for what carries over.

| Harvested pattern only | Harvested concept, rebuilt fresh | Built new for this project |
|---|---|---|
| The documentation-driven pipeline itself (`.claude/skills/`, staged 00→11, journal + backlog persistence, G1–G5) — adapted in file names and domain examples only, mechanics unchanged. | The `Propagator` interface boundary (two-body Keplerian internally for v1 — see C4 v0.3 — discrete regime/slot presentation externally) — concept from `ZabSpaceExercise`, reimplemented in this project's own stack. Six-access-channel model and Five D's taxonomy — reused directly per the owner's SOR. Server-enforced fog-of-war principle — reused, simplified (no belief-state-divergence tooling). | The entire two-player, strictly-alternating-turn, chess-style King-hunt game loop (find→fix→track→target→engage compressed to discrete turn-scale actions) — no equivalent exists in either reference project. `ZabSpaceExercise` is simultaneous/facilitator-paced training; `ORBITAL COMMAND` (ZabOW) is a single-player wave-defense arcade game with a 12-mission campaign, not a 2-player hidden-information contest. |

## §1 What this project is

**OW Chess** is a two-player, web-browser, turn-based multiplayer strategy game built on the
find-fix-track-target-engage (F2T2E) logic of real space-domain-awareness (SDA) and counterspace
operations, expressed as a chess-like abstract strategy game — not a simulation, and not the
single-player arcade/campaign shape of the earlier `ORBITAL COMMAND` concept. Each player secretly
deploys a **King satellite** — a mission-bearing asset with a mission set (e.g., SATCOM, ISR,
PNT-lite) and an orbital regime — and wins by locating, characterizing, and denying or destroying
the opponent's King before the reverse happens.

Turns are **fixed and strictly alternating** — classic chess-style I-go-you-go, not a shared
real-time clock and not a simultaneous "WeGo" order-writing structure. On a player's turn they
spend a fixed action-point (AP) allotment on one or more actions (maneuver, task an asset, deploy
a new asset, or pass) before play passes to the opponent; the server enforces turn order and
rejects any action attempted out of turn. A WebSocket connection pushes turn-change and
resolved-action notifications to both clients instantly, but this is a UX/latency choice
(avoiding polling), not a live/simultaneous-action design — the underlying model has no
concurrent-action race to resolve.

The server holds ground truth for both players' assets; each client renders **only that player's
own earned belief-state**, never the opponent's raw data — this is enforced server-side as a
security property (a client-side leak is trivially inspectable via browser devtools), not only a
gameplay convenience. Orbital mechanics are propagated internally with real orbital math (v1
baseline: two-body Keplerian motion, per C4 v0.3 — J2/SGP4 are a later, deliberate call, not a
fixed floor), but presented to players as discrete, chess-legible regimes/slots (e.g., LEO/MEO/
GEO-analog bands) — simple for gameplay, real math underneath, mirroring the ZabOW `ORBITAL
COMMAND` reference's own LEO/MEO/GEO radial-band presentation almost exactly (§4).

## §2 Who it is for

1. **The two players:** adults with an interest in wargaming/military strategy, not necessarily
   space-domain experts. They need a rules-legible game that rewards deduction and planning, not
   memorized doctrine trivia — the UI itself must be the rules reference for legal moves (no
   external documentation required for basic play).
2. **The owner, as designer/maintainer:** builds and iterates on the game via Claude Code sessions.
   Needs traceable requirements, a data-driven asset model (new content is a JSON/YAML template
   change, not a code change), and a spec precise enough that implementation doesn't require
   guessing intent.

## §3 Scope commitments (what must always be true)

| # | Commitment | Notes |
|---|---|---|
| C1 | Exactly **two players**, no accounts, no matchmaking, no database for v1. A shareable session join link is the entire onboarding flow. | SOR §5.1, §5.2, §8.5, G-6. |
| C2 | Turns are **fixed and strictly alternating** (chess-style I-go-you-go), not simultaneous "WeGo" order-writing. **Confirmed by the owner, 2026-08-21 (OQ-01b).** | SOR §1, §7.2. |
| C3 | The server is the **sole authority** for game state; fog-of-war (per-player belief-state) is enforced server-side, never computed or inferred client-side. | SOR §7.7, NFR-2001 — a security requirement, not a design preference. |
| C4 *(amended v0.3)* | Orbital mechanics are **hybrid-fidelity**: real orbital propagation internally, discrete named-regime/slot presentation externally, behind a `Propagator`-equivalent interface boundary that isolates the implementation so a fidelity change (higher — J2, later SGP4/TLE per R4; or shared code with `ZabSpaceExercise`) is a swap, not a rewrite. **The v1 baseline propagation model is plain two-body Keplerian motion (no J2 perturbation)** — not the "minimum Kepler+J2" floor v0.1/v0.2 stated. Whether J2 (and, later, SGP4) is added is **not decided here**: it is an explicit, deliberate follow-on call made after assessing two-body's actual gameplay impact (specifically: whether the polar/sun-synchronous plane class in the regime taxonomy — R-203 — reads as meaningfully distinct to players without the nodal-precession physics that is its only real-world justification), not a fixed commitment either way. | SOR §7.6, FR-5001–5005, NFR-5003; owner decision 2026-08-22 (see §8). |
| C5 | The v1 starting content set is **3 mission sets**, **6 sensor/effector asset types**, and the **Five D's** effect taxonomy (Deceive/Disrupt/Deny/Degrade/Destroy) — sufficient to exercise the full F2T2E chain at least two different ways. Exact roster is data (JSON/YAML template), not code. | SOR §7.4, §7.5, §7.8, FR-2001–2006, NFR-5001. |
| C6 | Win conditions: **King destruction**, **mission-denial-by-duration**, **resignation**, and a **timeout/tiebreak** path. Exact numeric thresholds are explicitly deferred to `04-requirements-engineering`/`06-feature-specification` — not fixed here. | SOR §7.9, §14. |
| C7 | A **ground-vs-space cost/time asymmetry** is a required mechanic: ground-based assets are generally cheaper/faster but geometrically constrained; space-based assets are generally more capable/persistent but costlier/slower. Exact numbers are a tuning question, not fixed here. | SOR §7.5, FR-2004. |
| C8 | The action-turn UI must expose, at all times: whose turn is active and current AP; every currently-legal action (no dead/silently-rejected menu entries); every deployable asset with cost/time-to-online shown before commit; the player's own King status and everything currently earned about the opponent. | SOR §7.10, §9.2, FR-7001–7005, NFR-4001–4002. |
| C9 | Visual direction follows the **ZabOW `ORBITAL COMMAND` reference** (§4 below) — a dark "ops console" aesthetic with a radial LEO/MEO/GEO band presentation, corner-anchored HUD panels, and a cyan/blue-friendly, red-hostile/alert color convention — not the SOR §9.1 placeholder description in isolation (that placeholder turns out to describe the real reference closely, but is now superseded by having actually seen it, per the owner's explicit instruction). | Resolves OQ-03 — see §4. |

## §4 What was found on the ZabOW reference, and what carries over

The owner's kickoff prompt pointed at `ZabOW` branch `claude/orbital-warfare-campaign-FWLKi` as
the real visual-style reference, noting the SOR's author (a prior chat session) had been blocked
from reading it and had drafted §9.1 as an unconfirmed placeholder pending this project's own
read. That branch **no longer exists** — `git ls-remote` and the GitHub UI both show only `main`
on `ZabOW` now, because the branch was the source of PR #1 ("ORBITAL COMMAND — USSF orbital
warfare campaign game"), merged into `main` on 2026-08-21, with the source branch deleted as
normal post-merge cleanup. Its content is therefore now `ZabOW`'s `main` branch, read directly.

**What `ORBITAL COMMAND` actually is:** a mobile-first React + Vite + HTML5 Canvas single-player
game — a 12-mission campaign ("Operation Contested Orbit") plus a Quick Mission mode, built around
Detect→Track→Engage doctrine with ISR/COMM/INTC/STRK/EWAR/DEF satellite roles, three altitude
bands (LEO/MEO/GEO), orbital decay, fuel consumption, and debris fields. This is the same prior
concept the SOR's §5.2/§6 already named as "adjacent, not merged" (a single-player campaign, not
this project's 2-player competitive design) — confirmed now by direct inspection, not just by the
SOR's description of it.

**What carries over to OW Chess (visual/UX only, per SOR §9.1's own instruction):**

- The dark, high-contrast "ops console" palette: near-black background (`#000814`/radial
  `#050a18`→`#000308`), glowing cyan/blue title and friendly-asset accents, a warm red/orange
  reserved for hostile-contact and alert states, monospace/uppercase HUD labels, subtle animated
  starfield background.
- The **radial band layout** for orbital presentation — concentric dashed rings labeled LEO / MEO
  / GEO around a central planet, with assets as small glowing markers on their band — is a very
  close visual precedent for this project's own §7.6 "discrete regime/slot" requirement. This
  should be the strong starting point for `03-architecture-design-synthesis`'s GDS-08 presentation
  design, not re-derived from scratch.
- Corner-anchored HUD panel layout (status/threat counters top-left and top-right, a
  selected-asset detail panel bottom-left, a contextual message bar, a bottom action-button row)
  maps directly onto this project's own SOR §9.2 panel inventory (orbital board, action menu,
  asset tray, mission/King status, intel panel, event log) — a real layout precedent exists, it
  does not need to be invented.
- Diamond-shaped friendly-asset markers, colored underline/tag per asset role, and a distinct
  marker style for an unresolved/uncharacterized contact ("RECON", shown dim/orange) — a useful
  precedent for this project's own uncertain/unknown-contact rendering requirement (FR-7002).

**What does not carry over:** the single-player wave/mission structure, the touch-drag maneuver
interaction (this project has discrete per-turn actions, not continuous real-time control), the
persistent local-storage save/progression system (SOR §5.2 excludes cross-session progression for
v1), and the specific satellite-role taxonomy (ISR/COMM/INTC/STRK/EWAR/DEF) — this project's own
mission-set/asset roster (SOR §7.4/§7.5) is a different, smaller, 2-player-balanced set.

**This resolves OQ-03** (SOR §16): the visual direction is no longer a placeholder pending review
— it has been reviewed, and substantially confirms the SOR's own placeholder guess, with concrete
layout precedent now available. `03-architecture-design-synthesis` should treat GDS-08 as
grounded in this reference, not starting from nothing.

## §5 Non-goals (at this vision's date)

Not commitments against forever — explicitly *not* promised **yet**, per SOR §5.2: AI/bot
opponent · more than 2 players / spectator mode · ranked play, matchmaking, ELO, persistent
accounts or cross-session progression · mobile-native builds (responsive browser layout is in
scope; a dedicated mobile UI is not) · real named/current satellites via TLE import (fictional/
generic assets only) · merging with, or unifying the asset vocabulary of, either `ZabSpaceExercise`
or the single-player `ORBITAL COMMAND` campaign concept.

## §6 Quality bar

"Done" for any change means: the app builds/starts cleanly and the full automated test suite
passes (G5); fog-of-war non-leakage is centrally tested, not re-verified ad hoc per feature; the
deterministic game-state-resolution core has coverage for legal-action enumeration, the F2T2E
gating chain, and all win-condition paths (SOR §13); the behavior is traceable through the
pipeline's artifacts (requirement → feature spec → package → verification report); and no numeric
tuning value ships silently as if it were a deliberate design choice — untuned first-guess values
are tagged as such in code/config, mirroring the `ZabGBCprocgenMusic` project's own placeholder-
tagging convention (SOR Appendix B risk table).

## §7 Authority & document precedence

1. This document (MSTR-001) is the top of the tree for *purpose-level* statements; the GDS ladder
   (`docs/architecture/`) is authoritative for design as each level's merge gate closes.
2. Until this project authors its own `docs/master/MSTR-00x` governance document, the rules
   **G1–G5** in [`.claude/skills/README.md`](../../.claude/skills/README.md) are binding.
3. Conflicts between documents are findings for the owning skill — never resolved by silently
   editing the downstream copy.

## §8 Change control & open items

A change to §1–§5 is made only by the `01-vision` skill, dated, with rationale recorded below, and
the downstream blast radius enumerated.

**Gate status:** the four items that were genuinely blocking downstream architecture work —
OQ-01 (standalone scope), OQ-01b (turn structure), OQ-02 (tech stack), OQ-09 (MVP-first scope) —
were put to the owner and resolved 2026-08-21 (see v0.2 row below). OQ-03 (visual style) was
resolved earlier in this same run by direct inspection (§4). The remaining items (OQ-04 through
OQ-08, OQ-10) were never blocking this gate — they proceed to their originally-named downstream
stage (`04-requirements-engineering`, `06-feature-specification`, `03-architecture-design-
synthesis`) exactly as the seed SOR scoped them. Full detail for every item lives in the
[Strategic Assumptions Register](../architecture/strategic-assumptions-register.md).

| Date | Version | What changed | Why | Downstream blast radius |
|---|---|---|---|---|
| 2026-08-21 | 0.1 | Initial authoring from `STATEMENT_OF_REQUIREMENTS.md` §1–§6; ZabOW reference read directly (§4), resolving OQ-03. | Owner's kickoff instruction: bootstrap the pipeline, run `01-vision` from the SOR, and read the real ZabOW branch before any visual work. | Grounds `docs/architecture/00-vision.md` (GDS-00) and everything downstream. OQ-01/01b/02/04–10 remain open — nothing past this vision tier should treat them as decided until the owner responds. |
| 2026-08-21 | 0.2 | Owner confirmed OQ-01 (standalone), OQ-01b (strict alternating turns), OQ-09 (MVP-first); resolved OQ-02 by explicitly delegating the tech-stack choice rather than confirming the SOR's candidate — *"I will not dictate the tech stack or language. Use the best language to solve the requirements."* C2 updated to remove its "not yet confirmed" flag. | Owner's response at the `01-vision` gate to the four surfaced open questions. | `03-architecture-design-synthesis` can now proceed on a confirmed turn-structure model and confirmed standalone scope, but must produce a real comparative ADR for the tech stack (not adopt the SOR's candidate by default) — see the Strategic Assumptions Register's OQ-02 row and its added risk-table entry. `04-requirements-engineering`/`06-feature-specification` proceed on OQ-04–08/10 exactly as originally scoped, unaffected by this amendment. |
| 2026-08-22 | 0.3 | Amended C4: the v1 propagation baseline is now **plain two-body Keplerian motion**, not "minimum Kepler+J2." The `Propagator` interface seam (already required by C4/FR-5005) must isolate the model so J2 — and later SGP4/TLE per R4 — can be added without a rewrite, but adding J2 is now an explicit, deliberate follow-on decision gated on real gameplay impact, not a fixed commitment. Specifically: whether the polar/sun-synchronous plane class (R-203) needs J2's nodal-precession physics to read as meaningful to players, or whether it can ship as a label-only distinction for v1, is a question to answer from playtesting/implementation experience, not guessed now. | Owner, following a design discussion on `Propagator` risk: two-body motion removes nearly all of FEAT-5000's implementation risk (no perturbation formula to source/cross-verify — retires BL-0005/BL-0011's J2-specific concern entirely for the v1 baseline) at the cost of the sun-synchronous plane class's physical justification, which the owner chose to accept as a deferred, data-driven call rather than resolve either way now. | **GDS-01** (Concept of Operations — no change, propagation model is architecture-invisible at this level). **GDS-03** (Architecture — `Propagator`'s interface shape is unchanged, since it was already designed as a swappable boundary; its *internal* v1 implementation is now two-body, not Kepler+J2). **GDS-04** (Domain Model — `OrbitalRegime`'s polar/sun-synchronous plane class no longer has a physical mechanism backing it for v1; flagged as a new Open Question for `03` to record). **R-203** (research — its own §3.3 argument for the polar/sun-synchronous distinction rested entirely on J2; needs an explicit amendment note marking that distinction provisional/label-only until J2 is (if ever) added). **FR-5100** (requirements — "Kepler+J2-minimum" wording needs updating to "two-body Keplerian, v1 baseline"). **FEAT-5000** (feature catalog — Risk should be revised down from High, and its description updated to reflect the seam-first, J2-deferred plan). All six updated in this same session — see below. |
