# Non-Functional Requirements — v1 Baseline

- **Owned by:** `04-requirements-engineering` · **Status:** ✅ Authored, 2026-08-21
- **Sources:** GDS-06 (`docs/architecture/06-non-functional-requirements.md`), ADR-0001, SOR §11
- **Priority scale:** same as FR baseline (Must/Should/Could)

## Performance

- **NFR-1100** — **Turn-notification latency budget.** The system shall deliver a `StateDeltaMessage` to both clients within **3 seconds** under normal broadband conditions (this pass's numeric decision — GDS-06 named "a few seconds," not decided; 3s is chosen as a concrete, testable value comfortably inside "a few" while being strict enough to catch a real regression).
  - *Priority:* Must. *Acceptance Criteria:* Given a resolved action under simulated normal-broadband latency, when measured from server-side resolution to client receipt, then the interval is ≤3s in ≥95% of trials. *Verification:* Test (automated latency harness once `07`/`08` exist). *Source:* GDS-06 §Performance/Latency; SOR NFR-1001.
- **NFR-1200** — **Propagation efficiency.** The system shall update all in-play assets' `Propagator` state within one turn-advance without perceptible UI stall (target: <100ms server-side compute for a full turn-advance across all assets in a 2-player session — this pass's decision, chosen as comfortably sub-perceptible per standard UI-responsiveness thresholds).
  - *Priority:* Should. *Acceptance Criteria:* Given a turn-advance with the full v1 roster deployed by both players, when `Propagator.advance` runs, then server-side compute completes in <100ms. *Verification:* Test. *Source:* SOR NFR-1002; GDS-06.

## Reliability / Determinism

- **NFR-2100** — **Deterministic resolution.** Given an identical sequence of server-received actions, the system shall produce identical resulting game state.
  - *Priority:* Must. *Acceptance Criteria:* Given a fixed action sequence replayed twice against a fresh session, when the resulting `SessionState` is compared, then it is byte-identical both times. *Verification:* Test. *Source:* SOR NFR-3001; GDS-06 §Reliability.
- **NFR-2200** — **Session isolation.** A single session's crash shall not affect any other concurrent session.
  - *Priority:* Must. *Acceptance Criteria:* Given two concurrent sessions, when one process/session instance is forcibly terminated, then the other session's state and connectivity are unaffected. *Verification:* Test. *Source:* SOR NFR-3002; GDS-02 §Session lifecycle (the process-as-availability-boundary observation).

## Security

- **NFR-3100** — **Fog-of-war non-leakage (the project's highest-priority test surface).** The server shall never transmit to a client any data that player's belief-state has not earned.
  - *Priority:* Must. *Acceptance Criteria:* Given any outbound `StateDeltaMessage`, when its full contents are inspected against the recipient's current `BeliefStateEntry` set, then no field reveals opponent ground truth beyond what the belief-state contains. *Verification:* Test (a centrally-run fog-of-war test suite, per GDS-06's "single, centrally-tested boundary" note — not re-verified ad hoc per feature). *Source:* SOR NFR-2001; GDS-06; FR-6100/6200.
- **NFR-3200** — **Unguessable session identifiers.** Session join links shall use a sufficiently random identifier that guessing a live session ID is computationally infeasible.
  - *Priority:* Must. *Acceptance Criteria:* Given the session-ID generation function, when its entropy is measured, then it provides at least 122 bits of randomness (this pass's decision — matching a standard UUIDv4's entropy, a widely-used sufficiently-unguessable baseline for this class of problem). *Verification:* Inspection + Analysis. *Source:* SOR NFR-2002; GDS-02 §External constraints.

## Usability

- **NFR-4100** — **UI as rules reference.** A first-time player shall be able to determine, without external documentation, what actions are currently available to them.
  - *Priority:* Must. *Acceptance Criteria:* Given a first-time player with no external rules document, when they attempt to identify legal actions, then the action menu alone (FR-1320) is sufficient. *Verification:* Demonstration (usability walkthrough). *Source:* SOR NFR-4001; FR-1320.
- **NFR-4200** — **No post-hoc rejection under normal play.** The UI shall never present an action as available and then reject it as illegal after submission, under normal play.
  - *Priority:* Must. *Acceptance Criteria:* Given the client's pre-filtered action menu (GDS-08's BL-0004 resolution), when any enabled action is submitted, then the server accepts it, except in the rare race condition GDS-08 already names (opponent action changed legality between the client's last state-delta and the player's click) — that path is the sole permitted exception and must itself degrade gracefully (a clear rejection message, not a silent failure). *Verification:* Test. *Source:* SOR NFR-4002; FR-1320; GDS-08.

## Maintainability / Pipeline Compliance

