# Strategic Assumptions Register

- **Owned by:** `01-vision` · **Status:** 🟢 First four gate items resolved by the owner
  2026-08-21 (see rows OQ-01, OQ-01b, OQ-02, OQ-09 below). OQ-04 through OQ-08 and OQ-10 remain
  open, deferred to their named downstream stage exactly as originally scoped — they were never
  blocking this gate, only OQ-01/01b/02/09 needed an answer before `03-architecture-design-
  synthesis` could safely start. A8/A9 added 2026-08-22/23 (two-body `Propagator` baseline;
  training corpus as a co-equal product).

Each row: the assumption as currently carried, its basis, and the trigger — the point at which it
must be revisited. Rows OQ-01 through OQ-10 map 1:1 to the seed SOR's own numbering so nothing is
lost in translation.

| ID | Assumption made | Where it matters | Status | Confirm/revise before... |
|---|---|---|---|---|
| **OQ-01** | OW Chess is a standalone game — not a merge with the single-player `ORBITAL COMMAND` campaign concept (confirmed distinct on inspection, §4 of MSTR-001), and not a mode of `ZabSpaceExercise`. | MSTR-001 §1, §5, §6 | ✅ **Confirmed** (owner, 2026-08-21) | Resolved — standalone, zero shared runtime code, no unified asset vocabulary for v1. |
| **OQ-01b** | Turn structure is **strict alternating** (I-go-you-go, chess-style) rather than simultaneous "WeGo" order-writing where both players commit moves and the server resolves them together. | MSTR-001 §1, §3 C2; GDS-00 turn loop | ✅ **Confirmed** (owner, 2026-08-21) | Resolved — `03-architecture-design-synthesis` designs the server's turn-resolution model around reject-out-of-turn enforcement, not simultaneous-commit-and-resolve. |
| **OQ-02** | Tech stack. | MSTR-001 (implicit via SOR §8.1) | ✅ **Confirmed via [ADR-0001](adr/ADR-0001-tech-stack.md)** (2026-08-21) | The owner declined to dictate a language/framework; `03-architecture-design-synthesis` compared TypeScript full-stack against Python, Go, and Rust alternatives (ADR-0001) and confirmed: Node.js server + React client, TypeScript throughout, WebSocket transport, in-memory per-session state, no database. No longer tentative — every skill may cite it as settled. |
| **OQ-04** | v1 mission-set roster size (3: SATCOM, ISR, PNT-lite) and content. | SOR §7.4 | 🟡 Open | `04-requirements-engineering` |
| **OQ-05** | v1 asset roster (6 sensors/effectors) and relative cost/time tiers — qualitative only, no numbers set yet. | SOR §7.5 | 🟡 Open | `04-requirements-engineering` / `06-feature-specification` |
| **OQ-06** | Mission-denial win condition uses a duration threshold (exact turn count unset) rather than a point/damage total. | SOR §7.9 | 🟡 Open | `04-requirements-engineering` |
| **OQ-07** | A maximum session length exists at all, with a tiebreak rule. | SOR §7.9 | 🟡 Open | `04-requirements-engineering` |
| **OQ-08** | Deployment/hosting target unspecified beyond "a single process, run locally or on any host matching whatever stack OQ-02 lands on." | SOR §8.1 | 🟡 Open | `03-architecture-design-synthesis` |
| **OQ-09** | v1 scope is MVP-first, with the full end-state vision captured only as a non-authorized roadmap (SOR §5.3), not attempted in one release. | SOR §5, §5.3 | ✅ **Confirmed** (owner, 2026-08-21) | Resolved — v1 scope is exactly SOR §5.1; §5.3's R1-R7 stay unauthorized backlog. |
| **OQ-10** | AP cadence, action costs, and all other numeric balance values are unset placeholders, not tuned by design intent. | SOR §7.2, §10, §14 | 🟡 Open | `06-feature-specification` |
| **OQ-03** | Visual direction: dark "ops console" aesthetic, pending review of the `ZabOW` reference. | SOR §9.1 | ✅ **Resolved** | Resolved this run — see MSTR-001 §4. The `claude/orbital-warfare-campaign-FWLKi` branch was merged into `ZabOW`'s `main` (PR #1) and deleted post-merge; its content (`ORBITAL COMMAND`) was read directly from `main`. The placeholder direction is substantially confirmed by the real reference, with concrete layout precedent now available (radial LEO/MEO/GEO bands, corner HUD panels, cyan/red palette). No further owner action needed on this item unless the owner disagrees with adopting that reference. |
| **A8** *(new, 2026-08-22)* | The v1 `Propagator` baseline is **two-body Keplerian motion only** (no J2 perturbation) — MSTR-001 C4, amended v0.3. J2 (and, later, SGP4/TLE per R4) may be added behind the same interface if two-body's lack of nodal precession is found to hurt the polar/sun-synchronous plane class's gameplay legibility or doctrinal grounding (R-203 §3.3's own argument for that plane class rests entirely on J2). | Owner decision, 2026-08-22, following a design discussion on `Propagator` implementation risk — two-body motion retires BL-0005/BL-0011's J2-specific risk entirely for v1, at the cost of deferring the sun-synchronous class's physical justification. | Revisit once FEAT-5000 is implemented and playtested: if players can't distinguish/don't care about the polar/sun-synchronous class without real nodal precession, either accept it as label-only or schedule a J2 addition behind the `Propagator` seam (a swap, not a rewrite, per C4's own interface-isolation promise). Also revisit if a future SGP4/TLE adoption decision (R4) is ever made — J2 would very likely be subsumed by that at the same time. |
| **A9** *(new, 2026-08-23)* | The operator-facing training corpus (`docs/training/`+`docs/manual/`) is a **co-equal product with the code** — MSTR-001 C10, added v0.4. A release cannot be certified ready on automated-test/code-verification evidence alone; a stage-09-peer training review must also pass clean. Scoped to one shared player-facing corpus (no per-role manuals — OW Chess has no facilitator/multi-cell structure, unlike the `ZabSpaceExercise` pattern this is modeled on). | Owner decision, 2026-08-23, at the MVP release's G4 gate: deferred the GO/NO-GO call pending a real human playtest, requiring first that the game actually run end-to-end (closing BL-0038/BL-0027) and that operator-facing instructions exist and are verified against that real, running result. | Revisit if a future release ships a genuinely different interaction model (e.g., a facilitator/spectator mode) that would need per-role manual scoping the current single-corpus design doesn't anticipate. Otherwise stands as the permanent release-readiness bar for every future increment, not just the MVP bucket. |

