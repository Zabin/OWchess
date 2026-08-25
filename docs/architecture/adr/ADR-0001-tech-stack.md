# ADR-0001 — Tech Stack: TypeScript full-stack (Node.js server, React client), WebSocket transport, in-memory per-session state

- **Status:** Accepted, 2026-08-21 · **Owned by:** `03-architecture-design-synthesis`

## Context

The seed Statement of Requirements (SOR §8.1) proposed a candidate stack — React+TypeScript
frontend, Node.js+TypeScript backend, WebSocket transport, no database — as an **[ASSUMPTION —
OQ-02]**, explicitly not locked. At the `01-vision` gate, the owner declined to confirm or
pre-select any stack: *"I will not dictate the tech stack or language. Use the best language to
solve the requirements."* This ADR is the comparative decision that resolution requires — it does
not treat the SOR's candidate as already chosen.

**Requirements that actually bear on this choice** (not preference): server-authoritative state
with per-client fog-of-war filtering (NFR-2001); a schema-validated JSON/YAML asset-template model
shared conceptually between server validation and whatever the client renders (FR-2001, NFR-5001);
a `Propagator` boundary running real Kepler+J2 propagation math (FR-5001, FR-5005); WebSocket-push
turn/state notifications (FR-6001); a single-process, no-database, no-microservices deployment
(SOR §8.5); a deterministic, unit-testable game-state-resolution core (NFR-3001); and — the
practical constraint that actually dominates this decision — a **solo owner iterating through
many short Claude Code sessions**, where shared type definitions between server and client reduce
an entire class of drift bugs (a game-state or asset-template shape changing on one side and not
the other) that a two-language split cannot cheaply prevent.

## Alternatives considered

| Option | For | Against, specific to this project's requirements |
|---|---|---|
| **TypeScript full-stack** (Node.js server + React client) | Single language across server/client — the game-state schema, belief-state schema, and asset-template types can be one shared package, imported by both sides, so a fog-of-war filtering bug (sending a field the client shouldn't see) is a type-level fact, not just a runtime hope. The browser client is unavoidably JS/TS regardless of server choice — this option is the only one with *zero* language boundary anywhere in the stack. Mature WebSocket libraries (`ws`), mature test tooling (`vitest`), and Kepler+J2 is a bounded, well-documented ~200-line algorithm — no exotic numerical-library dependency needed to implement it correctly (existing libraries like `satellite.js` exist if SGP4-adjacent fidelity is ever wanted later, per R4). | None load-bearing for this project's actual scope; the main real cost (JS's historically weaker numerical-library ecosystem vs. Python) doesn't bind here because the orbital math required (Kepler+J2-minimum) is small and self-contained, not a place where reaching for `numpy`/`poliastro`-class tooling would meaningfully derisk the work. |
| **Python (FastAPI) server + separate JS/TS client** | Python has a stronger numerical/orbital-mechanics library ecosystem (`poliastro`, `skyfield`, `numpy`) and mirrors the sibling `ZabSpaceExercise` project's own stack, which the owner already has operational familiarity with. | Introduces a real language boundary the single-language option doesn't have: the game-state/belief-state/asset-template schemas would need to be defined and kept in sync in **two** places (a Python model server-side, a TypeScript type client-side) with no shared source of truth — exactly the kind of fog-of-war-adjacent drift risk NFR-2001 exists to prevent, and a needless one when the orbital math itself doesn't require Python's ecosystem advantage at this project's fidelity level (per FR-5001, Kepler+J2-minimum, not full numerical-integration-grade). MSTR-001 also commits to zero shared runtime code with `ZabSpaceExercise` (SOR §5.2) — matching its language doesn't buy actual code reuse, only surface familiarity. |
| **Go server + JS/TS client** | Strong concurrency primitives, single static binary for deployment. | The project's concurrency profile is trivial (one process per session, turn-scale actions, no high-throughput requirement) — Go's main advantage doesn't apply. Same two-language schema-duplication cost as the Python option, for a language with a smaller orbital-mechanics/game-dev ecosystem and no offsetting benefit here. |
| **Rust server (possibly compiled to WASM) + JS/TS client** | Strongest type/memory safety; a WASM-compiled core could theoretically be shared with a future client-side prediction feature. | Materially higher development friction for a solo-owner, iterate-via-short-sessions project than this v1 scope justifies — "resolve in seconds, not simulated minutes" (SOR §1) does not need Rust-grade performance, and no v1 requirement calls for client-side prediction of the `Propagator`'s output (client-side prediction is explicitly optional/non-authoritative per GDS-02/FR-6002). Worth reconsidering only if a future phase genuinely needs shared-core client-side simulation — not a v1 concern. |

## Decision

**TypeScript full-stack: Node.js (server) + React (client), WebSocket transport (`ws` or
equivalent), in-memory per-session server state, no database.** The deciding factor is not
familiarity or the SOR's original suggestion — it's that this is the only option with no language
boundary anywhere between the server's authoritative state, the fog-of-war filtering logic, and
the client's rendering of it, which directly serves this project's two highest-stakes
requirements (NFR-2001 fog-of-war integrity; NFR-5001 data-driven content) at zero added
schema-duplication risk. The Python/Go/Rust alternatives each trade this away for a benefit
(orbital-library maturity, concurrency primitives, memory safety) that this project's actual
requirements don't need enough to justify the cost.

**Concretely:** a shared `packages/shared` (or equivalent) TypeScript package holds the game-state
schema, belief-state schema, and asset-template types, imported by both the server package and the
client package — the exact mechanism GDS-07 (Data Model) will detail.

## Consequences

- GDS-03 (Architecture) can now name concrete candidate modules (`GameEngine`, `Propagator`,
  `BeliefState`, `EffectResolver`, `TurnManager`) as TypeScript modules/classes, not
  language-neutral placeholders.
- GDS-07 (Data Model)/GDS-09 (Interface Specification) can specify the shared-package mechanism
  and the WebSocket message schema in concrete TypeScript terms.
- `07-implementation-planning` records the actual build/test/start commands (npm scripts) once
  the project scaffold exists — no earlier stage should invent them (per G5's own wording).
- Every document that previously cited this stack as "tentative" (README.md, the strategic
  assumptions register, MSTR-001, GDS-00/01/02) should be read as **confirmed** as of this ADR;
  none needs a retroactive edit — they already stated the tentativeness correctly at the time they
  were written, and this ADR is the record of it resolving, not a correction to them.
- If Kepler+J2 propagation later proves to need more numerical-library maturity than hand-rolled
  TypeScript comfortably provides (a real but currently unevidenced risk), the `Propagator`
  interface boundary (FR-5005) is specifically designed so that risk is contained to one module's
  implementation, not a stack-wide rewrite.
