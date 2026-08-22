# GDS-05 — Functional Requirements (level)

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-06, GDS-07, `04-requirements-engineering`

This level states the **capability groups** the requirements baseline must elaborate — confirming
each traces to a concept GDS-01/04 already established — without assigning final `FR-####` IDs or
inventing new capability beyond what GDS-01–04 support. Formal numbering, exact acceptance
criteria, and the traceability matrix are `04-requirements-engineering`'s job.

## Capability groups

| Group | Capability | Traces to |
|---|---|---|
| **Session & Game Flow** | Create/join a session via shareable link; require both players before starting; secret simultaneous King deployment; grant AP per turn; enumerate legal actions; enforce strict turn order; resignation; timeout/tiebreak. | GDS-01 (session lifecycle, turn loop), GDS-02 (join-link access control) |
| **Assets & Mission Sets** | Data-driven asset-template schema; support the v1 mission-set and asset roster, each tagged basing/chain-role/cost/time-to-online; enforce the ground/space cost-time asymmetry; deploy-with-cost-deduction; block use before time-to-online elapses. | GDS-04 (Asset, MissionSet, roster entities) |
| **Sensing, Fog-of-War & Tracking** | Maintain per-player derived belief-state; never transmit ground truth beyond earned belief-state; model the F2T2E precision-gating chain; degrade stale belief-state over turns; allow sensor tasking; reflect precision/staleness to the UI. | GDS-03 (`BeliefState` module), GDS-04 (`BeliefStateEntry`) |
| **Effectors & Engagement** | Support the roster's effectors and the Five D's; require targeting-quality data before engagement is legal; apply the correct effect on success; support cumulative Degrade; track consecutive denial-state turns for the mission-denial win path. | GDS-03 (`EffectResolver`), GDS-04 (effect state) |
| **Orbital Mechanics & Maneuver** | Propagate true position with real Kepler+J2-minimum math regardless of what's exposed to players; present state as discrete regimes; allow maneuver within a fuel/maneuver budget; model maneuver as budget-consuming and turn-scale-time-consuming; isolate propagation behind the `Propagator` interface. | GDS-03 (`Propagator`), GDS-04 (`OrbitalRegime`), resolved OQ-11 (transfer-time counting) |
| **Multiplayer & Networking** | Push turn-change/resolved-action notifications over WebSocket; treat the server as sole authority (client prediction never authoritative); handle disconnect/reconnect within a session without corrupting state. | GDS-02 (the two crossing channels), GDS-03 (WS transport layer, `TurnManager`) |
| **UI/Presentation** | Render the panel set (GDS-08's job to detail); visually distinguish own/known-opponent/unknown contacts; show cost/time-to-online before commit; show current AP; log resolved actions/effects visibly. | GDS-01 (§7.10 legibility requirement), GDS-04 (entity visibility rules) |
| **Persistence & Logging** | Maintain an immutable per-session event log; no persistence beyond session life. | GDS-02 (session-process-as-availability-boundary) |

## Cross-checks performed this pass

- Every capability group above traces to a named GDS-01–04 concept — none introduces new scope
  the vision/architecture tiers haven't already established (a check against G1's write-scope
  rule: this level elaborates, it does not originate).
- The seed SOR's own `FR-1xxx`–`FR-8xxx` numbered list (§10) maps cleanly onto these eight groups
  with no orphaned SOR requirement and no group invented that the SOR doesn't already imply —
  `04-requirements-engineering` can use this mapping directly rather than re-deriving grouping
  from scratch.
- No conflicting candidate requirements were found between groups at this pass (e.g. no tension
  between "server never transmits beyond earned belief-state" and "client shows cost/time-to-
  online before commit," since deployable-asset cost/time-to-online is public information about
  the roster, not hidden opponent state).

## What this level deliberately does not fix

Exact FR-#### numbering and acceptance criteria (04's job); the numeric tuning values every group
above still needs (OQ-05/06/07/10, unchanged); the orbital-regime taxonomy detail OQ-13 still
owes.

## Merge gate

- [x] Every capability group traces to a cited GDS-01–04 source.
- [x] No new capability invented beyond what GDS-01–04 already establish.
- [x] Cross-check for inter-group conflicts performed; none found.
- [x] No numeric tuning value invented.

**Merge decision:** GDS-01–04 remain authoritative for concept/entity/module detail; this document
is authoritative for capability-grouping only, feeding `04-requirements-engineering` directly.

**Gate:** closed 2026-08-21. No new Open Questions. Next: GDS-06 (Non-functional Requirements
level).
