# Architecture (GDS ladder) — Index

The GDS ladder translates `docs/master/MSTR-001` into design terms, one level at a time, owned by
`03-architecture-design-synthesis` except GDS-00 (the vision's own design-facing restatement,
owned by `01-vision`).

| Level | Document | Owned by | Status |
|---|---|---|---|
| GDS-00 | Vision (design-facing restatement) — [`00-vision.md`](00-vision.md) | `01-vision` | 🟢 Gate closed, same as MSTR-001 v0.2 |
| GDS-01 | Concept of Operations — [`01-concept-of-operations.md`](01-concept-of-operations.md) | `03-architecture-design-synthesis` | ✅ Authored 2026-08-21 — gate closed; raised OQ-11, OQ-12 (entry stage `03`, non-blocking for GDS-02) |
| GDS-02 | System Context — [`02-system-context.md`](02-system-context.md) | `03-architecture-design-synthesis` | ✅ Authored 2026-08-21 — gate closed |
| GDS-03 | Architecture (incl. `Propagator` boundary) — [`03-architecture.md`](03-architecture.md) | `03-architecture-design-synthesis` | ✅ Authored 2026-08-21 — gate closed; resolved BL-0001/BL-0002 |
| GDS-04 | Domain Model — [`04-domain-model.md`](04-domain-model.md) | `03-architecture-design-synthesis` | ✅ Authored 2026-08-21 — gate closed; raised OQ-13 (non-blocking for GDS-05/06) |
| GDS-05 / GDS-06 | Functional / Non-Functional Requirements levels | `03-architecture-design-synthesis` | ⛔ Planned |
| GDS-07 | Data Model | `03-architecture-design-synthesis` | ⛔ Planned |
| GDS-08 | Presentation Architecture | `03-architecture-design-synthesis` | ⛔ Planned — grounded in the ZabOW `ORBITAL COMMAND` reference, see MSTR-001 §4 |
| GDS-09 | Interface Specification | `03-architecture-design-synthesis` | ⛔ Planned |
| GDS-10 | Requirements Traceability Matrix level | `03-architecture-design-synthesis` | ⛔ Planned |

Also in this directory:

- [`strategic-assumptions-register.md`](strategic-assumptions-register.md) — every open assumption
  the vision/architecture tiers rest on, with trigger conditions. **Currently the primary gate
  artifact** — most rows are open, pending the owner's response at the `01-vision` gate.
- [`adr/`](adr/INDEX.md) — Architecture Decision Records, numbered `ADR-####`. **ADR-0001**
  (tech stack: TypeScript full-stack, Node.js server + React client, WebSocket, in-memory
  per-session state) accepted 2026-08-21, resolving OQ-02.
