# GDS-06 — Non-Functional Requirements (level)

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-07, GDS-09, `04-requirements-engineering`

The quality attributes the architecture must satisfy, grouped and traced, same discipline as
GDS-05: capability groups here, not final `NFR-####` numbering (that's `04`'s job).

## NFR groups

### Security — server authority is the load-bearing property

The single most important NFR in this project: **the server never sends a client data that
player's fog-of-war hasn't earned** (NFR-2001). This is not merely a design preference — a
client-side leak is trivially inspectable via browser devtools, so it is treated architecturally
as a security boundary, not a UI convention. Consequence for GDS-03's module design: `BeliefState`
is the **only** module permitted to decide what crosses the WebSocket state-delta channel toward a
given client; no other module (not `GameEngine`, not the transport layer) may construct or forward
a message containing opponent true state directly. This should become a concrete, centrally-tested
invariant at `09-package-verification` time, not something re-verified ad hoc per feature (SOR
Appendix B's own risk table already names this).

Session join links must be sufficiently unguessable (NFR-2002) — the only access control in v1,
since there are no accounts. This is a concrete requirement on whatever session-ID generation
mechanism `04`/`07` pick (cryptographically-random, adequate entropy) — not decided at this level
beyond naming the requirement.

### Performance / Latency

Turn-change and resolved-action notifications must reach both clients within a latency budget
"suitable for a turn-based game" (NFR-1001) — target a few seconds under normal broadband, exact
SLA TBD at `04`. This is explicitly **not** a twitch-game latency budget; the WebSocket-push
architecture (GDS-02) exists to avoid a *worse* failure mode (a stale "waiting for opponent" state
after the opponent has actually moved), not to hit frame-perfect timing.

The `Propagator`'s per-turn position updates must be efficient enough not to cause perceptible UI
stall (NFR-1002) — bounded by the fact that Kepler+J2-minimum propagation for a small v1 asset
count (SOR §7.5's six-type roster, a handful of instances per player) is computationally trivial
by any modern standard; this NFR exists to be checked, not because it's expected to bind.

### Reliability / Determinism

Given the same sequence of server-received actions, game-state resolution must be deterministic
(NFR-3001) — this is what makes the testability requirement in MSTR-001 §6/GDS-01 possible at all:
a test drives a fixed action sequence and asserts on the resulting state, exactly once, reliably.
A single session's crash must not affect other concurrent sessions (NFR-3002) — directly following
from GDS-02's "one process per session, but the server process itself is the availability
boundary" observation; process/session isolation is the mitigation for that boundary being real.

### Usability

A first-time player must be able to determine what's currently legal without external
documentation (NFR-4001) — the UI *is* the rules reference, per SOR §7.10/FR-1007's "no dead menu
entries" requirement. The UI must never present an action as available and then reject it after
submission under normal play (NFR-4002) — meaning legality must be computed client-visibly
*before* submission, not discovered by trying. This is a real design constraint on GDS-08
(Presentation Architecture): the client needs enough of the legality-computation logic (or a
server-provided "current legal actions" list) to pre-filter its own menu, not just attempt-and-
fail.

### Maintainability / Pipeline Compliance

New assets/mission sets/effectors must be addable via data-template changes only, no game-logic
code changes (NFR-5001) — already a GDS-03/04 design commitment (data-driven dispatch), restated
here as the NFR it satisfies. The codebase follows this project's own documentation-driven
pipeline for all non-trivial changes (NFR-5002). The `Propagator`-equivalent module stays isolated
behind its interface specifically to protect future fidelity upgrades from becoming a rewrite
(NFR-5003) — already GDS-03's design, restated as its NFR consequence.

### Compatibility

Current-stable Chrome/Firefox/Safari/Edge, no polyfills for unsupported-baseline features
(NFR-6001) — a constraint on GDS-08's implementation choices, not this level's to detail further.
Graceful degradation (clear error state, not silent failure) if WebSocket connectivity drops
mid-session (NFR-6002) — ties directly to FR-6003's disconnect/reconnect handling; the two should
be designed together at `04`/`06`, not independently.

## Test-coverage bar (carried down from MSTR-001 §6 / SOR §13)

Every shipped behavior must be expressible as an automated test against the deterministic core
(NFR-3001's precondition). Minimum required coverage, confirmed at this level as architecturally
necessary (not optional nice-to-have): legal-action enumeration (FR-1007), fog-of-war non-leakage
(NFR-2001 — the single highest-priority test surface in the project), the F2T2E gating chain
(FR-3003), and every win-condition path (§7.9). This is a direct input to G5's "full test suite
must pass" gate — these four surfaces are what that suite must actually cover, not merely "some
tests exist."

## Cross-checks performed this pass

No conflicts found between NFR groups and GDS-01–05's content. One tension worth naming
explicitly rather than silently resolving: **NFR-4002 (never reject after showing as available)
vs. GDS-02's server-authoritative-only design** — if the client only ever learns legality by
asking the server, satisfying NFR-4002 without added latency requires the client to hold enough
legality logic to pre-filter locally (a form of intentional, bounded duplication of the server's
legality rules, kept in sync via the same shared-types mechanism ADR-0001 establishes) rather than
a bare "ask the server, then render." This is not a contradiction, but it is a real GDS-08/09
design constraint worth flagging now rather than discovering at feature-spec time — recorded here
so `03`'s own future GDS-08/09 passes address it explicitly.

## Merge gate

- [x] Every NFR group traces to a cited SOR/MSTR-001 source.
- [x] The security NFR's module-design consequence (only `BeliefState` constructs outbound
      belief-filtered messages) stated concretely, not left as a restated goal.
- [x] The test-coverage bar names the four concrete surfaces G5 must actually verify.
- [x] The NFR-4002/server-authority tension named explicitly rather than silently resolved.
- [x] No numeric SLA value invented — "a few seconds," exact figure TBD at `04`, stated as such.

**Merge decision:** this document is authoritative for NFR grouping and the module-design
consequences it implies; `04-requirements-engineering` assigns final `NFR-####` IDs and exact
numeric SLAs.

**Gate:** closed 2026-08-21. No new Open Questions; one design tension flagged (NFR-4002 vs.
server authority) for GDS-08/09 to address concretely, not blocking this gate. Next: GDS-07 (Data
Model).
