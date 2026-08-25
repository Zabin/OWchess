# Epic Catalog — v1

- **Owned by:** `05-feature-decomposition` · **Status:** ✅ Authored, 2026-08-22

Three Epics. Deliberately few — the v1 scope is small enough that finer epic slicing would add
bookkeeping without clarifying anything; each Feature belongs to exactly one Epic.

### EP-1000 — Core Game Engine

- **Purpose:** Everything that makes OW Chess a correctly-functioning turn-based game engine,
  independent of how it's rendered — the server-side truth of the game.
- **Features Included:** FEAT-1000 (Session & Turn Lifecycle), FEAT-2000 (Sensing & F2T2E),
  FEAT-3000 (Asset Roster & Mission Sets), FEAT-4000 (Effect Resolution), FEAT-5000 (Orbital
  Mechanics & `Propagator`).
- **Modules:** `GameEngine`, `TurnManager`, `BeliefState` (content half), `EffectResolver`,
  `Propagator`, content templates.
- **Estimated Scope:** Large — five Features, the bulk of the game's actual rules.
- **Risks:** FEAT-5000's orbital-mechanics complexity (High risk) dominates this Epic's overall
  risk profile; FEAT-2000's open decay-rate question (CR-01) is a smaller, contained risk.
- **Dependencies:** none (this Epic is the foundation the other two build on).

### EP-2000 — Trust Boundary & Transport

- **Purpose:** Everything that makes this a *safe, responsive multiplayer* game rather than a
  single-process simulation — the security and delivery guarantees around EP-1000's truth.
- **Features Included:** FEAT-6000 (Fog-of-War Enforcement), FEAT-7000 (Server-Authoritative
  Transport).
- **Modules:** `BeliefState` (enforcement half), `GameEngine` (single-construction-point
  discipline), WS transport layer.
- **Estimated Scope:** Small-Medium — two tightly-scoped Features, but both carry outsized
  correctness stakes (a leak or an authority violation is a security-class defect, not a cosmetic
  one).
- **Risks:** FEAT-6000's ongoing-discipline risk (every future EP-1000 change is a chance to
  violate the boundary) is this Epic's central, structural risk — mitigated by keeping it a
  centrally-tested surface (NFR-3100) rather than a per-feature convention.
- **Dependencies:** EP-1000 (has nothing to enforce/transport without it).

### EP-3000 — Player Experience

- **Purpose:** Everything the player actually sees and interacts with.
- **Features Included:** FEAT-8000 (Presentation / UI).
- **Modules:** client UI.
- **Estimated Scope:** Medium — one Feature, but the largest single surface area (six panels).
- **Risks:** Low-Medium, mostly implementation volume; substantially de-risked by the confirmed
  ZabOW visual/layout reference (MSTR-001 §4).
- **Dependencies:** EP-1000 (renders its state) and EP-2000 (its only channel to that state is
  the fog-of-war-filtered, transport-carried view EP-2000 produces).

## Epic dependency summary

```
EP-1000 (Core Game Engine)
    │
    ▼
EP-2000 (Trust Boundary & Transport)
    │
    ▼
EP-3000 (Player Experience)
```

A strict linear chain at the Epic grain — the real parallelism opportunities live *within*
EP-1000, at the Feature level (see `04-feature-dependency-graph.md`).
