# Feature Catalog — v1

- **Owned by:** `05-feature-decomposition` · **Status:** ✅ Authored, 2026-08-22
- **Source:** `docs/requirements/01-functional-requirements.md`, `02-non-functional-requirements.md`

Eight Features, one per `04`'s own FR-#### capability grouping (FR-1000...FR-8000) — the
grouping was already cohesive and module-aligned at the requirements stage, so Feature boundaries
follow it directly rather than re-deriving new ones. Every FR/NFR is owned by exactly one Feature.

---

### FEAT-1000 — Session & Turn Lifecycle

- **Specified by:** [FS-101](../features/FS-101-session-turn-lifecycle.md) (2026-08-22)
- **Purpose:** Get two players from "create a link" to "a resolved game," enforcing strict
  turn alternation throughout.
- **Description:** Session creation/join, secret simultaneous King deployment, the AP-driven turn
  loop (grant/spend/pass/exhaust), and all four win-condition paths (destruction, denial,
  resignation, timeout/tiebreak).
- **Scope:** Everything in FR-1xxx. Excludes the *content* of what an action does (that's
  FEAT-2000/3000/4000/5000) — this Feature owns *whose turn it is and what ends the game*, not
  what a specific action accomplishes.
- **Included Requirements:** FR-1110, FR-1120, FR-1121, FR-1130, FR-1210, FR-1220, FR-1230,
  FR-1310, FR-1320, FR-1330, FR-1340, FR-1350, FR-1405, FR-1410, FR-1420, NFR-2100, NFR-2200,
  NFR-3200, NFR-6100, NFR-5200*, NFR-8100*, NFR-9100* (*process/cross-cutting NFRs bookkept here
  as the foundational Feature — see Notes).
- **Excluded Requirements:** FR-2xxx–FR-8xxx (all live in their own Features below); FR-4200's
  Destroy-effect *mechanics* live in FEAT-4000, only the resulting *win check* (FR-1405) is here.