## Additional risk items carried from SOR Appendix B (not OQ-numbered, tracked here for visibility)

| Risk | Trigger to revisit | Owner |
|---|---|---|
~~A hard turn lock (now confirmed via OQ-01b) stalls the game if one player disconnects and never returns.~~ | **Resolved 2026-08-22** — owner deliberately chose "wait forever," but not by omission: FR-7300/FS-101 §W7 specify that the still-connected player is notified and offered an explicit choice to keep waiting or cancel (ending the session with no winner). The risk this row warned against (defaulting to indefinite wait *without* the player being told or given a choice) is what's actually avoided. | `06-feature-specification` (done) |
| Untuned numeric balance (OQ-05/06/10) ships as if final. | Any package touching AP costs, asset costs, or the mission-denial threshold — tag first-guess values explicitly in code/config (mirroring `ZabGBCprocgenMusic`'s placeholder-tagging convention) so they're never mistaken for tuned. | `08-code-implementation` / `08-content-authoring` |
| Fog-of-war leak via client inspection. | Treat as a single, centrally-tested server boundary (FR-3002), not re-implemented per feature. | `03-architecture-design-synthesis` (design), `09-package-verification` (ongoing gate) |
| Scope creep from the deliberately non-exhaustive action list (SOR §7.2). | Any new action-type idea — route through `00-intake` into the backlog like any other feature request, not added ad hoc mid-implementation. | `00-intake` |
~~Tech-stack decision now genuinely open (OQ-02), not a rubber-stamp.~~ | **Resolved 2026-08-21** — [ADR-0001](adr/ADR-0001-tech-stack.md) is a real comparative decision (TypeScript full-stack vs. Python/Go/Rust alternatives), not a restatement of the SOR's candidate. | `03-architecture-design-synthesis` (done) |

## How this register is used

- **Not itself authoritative** — MSTR-001 §1–§5 remain the source of truth once confirmed; this
  table exists so "is X still open?" has one place to check.
- **Reviewed at every `01-vision` consistency check** and whenever a trigger condition above fires.
- **A fired trigger doesn't automatically change anything** — it's a finding, routed to whichever
  skill owns the actual response, per this register's own routing column above.
