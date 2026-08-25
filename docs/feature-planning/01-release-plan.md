# Release Plan — v1

- **Owned by:** `05-feature-decomposition` · **Status:** ✅ Authored, 2026-08-22
- **Source:** `02-epic-catalog.md`, `03-feature-catalog.md`, `04-feature-dependency-graph.md`

## Bucket assignment

| Feature | Bucket | Why |
|---|---|---|
| FEAT-1000 — Session & Turn Lifecycle | **MVP** | Foundational — every other Feature depends on it; without it there is no game. |
| FEAT-2000 — Sensing & F2T2E Chain | **MVP** | The core strategic loop the entire pitch rests on (G-2/G-3) — not optional at any scope. |
| FEAT-3000 — Asset Roster & Mission Sets | **MVP** | Foundational content; FEAT-2000/4000/5000 have nothing to operate on without it. |
| FEAT-4000 — Effect Resolution (Five D's) | **MVP** | Without it, "engage" (the E in F2T2E) doesn't exist — the loop is incomplete without it. |
| FEAT-5000 — Orbital Mechanics / `Propagator` | **MVP** | The hybrid-fidelity requirement (MSTR-001 C4, amended v0.3 to a two-body-only v1 baseline) is a scope commitment, not a nice-to-have. No longer the catalog's Highest Risk (see below) — the amendment specifically retired that. |
| FEAT-6000 — Fog-of-War Enforcement | **MVP** | Non-negotiable per MSTR-001 C3/NFR-2001 — a security requirement, not a design preference. |
| FEAT-7000 — Server-Authoritative Transport | **MVP** | Required for the two-player, no-polling experience G-6/SOR §8.1 commit to. |
| FEAT-8000 — Presentation / UI | **MVP** | Without it, nothing above is playable by an actual human. |

**All eight Features are MVP.** This is not a failure to prioritize — it's the honest consequence
of two facts already settled upstream: (1) the seed SOR's own §5.1 already scoped "v1" as the
minimal complete game (SOR §5.3's R1–R7 roadmap already carries everything genuinely deferrable,
and none of it was decomposed into a Feature here — it stays unauthorized future scope, not a
Feature-Catalog row); (2) the dependency graph is a single connected DAG with FEAT-8000 as its
only sink — there is no subset of these eight that forms a playable, demonstrable game on its own
(cutting any one leaves either no game state, no strategic loop, no content, no win path, no
security boundary, no delivery mechanism, or no way to see any of it). Release 1/Release 2 buckets
are therefore empty for this increment — reserved structurally for whenever a genuinely
independent slice of scope exists (most likely SOR §5.3's R1, expanded roster, if/when
authorized).

| Bucket | Features |
|---|---|
| **MVP** | FEAT-1000, FEAT-2000, FEAT-3000, FEAT-4000, FEAT-5000, FEAT-6000, FEAT-7000, FEAT-8000 (all 8) |
| **Release 1** | *(none — reserved)* |
| **Release 2** | *(none — reserved)* |
| **Future** | *(no Feature-Catalog rows — SOR §5.3's R1–R7 remain unauthorized roadmap items, not decomposed)* |

## Highest Value

**FEAT-2000 (Sensing & F2T2E Chain)** and **FEAT-4000 (Effect Resolution)** jointly — together
they *are* the find-fix-track-target-engage loop the whole game is built to express (G-2, G-3).
Every other Feature exists to support, secure, or render this pair.

## Highest Risk

**FEAT-6000 (Fog-of-War Enforcement)** is now the catalog's Highest Risk — *(revised 2026-08-22;
previously FEAT-5000)*. It was never hard to build once; it carries an ongoing **structural**
risk instead (every future change to FEAT-1000–5000 is a chance to violate it) that persists for
the life of the project, not just its first build — the reason it was already a close second.
**FEAT-5000 (Orbital Mechanics / `Propagator`)** dropped out of this bucket the same day: MSTR-001
C4 was amended (v0.3) to a two-body-only v1 baseline specifically to retire its implementation
risk (see `03-feature-catalog.md`'s own updated Risk field) — it remains worth watching for OQ-14
(a design question, not a correctness one), just no longer the catalog's riskiest Feature.

## Foundational

**FEAT-1000 (Session & Turn Lifecycle)** and **FEAT-3000 (Asset Roster & Mission Sets)** — the
graph's two highest-fan-out nodes (`04-feature-dependency-graph.md`); both block three or more
other Features and should be built first, in that order (FEAT-1000 before FEAT-3000, since
FEAT-3000's deploy action is itself an AP-spending action FEAT-1000 must already support).

## Optional

None in this bucket. Every Feature in the catalog is Must-priority per its constituent
requirements' own Priority field (`04`'s baseline) — there is no Should/Could-priority Feature to
flag as genuinely optional within v1's own scope.

## Deferred

**CR-01 and CR-03** (of the three Candidate Requirements `04` left open) remain deferred, riding
along with FEAT-2000 and FEAT-5000 respectively as Open Questions for `06-feature-specification`.
**CR-02 was resolved 2026-08-22** (owner decision, specified in FS-101 §W7 — no grace period;
notify-and-choose wait/cancel) and is no longer deferred.

## Recommended build sequence

Following the dependency graph's critical path and parallel-opportunity analysis
(`04-feature-dependency-graph.md`):

1. **FEAT-1000** (Session & Turn Lifecycle) — must be first, nothing else can start meaningfully
   before it.
2. **FEAT-3000** (Asset Roster & Mission Sets) — second; unblocks three downstream Features at
   once.
3. **FEAT-2000** (Sensing & F2T2E) and **FEAT-5000** (Orbital Mechanics) **in parallel** — neither
   depends on the other, both depend only on 1000/3000.
4. **FEAT-4000** (Effect Resolution) and **FEAT-6000** (Fog-of-War Enforcement) **in parallel** —
   both depend only on FEAT-2000/3000, not on each other.
5. **FEAT-7000** (Transport) — depends on FEAT-6000 (carries only already-filtered messages).
6. **FEAT-8000** (Presentation/UI) — last; the pure sink, depends on everything above.

This sequencing is a recommendation for `07-implementation-planning`'s actual package ordering,
not itself a package plan — packages, estimates, and task breakdown are that stage's job.