- **Dependencies:** none (this is the foundation every other Feature's actions plug into).
- **Dependent Features:** FEAT-2000, FEAT-3000, FEAT-4000, FEAT-5000 (all submit actions through
  this Feature's turn/AP gate); FEAT-7000 (transport carries this Feature's state deltas);
  FEAT-8000 (renders this Feature's turn/AP/win state).
- **Affected Modules:** `GameEngine`, `TurnManager`.
- **Related ADRs:** ADR-0001.
- **User Value:** High — without this, there is no game (both players can't even reach a first
  move).
- **Technical Value:** High — every other Feature's actions route through `TurnManager`'s
  legality gate.
- **Complexity:** Medium — the turn/AP state machine itself is small, but win-condition checking
  must run correctly after every other Feature's action resolves (FR-1405 depends on FEAT-4000's
  Destroy; FR-1420 depends on FEAT-4000's denial tracker), making this Feature's *correctness* tied
  to integration with three others even though its own logic is simple.
- **Risk:** Medium — a bug here (e.g., a win check that misses a trigger) is a game-breaking
  defect, not a cosmetic one.
- **Suggested Verification Strategy:** Test — deterministic given a fixed action sequence
  (NFR-2100 exists specifically to make this testable).
- **Open Questions:** none — CR-02 (disconnect/reconnect policy) resolved 2026-08-22 by owner
  decision, specified in FS-101 §W7 (no grace period; notify-and-choose wait/cancel).
- **Notes:** NFR-5200 (pipeline compliance), NFR-8100 (test-coverage bar), and NFR-9100
  (reproducible build) are project-wide process requirements, not features of the shipped game —
  bookkept on this foundational Feature per the catalog's "every NFR owned by exactly one Feature"
  rule, rather than left formally unowned.

### FEAT-2000 — Sensing & the F2T2E Chain

- **Specified by:** [FS-103](../features/FS-103-sensing-f2t2e-chain.md) (2026-08-22)
- **Purpose:** Let a player advance their knowledge of the opponent through sensor tasking,
  gated by asset capability, decaying if not maintained.
- **Description:** Task a sensor; advance belief precision along find→fix→track→target per the
  tasking asset's `chainRoles`; decay stale entries; surface precision/staleness to the UI.
- **Scope:** The *mechanics of gaining/losing knowledge*. Excludes the *enforcement* that nothing
  beyond that knowledge ever reaches a client (that invariant is FEAT-6000 — a deliberate straddle
  justification: FEAT-2000 is "what a player can learn," FEAT-6000 is "the boundary that makes
  sure they learn no more than that," and conflating them would make the security-critical
  enforcement harder to test in isolation).
- **Included Requirements:** FR-2100, FR-2200, FR-2300, FR-2400.
- **Excluded Requirements:** FR-6100/FR-6200 (FEAT-6000); FR-4100 (targeting-quality gate for
  engagement lives in FEAT-4000, which *reads* FEAT-2000's precision output but doesn't own it).
- **Dependencies:** FEAT-1000 (AP gate; a tasking action costs 1 AP), FEAT-3000 (an asset's
  `chainRoles` come from its template).
- **Dependent Features:** FEAT-4000 (engagement legality reads this Feature's precision),
  FEAT-6000 (belief-state entries this Feature writes are what FEAT-6000 filters), FEAT-8000
  (intel panel renders this Feature's output).
- **Affected Modules:** `BeliefState`.
- **Related ADRs:** none.
- **User Value:** High — this is the core "detective work" loop the game's entire pitch rests on.
- **Technical Value:** High.
- **Complexity:** Low *(revised down from Medium, 2026-08-22)* — the precision-gating logic is
  straightforward and the decay mechanism's numeric rate is now resolved (FS-103 §W3: 5 turns,
  `'find'`-level removal).
- **Risk:** Low.
- **Suggested Verification Strategy:** Test.
- **Open Questions:** none — CR-01 resolved 2026-08-22, see FS-103 §W3.

### FEAT-3000 — Asset Roster & Mission Sets

- **Specified by:** [FS-102](../features/FS-102-asset-roster-mission-sets.md) (2026-08-22)
- **Purpose:** Provide the data-driven content (mission sets, asset types) every other Feature
  operates on, and enforce the ground/space cost-time asymmetry.
- **Description:** Schema-validated templates for SATCOM/ISR/PNT-lite and the six v1 asset types;
  deploy-with-cost-deduction; block pre-online use.
- **Scope:** *Content* and its deploy lifecycle. Excludes what a deployed asset *does* once online
  (tasking is FEAT-2000, engaging is FEAT-4000, maneuvering is FEAT-5000).
- **Included Requirements:** FR-3100, FR-3200, FR-3300, FR-3400, FR-3500, NFR-5100, NFR-9200.
- **Excluded Requirements:** none straddle out of this Feature.
- **Dependencies:** FEAT-1000 (deploy is an AP-spending action).
- **Dependent Features:** FEAT-2000 (sensor `chainRoles`), FEAT-4000 (effector templates),
  FEAT-5000 (every asset's regime/maneuver budget references its template), FEAT-8000 (asset
  tray renders template cost/time-to-online).
- **Affected Modules:** content templates (data, not engine code — this is the one Feature whose
  primary artifact is data, per `08-content-authoring`'s eventual peer role).
- **Related ADRs:** none.
- **User Value:** High — the roster *is* the game's strategic vocabulary.
- **Technical Value:** High — NFR-5100/9200's data-driven-extensibility promise rests entirely on
  this Feature being genuinely code-free to extend.
- **Complexity:** Low — this is schema + data, not novel logic.
- **Risk:** Low.
- **Suggested Verification Strategy:** Test (schema validation) + Inspection (a template addition
  touches no engine module, per FR-3100's own acceptance criteria).
- **Open Questions:** none.

### FEAT-4000 — Effect Resolution (the Five D's)

- **Specified by:** [FS-105](../features/FS-105-effect-resolution.md) (2026-08-22)
- **Purpose:** Resolve an engagement into one of the Five D's, correctly, including cumulative
  Degrade and the mission-denial duration tracker.
- **Description:** Gate engagement on targeting-quality data; apply Deceive/Disrupt/Deny/
  Degrade/Destroy to the right place (belief-state for Deceive, asset removal for Destroy,
  stackable state for the middle three); track consecutive denial-turns per King.
- **Scope:** *Applying* an effect. Excludes *reading* whether an engagement is legal in the first
  place from belief-state (that's FEAT-2000's output, consumed here) and excludes the actual win
  check that consumes this Feature's denial tracker (that's FEAT-1000/FR-1405/1420).
- **Included Requirements:** FR-4100, FR-4200, FR-4300, FR-4400.
- **Excluded Requirements:** FR-1405/1420 (FEAT-1000, consumes this Feature's output).
- **Dependencies:** FEAT-2000 (targeting-quality precision gate), FEAT-3000 (effector templates).
- **Dependent Features:** FEAT-1000 (win-condition checks read this Feature's Destroy/denial
  outputs), FEAT-8000 (event log/board render resolved effects).
- **Affected Modules:** `EffectResolver`.
- **Related ADRs:** none.
- **User Value:** High — this is the "engage" half of find-fix-track-**target-engage**.
- **Technical Value:** High.
- **Complexity:** Medium — the Deceive/Destroy structural distinction (GDS-04/07) must be
  implemented correctly (two genuinely different code paths, not one generic "apply effect"
  function), which is a real but bounded complexity source.
- **Risk:** Medium — an effect misapplied to the wrong data shape (e.g., Deceive mutating true
  state instead of belief-state) would be a fog-of-war-adjacent correctness bug.
- **Suggested Verification Strategy:** Test.
- **Open Questions:** none (the qualitative Five D's model is fully specified; only per-effect
  numeric durations remain, and those are explicitly `06`'s job per the requirements baseline,
  already a stated non-gap).

### FEAT-5000 — Orbital Mechanics & the `Propagator` Boundary

- **Specified by:** [FS-104](../features/FS-104-orbital-mechanics-propagator.md) (2026-08-22)
- **Purpose:** Give every asset a real, physically-grounded position, presented to players as a
  discrete regime, isolated behind a swappable interface.
- **Description:** Two-body Keplerian propagation (v1 baseline per MSTR-001 C4 v0.3 — J2 deferred,
  see Open Questions); the 9-value regime taxonomy (R-203, amended); maneuver budget/cost;
  turn-scale maneuver completion counted in the mover's own turns; the `Propagator` interface
  itself, built as a genuine seam so J2/SGP4 can be added later without a rewrite.
- **Scope:** *Where things are and how they get there.* Excludes what a player does with that
  position once reached (tasking/engaging live in FEAT-2000/4000).
- **Included Requirements:** FR-5100, FR-5200, FR-5300, FR-5400, FR-5500, NFR-1200, NFR-5300.
- **Excluded Requirements:** none straddle out.
- **Dependencies:** FEAT-1000 (maneuver is an AP-spending action; completion is checked against
  `TurnManager`'s own-turn counting), FEAT-3000 (per-asset maneuver budget comes from template).
- **Dependent Features:** FEAT-2000 (belief-state regime readings come from `Propagator`),
  FEAT-8000 (board renders `Propagator`'s regime output).
- **Affected Modules:** `Propagator`.
- **Related ADRs:** ADR-0001.
- **User Value:** Medium-High — invisible when working correctly (players see labels, not math);
  the polar/sun-synchronous plane class's doctrinal grounding is a v1 label-only tradeoff pending
  OQ-14, not a promise this Feature currently keeps in full.
- **Technical Value:** High — still the module the vision/architecture called "the
  architecturally hardest part of this project" before this amendment, but the amendment
  specifically targets that risk.
- **Complexity:** Medium *(revised down from High, 2026-08-22)* — two-body motion is a canonical,
  well-documented algorithm with closed-form reference solutions; the from-scratch-implementation
  and single-sourced-formula risks that drove the original High rating (BL-0005) applied to the
  J2 term specifically, which is no longer part of the v1 baseline.
- **Risk:** Medium *(revised down from High, 2026-08-22, same reason as Complexity above)* — the
  remaining risk is OQ-14 (a design/gameplay-legibility question, not an implementation-
  correctness one) and the ordinary risk of any new module, not orbital-mechanics-specific risk.
- **Suggested Verification Strategy:** Test (deterministic given fixed elements) + Analysis
  (cross-check against a primary astrodynamics reference, e.g. Vallado — no longer gated on
  R-201/202 the way the J2 formula was).
- **Open Questions:** CR-03 (per-regime-pair fuel/transfer-time table) — owned by `02` then `06`.
  **OQ-14** (new, 2026-08-22) — whether the polar/sun-synchronous plane class ships label-only or
  gets J2 added before this Feature ships, decided after playtesting/implementation experience.

### FEAT-6000 — Fog-of-War Enforcement

- **Specified by:** [FS-106](../features/FS-106-fog-of-war-enforcement.md) (2026-08-22)
- **Purpose:** Guarantee, as a single centrally-tested boundary, that no client ever receives more
  opponent information than that player has earned.
- **Description:** Server-only ground truth (no client-side storage/inference of opponent state);
  every outbound opponent-facing message routed through `BeliefState.computeOpponentView`.
- **Scope:** The *enforcement boundary* only — not the mechanics that produce belief-state content
  (FEAT-2000) or render it (FEAT-8000). A deliberately thin, security-critical Feature, kept
  separate specifically so it has its own test surface (NFR-3100 already calls for this).
- **Included Requirements:** FR-6100, FR-6200, NFR-3100.
- **Excluded Requirements:** FR-2xxx (FEAT-2000 — belief-state *content*); FR-8200 (FEAT-8000 —
  belief-state *rendering*).
- **Dependencies:** FEAT-2000 (filters its output).
- **Dependent Features:** every Feature that produces client-bound state (FEAT-1000, 2000, 4000,
  5000 indirectly, via `GameEngine`'s single-construction-point discipline); FEAT-7000 (carries
  this Feature's filtered messages); FEAT-8000 (the client's only source of opponent data).
- **Affected Modules:** `BeliefState` (the enforcement half, distinct from FEAT-2000's content
  half), `GameEngine` (the single-construction-point discipline).
- **Related ADRs:** none.
- **User Value:** Indirect but foundational — a leak here breaks the entire hidden-information
  premise (G-2), even though players never "see" this Feature directly.
- **Technical Value:** Highest in the catalog — this is the project's single highest-priority test
  surface per NFR-3100/GDS-06.
- **Complexity:** Low-Medium — the *rule* is simple (route everything through one function); the
  discipline of never bypassing it across a growing codebase is the real, ongoing risk.
- **Risk:** High — not because it's hard to build once, but because every future Feature/package
  touching client-bound data is a chance to violate it; this is exactly why it's its own Feature
  with its own dedicated test surface rather than folded into FEAT-2000.
- **Suggested Verification Strategy:** Test — a centrally-run fog-of-war suite exercised against
  every other Feature's output, not re-verified ad hoc per feature (GDS-06's own instruction).
- **Open Questions:** none.

### FEAT-7000 — Server-Authoritative Transport

- **Specified by:** [FS-107](../features/FS-107-server-authoritative-transport.md) (2026-08-22)
- **Purpose:** Push turn-change and resolved-action state to both clients reliably, with the
  server always the final authority.
- **Description:** WebSocket push (no polling); server overrides any client-side optimistic
  prediction; disconnect/reconnect without state corruption.
- **Scope:** *Getting state from server to client and back*, reliably. Excludes what the state
  *contains* (every other Feature) — this is pure transport/session-continuity.
- **Included Requirements:** FR-7100, FR-7200, FR-7300, NFR-1100, NFR-7200.
- **Excluded Requirements:** none straddle out.
- **Dependencies:** FEAT-1000 (carries its turn/AP state), FEAT-6000 (carries only its
  already-filtered messages, never raw state).
- **Dependent Features:** FEAT-8000 (the client's only channel to the server).
- **Affected Modules:** WS transport layer.
- **Related ADRs:** ADR-0001.
- **User Value:** High — this is what makes the game feel responsive rather than "refresh to see
  if it's your turn."
- **Technical Value:** High.
- **Complexity:** Medium — WebSocket reconnection semantics are a known, bounded problem space,
  not a novel one.
- **Risk:** Low *(revised down from Medium, 2026-08-22)* — CR-02 resolved (FS-101 §W7): no grace
  period/timer logic to get wrong, only a notify-and-choose flow and a new WebSocket message
  shape for the disconnect notification (flagged in FS-101's Risks for this Feature's own FS to
  pick up).
- **Suggested Verification Strategy:** Test.
- **Open Questions:** none — CR-02 resolved, see FEAT-1000's note and FS-101 §W7.

### FEAT-8000 — Presentation / UI

- **Purpose:** Render every other Feature's state legibly, with no dead menu entries and no
  fog-of-war leakage in the render layer itself.
- **Description:** The six-panel layout (orbital board, action menu, asset tray, mission/King
  status, intel panel, event log); visual distinction of own/known/unknown contacts; pre-filtered
  legal-action menu (the GDS-08 BL-0004 resolution).
- **Scope:** *Rendering and input-submission* only — never computes game truth or belief-state
  itself (that would violate FEAT-6000).
- **Included Requirements:** FR-8100, FR-8200, FR-8300, FR-8400, FR-8500, NFR-4100, NFR-4200,
  NFR-7100.
- **Excluded Requirements:** none straddle out.
- **Dependencies:** every other Feature (this is the pure presentation layer over all of them):
  FEAT-1000, 2000, 3000, 4000, 5000, 6000, 7000.
- **Dependent Features:** none (nothing in v1 depends on the UI layer — it is a leaf in the
  dependency graph).
- **Affected Modules:** client UI.
- **Related ADRs:** ADR-0001.
- **User Value:** Highest visible surface — this is literally what a player experiences.
- **Technical Value:** Medium — mostly composition over the other Features' already-defined data
  shapes, per GDS-07/09's `OpponentView`/`StateDeltaMessage` types.
- **Complexity:** Medium — grounded in a real style reference (ZabOW), reducing genuine design
  risk, but still the largest single surface area in the v1 scope (six panels, many states).
- **Risk:** Low-Medium — mostly implementation volume, not open design uncertainty.
- **Suggested Verification Strategy:** Demonstration (primary, per the Requirements Review's own
  RF-04 finding) + Test where component-level testing is practical.
- **Open Questions:** none new (RF-04's verification-method question is tracked as BL-0008, not
  repeated here).
