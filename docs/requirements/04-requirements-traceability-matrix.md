# Requirements Traceability Matrix — v1 Baseline

- **Owned by:** `04-requirements-engineering` · **Status:** ✅ Authored, 2026-08-21

Forward columns (Module/Feature Spec/Implementation Package/Test) are honestly `UNASSIGNED` —
nothing downstream exists yet. Architecture Section cites the GDS level; Module names the GDS-03
candidate module the requirement will land in once `05`/`06`/`07` assign real work to it.

| Req ID | Title | Research Source | Architecture Section | ADR | Module | Feature Spec | Implementation Package | Test |
|---|---|---|---|---|---|---|---|---|
| FR-1110 | Create session | — | GDS-01, GDS-02 | ADR-0001 | GameEngine | FS-101 | IP-1010 | TurnManager.test.ts (via SessionStore fixture setup) |
| FR-1120 | Join session | — | GDS-01, GDS-02 | ADR-0001 | GameEngine | FS-101 | IP-1010 | TurnManager.test.ts (via SessionStore fixture setup) |
| FR-1121 | Reject over-capacity join | — | GDS-01 | — | GameEngine | FS-101 | IP-1010 | SessionStore.test.ts |
| FR-1130 | Withhold start until both joined | — | GDS-01 | — | GameEngine | FS-101 | IP-1010 | SessionStore.test.ts |
| FR-1210 | Secret King selection | — | GDS-01, GDS-04 | — | GameEngine, BeliefState | FS-101 | IP-1010 | TurnManager.test.ts (via SessionStore fixture setup) |
| FR-1220 | Simultaneous resolution | — | GDS-01 | — | GameEngine, TurnManager | FS-101 | IP-1010 | TurnManager.test.ts (via SessionStore fixture setup) |
| FR-1230 | King immutability | — | GDS-04 | — | GameEngine | FS-101 | IP-1010 | SessionStore.test.ts |
| FR-1310 | Grant AP allotment | — | GDS-01, GDS-07 | — | TurnManager | FS-101 | IP-1010 | TurnManager.test.ts |
| FR-1320 | Enumerate legal actions | — | GDS-06, GDS-08 | — | TurnManager, client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-1330 | Reject out-of-turn actions | — | GDS-03, GDS-09 | — | TurnManager | FS-101 | IP-1010 | TurnManager.test.ts |
| FR-1340 | Pass ends turn | — | GDS-01 | — | TurnManager | FS-101 | IP-1010 | TurnManager.test.ts |
| FR-1350 | AP-exhaustion ends turn | — | GDS-01 | — | TurnManager | FS-101 | IP-1010 | TurnManager.test.ts |
| FR-1405 | Destruction win | — | GDS-01, GDS-04 | — | GameEngine, EffectResolver | FS-101 | IP-1010 | GameEngine.winConditions.test.ts |
| FR-1410 | Resignation | — | GDS-01 | — | GameEngine | FS-101 | IP-1010 | GameEngine.winConditions.test.ts |
| FR-1420 | Timeout/tiebreak | — | GDS-01 | — | GameEngine | FS-101 | IP-1010 | GameEngine.winConditions.test.ts |
| FR-2100 | Task a sensor | — | GDS-09 | — | BeliefState | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-2200 | Precision gated by asset capability | — | GDS-04, GDS-09 | — | BeliefState | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-2300 | Belief-state staleness/decay | — | GDS-07, FS-103 §W3 | — | BeliefState | FS-103 | UNASSIGNED | UNASSIGNED |
| FR-2400 | Reflect precision/staleness to UI | — | GDS-08 | — | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-3100 | Data-driven asset templates | — | GDS-04 | — | content templates | FS-102 | IP-3010 (schema)/IP-3011 (content) | contentTemplates.test.ts |
| FR-3200 | v1 roster support | R-203 | GDS-04 | — | content templates | FS-102 | IP-3011 | contentTemplates.test.ts |
| FR-3300 | Ground/space cost-time asymmetry | — | GDS-04 (this doc's tuning table) | — | content templates | FS-102 | IP-3010 (mechanism) | deployAction.test.ts (ground-vs-space onlineAt case) |
| FR-3400 | Deploy with cost deduction | — | GDS-07 | — | GameEngine | FS-102 | IP-3010 | deployAction.test.ts |
| FR-3500 | Block pre-online use | — | GDS-07 | — | GameEngine | FS-102 | IP-3010 | deployAction.test.ts (assertOnline case) |
| FR-4100 | Require targeting-quality data | — | GDS-09 | — | EffectResolver | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-4200 | Apply the correct effect | — | GDS-04, GDS-07, GDS-09 | — | EffectResolver | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-4300 | Cumulative Degrade | — | GDS-07 | — | EffectResolver | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-4400 | Consecutive denial-turn tracking | — | GDS-01 (this doc's tuning table) | — | EffectResolver | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-5100 | Real propagation | R-203 (R-201/202 pending) | GDS-03 | — | Propagator | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-5200 | Discrete regime presentation | R-203 | GDS-07, GDS-09 | — | Propagator | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-5300 | Maneuver within budget | — | GDS-09 (this doc's tuning table) | — | Propagator | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-5400 | Turn-scale maneuver completion (mover's-own-turns) | — | GDS-03 (OQ-11 resolution) | — | Propagator | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-5500 | `Propagator` interface isolation | — | GDS-03, GDS-09 | — | Propagator | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-6100 | Server-only ground truth | — | GDS-02, GDS-08 | — | client UI (negative req.) | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-6200 | Belief-filtered outbound messages only | — | GDS-06, GDS-09 | — | BeliefState, GameEngine | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-7100 | WebSocket push notifications | — | GDS-02 | ADR-0001 | WS transport | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-7200 | Server sole authority | — | GDS-02, GDS-08 | — | GameEngine | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-7300 | Disconnect/reconnect handling | — | GDS-01, FS-101 §W7 | — | GameEngine, WS transport | FS-101 | UNASSIGNED | UNASSIGNED |
| FR-8100 | Render the panel set | — | GDS-08 | — | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-8200 | Visual distinction of contact types | — | GDS-08 | — | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-8300 | Cost/time-to-online shown before commit | — | GDS-08 | — | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-8400 | Current AP always visible | — | GDS-08 | — | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| FR-8500 | Visible event log | — | GDS-07, GDS-08 | — | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| ~~CR-01~~ | ~~Belief-state decay rate~~ | — | — | — | — | **Resolved into FR-2300, 2026-08-22 — no longer a candidate.** | — | — |
| ~~CR-02~~ | ~~Disconnect/reconnect grace period~~ | — | — | — | — | **Resolved into FR-7300, 2026-08-22 — no longer a candidate.** | — | — |
| ~~CR-03~~ | Maneuver fuel-budget/transfer-time table | FR-5300/5400 | GDS-03/09 | R-201 | FS-104 | **RESOLVED 2026-08-22** — R-201 grounded the Δv/time shape; FS-104's Maneuver Cost Table adopted it. | — | — |
| NFR-1100 | Turn-notification latency budget | — | GDS-06 | ADR-0001 | WS transport | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-1200 | Propagation efficiency | — | GDS-06 | — | Propagator | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-2100 | Deterministic resolution | — | GDS-06 | — | GameEngine | FS-101 | IP-1010 | (structural — pure functions of stored state, no randomness/wall-clock; no dedicated test, per VR-1010 F2) |
| NFR-2200 | Session isolation | — | GDS-02, GDS-06 | — | GameEngine | FS-101 | IP-1010 | (structural — `SessionStore` keyed by `SessionId` in a `Map`, each `SessionRecord` independent; no dedicated test, per VR-1010 F2) |
| NFR-3100 | Fog-of-war non-leakage | — | GDS-06 | — | BeliefState | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-3200 | Unguessable session identifiers | — | GDS-02, GDS-06 | — | GameEngine | FS-101 | IP-1010 | SessionStore.test.ts (entropy/non-sequential test, fixed post-VR-1010 F1) |
| NFR-4100 | UI as rules reference | — | GDS-06 | — | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-4200 | No post-hoc rejection under normal play | — | GDS-06, GDS-08 | — | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-5100 | Data-driven content, no code changes | — | GDS-04 | — | content templates | FS-102 | IP-3010 (schema)/IP-3011 (content) | contentTemplates.test.ts |
| NFR-5200 | Pipeline compliance | — | — | — | — | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-5300 | `Propagator` isolation protects fidelity upgrades | — | GDS-03 | — | Propagator | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-6100 | Server-authoritative state | — | GDS-02, GDS-09 | — | GameEngine | FS-101 | IP-1010 | (structural — all mutation originates in `GameEngine`/`TurnManager`/`SessionStore`, no client-writable path; no dedicated test, per VR-1010 F2) |
| NFR-7100 | Browser targets | — | GDS-08 | ADR-0001 | client UI | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-7200 | Graceful WebSocket degradation | — | GDS-02 | — | client UI, WS transport | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-8100 | Deterministic-core test coverage | — | GDS-06 | — | — | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-9100 | Reproducible build | — | — | ADR-0001 | — | UNASSIGNED | UNASSIGNED | UNASSIGNED |
| NFR-9200 | Roster expansion readiness | — | GDS-04 | — | content templates | FS-102 | IP-3010 (schema) | TemplateRegistry.test.ts |

## Coverage confirmation

Every row above traces back to at least one GDS level and, where applicable, the seed SOR (via
each requirement's own Source Documents field in `01`/`02`) — matching GDS-10's own spot-check.
No row was backfilled with a guessed forward reference; every UNASSIGNED cell is honestly empty
because `05-feature-decomposition` onward have not yet run.
