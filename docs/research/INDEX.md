# Research Encyclopedia — Index

Two tiers, owned by peer skills: **R-1xx** (SDA/counterspace doctrine vocabulary — `02-research-
domain`) and **R-2xx** (orbital mechanics & systems tooling — `02-research-orbital-and-tooling`).
Every entry cites real sources; nothing is invented from memory. Cite, don't duplicate, the
sibling `ZabSpaceExercise` project's own `docs/research/` corpus where it already covers the same
ground (SOR §3.3, §12).

## R-1xx — SDA / counterspace doctrine

| ID | Title | Status |
|---|---|---|
| *(none authored yet)* | | |

## R-2xx — Orbital mechanics & tooling

| ID | Title | Status |
| R-201 | Keplerian orbital elements & basic two-body propagation (v1 maneuver Δv/time figures) | ✅ DONE |
| R-202 | J2 perturbation and its relevance to a LEO/MEO/GEO-analog discrete-band presentation | ⛔ PLANNED (deferred — moot for v1's two-body baseline; revisit if OQ-14 resolves toward adding J2) |
| R-203 | Mapping continuous orbital state to OW Chess's discrete regime/plane-class taxonomy | ✅ DONE |
| R-204 | The `Propagator` interface boundary — what it must/must not expose | ⛔ PLANNED |
| R-205 | Server-authoritative architecture & fog-of-war/belief-state patterns for turn-based multiplayer | ⛔ PLANNED |
| R-206 | WebSocket transport for turn-change push notification | ⛔ PLANNED |
| R-207 | Testing/verification tooling for a Node.js+TypeScript / React+TypeScript stack | ⛔ PLANNED |

R-203 was authored first, out of the suggested numeric order, because it was the specific gap
blocking `03-architecture-design-synthesis`'s GDS-07 (Data Model) pass (BL-0003/OQ-13) — the
pipeline manager routes to the topic an upstream stage actually needs, not strictly numeric order.
R-201 was authored second (2026-08-22), out of order for the same reason: it was the specific gap
blocking CR-03/BL-0011 (FS-104's maneuver cost/time table). R-202/R-204–207 remain planned, to be
authored as GDS-03/07/09 or `07-implementation-planning` need their specific grounding; R-202
specifically is deferred rather than merely pending, since v1's two-body baseline has no use for
it unless OQ-14 resolves toward adding J2.