- **NFR-5100** — **Data-driven content, no code changes.** New assets, mission sets, and effectors shall be addable via template changes only.
  - *Priority:* Must. *Acceptance Criteria:* per FR-3100 (same acceptance criteria — this NFR is FR-3100's quality-attribute restatement). *Verification:* Inspection. *Source:* SOR NFR-5001; FR-2001.
- **NFR-5200** — **Pipeline compliance.** The codebase shall follow this project's documentation-driven pipeline (G1–G5) for all non-trivial changes.
  - *Priority:* Must. *Acceptance Criteria:* Given any implementation package, when reviewed, then it traces to an approved FS-###/IP-#### and updates the traceability the package names. *Verification:* Inspection (pipeline audit at `09`/`10`). *Source:* SOR NFR-5002.
- **NFR-5300** — **`Propagator` isolation protects fidelity upgrades.** The `Propagator`-equivalent module shall remain isolated behind its interface specifically so a future higher-fidelity implementation is a swap, not a rewrite.
  - *Priority:* Must. *Acceptance Criteria:* per FR-5500 (same acceptance criteria). *Verification:* Inspection. *Source:* SOR NFR-5003; FR-5500.

## State Integrity

- **NFR-6100** — **Server-authoritative state.** All game-state mutation shall originate server-side; a client action is a *request*, never a direct state write.
  - *Priority:* Must. *Acceptance Criteria:* Given any client-submitted action, when it is processed, then it passes through `GameEngine.handleAction`'s validation before any state mutation occurs — no code path mutates `SessionState` directly from a client message. *Verification:* Inspection. *Source:* GDS-02; GDS-09; NFR-2001 (server-authority half).

## Portability

- **NFR-7100** — **Browser targets.** The client shall run in current-stable Chrome, Firefox, Safari, and Edge without polyfills for unsupported-baseline features.
  - *Priority:* Must. *Acceptance Criteria:* Given the four named browsers at current-stable versions, when the client is loaded, then it functions without a polyfill dependency for any feature outside each browser's declared baseline support. *Verification:* Test (cross-browser smoke test). *Source:* SOR NFR-6001.
- **NFR-7200** — **Graceful WebSocket degradation.** The client shall degrade gracefully (a clear error state) if WebSocket connectivity is lost mid-session, never failing silently.
  - *Priority:* Must. *Acceptance Criteria:* Given an active session, when the WebSocket connection drops, then the client displays a clear, visible connectivity-lost state rather than appearing frozen or silently stale. *Verification:* Test. *Source:* SOR NFR-6002; FR-7300.

## Testability

- **NFR-8100** — **Deterministic-core test coverage.** The deterministic game-state-resolution core shall have automated test coverage for: legal-action enumeration, fog-of-war non-leakage, the F2T2E gating chain, and every win-condition path.
  - *Priority:* Must. *Acceptance Criteria:* Given the automated test suite, when run, then at least one test exists exercising each of the four named surfaces, and the suite passes (G5). *Verification:* Inspection (test-suite coverage audit) + Test (the suite itself). *Source:* SOR §13; GDS-06 §Test-coverage bar.

## Build Reproducibility

- **NFR-9100** — **Reproducible build.** The application shall build/start cleanly from source with a documented, single command sequence once `07-implementation-planning` records it.
  - *Priority:* Must. *Acceptance Criteria:* Given a clean checkout, when the documented build/start commands are run, then the application starts without manual intervention. *Verification:* Test. *Source:* G5; ADR-0001 (stack confirmation, commands TBD at `07`).

## Extensibility

- **NFR-9200** — **Roster expansion readiness.** Adding a new mission set, asset type, or effector (candidate later-phase content per SOR §5.3/R1) shall require only a new template file plus registration, no engine-module change.
  - *Priority:* Should. *Acceptance Criteria:* per FR-3100 (same mechanism; this NFR names the forward-looking quality attribute FR-3100's mechanism exists to satisfy). *Verification:* Inspection. *Source:* SOR §5.3, G-4; GDS-04.

## Training Corpus Usability *(new 2026-08-23, MSTR-001 C10 / v0.4)*

- **NFR-10100** — **Module size and audience fit.** Each training-corpus module shall be
  single-topic and sized for a non-technical player audience (no more than ~300 lines before it
  must be split), written in plain language with no unexplained jargon — any doctrinal/technical
  term used (F2T2E, AP, regime, belief-state) shall be defined on first use or linked to a
  glossary entry.
  - *Priority:* Must. *Acceptance Criteria:* Given any training-corpus module, when its length and
    first use of each domain term are checked, then it is ≤300 lines (or split) and every term is
    defined/linked at first use. *Verification:* Inspection. *Source:* MSTR-001 C10; mirrors
    `ZabSpaceExercise`'s own NFR §16 module-size/audience convention, scoped down for a
    single-audience (not multi-role) corpus.
- **NFR-10200** — **Screenshot fidelity.** Every screenshot embedded in the training corpus shall
  be a genuine capture of the actual running application at the documented step, never a mockup,
  wireframe, or hand-edited image.
  - *Priority:* Must. *Acceptance Criteria:* Given any screenshot under `docs/manual/`, when its
    provenance is checked, then it was captured from a real running instance of the application
    (e.g. via Playwright) at the exact step its caption names. *Verification:* Inspection.
    *Source:* MSTR-001 C10; FR-9420.

## Candidate Requirements (NOT baselined)

None — every SOR §11 NFR category (Performance, Security, Reliability, Usability, Maintainability,
Compatibility) traced to a baselined NFR above; no gap found requiring a Candidate entry at the
NFR tier. The new Training Corpus Usability category (NFR-10100/10200) is fully traced to
MSTR-001 C10, not a gap either.
