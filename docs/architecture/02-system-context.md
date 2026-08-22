# GDS-02 — System Context

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** GDS-03, GDS-06

Where GDS-01 described what happens; this level draws the boundary around what system draws it.
Written stack-agnostically wherever possible, since OQ-02 (tech stack) was explicitly delegated by
the owner rather than pre-confirmed (`strategic-assumptions-register.md`) — the concrete stack
choice is recorded as an ADR alongside GDS-03 (Architecture), the level where module decomposition
actually needs a language to decompose into. Nothing here assumes a specific language beyond what
the SOR's own architecture non-goals already fix (SOR §8.5): no database, no microservices, no
mobile-native client, no server-side AI/bot logic.

## The three actors

1. **Player A's client** — a browser tab, holding only the belief-state the server has sent it
   (GDS-00's fog-of-war principle). Never computes or infers opponent ground truth locally.
2. **Player B's client** — symmetric to (1).
3. **One server process per session** — the sole authority for game state (MSTR-001 C3). Holds
   both players' true asset states, both players' derived belief-states, the AP/action economy,
   and the event log (SOR §8.3). Exactly one process per session; no shared state across sessions
   beyond process-level isolation (NFR-3002 — a session crash must not affect other sessions).

There is no fourth actor. No facilitator/white-cell process (unlike `ZabSpaceExercise`), no
matchmaking service, no persistence tier, no third-party auth provider (SOR §8.5, §5.2).

## External interface: what crosses the client/server boundary

Exactly two channels, both terminating at the same server process:

- **Action submission** (client → server): a player's attempted action (maneuver, task, deploy,
  pass), validated server-side against current legality before any effect (SOR §7.10, FR-1007).
  Rejected actions never partially apply.
- **State-delta push** (server → client): the server pushes the resulting state change after
  every resolved action, filtered through the receiving client's own fog-of-war (FR-3002) — never
  a client-pull/poll model (SOR §8.1's WebSocket rationale: push avoids requiring the non-active
  player to poll for "is it my turn yet").

No other traffic crosses this boundary in v1: no chat channel, no spectator feed, no replay
export (SOR §5.2, §8.3 — the event log exists for debugging/future R3, not shipped as a v1
feature).

## Session lifecycle as a system-context concern

A session is created, exists in server memory for its duration, and is discarded when it ends
(win condition, resignation, or both clients disconnecting past whatever grace period FR-6003
settles) — there is no session persistence beyond process memory (SOR §8.1, §8.5). This has a
direct system-context consequence: **the server process is itself the availability boundary**. If
the process restarts, every in-flight session is lost — there is no external store to recover
from. Whether this is an acceptable v1 posture (a single Node-or-equivalent host, no HA) or needs
mitigation is not decided at this level; SOR §8.1/OQ-08 already name deployment target as an open
question for this same architecture stage to resolve, and this system-context fact is the reason
it matters (recorded here so `04-requirements-engineering` sees the NFR consequence, not just the
scope note).

## External constraints (what this system does not control)

- **The browser sandbox** — no filesystem access, no native socket beyond what the browser's
  WebSocket API exposes; client-side code is fully inspectable by the player running it (the
  reason server-authoritative state is non-negotiable, NFR-2001).
- **The join-link as the only access control** — session IDs must be sufficiently unguessable
  (NFR-2002); there is no login step to fall back on if a link leaks.
- **No control over player network conditions** — the turn-latency budget (NFR-1001, "a few
  seconds under normal broadband," exact SLA TBD at `04`) is a target the system designs toward,
  not a guarantee it can enforce; FR-6003's disconnect/reconnect handling exists because the
  system cannot prevent disconnection, only respond to it gracefully.

## What this level deliberately leaves open

- The **concrete tech stack** (OQ-02) — recorded as a pending ADR, produced alongside GDS-03.
- The **deployment/hosting target** (OQ-08) — a single-process constraint is fixed by SOR §8.5;
  *where* that process runs is not decided here.
- **BL-0001/OQ-11** (transfer-time counting convention) and **BL-0002/OQ-12** (whether passive
  detection is a server mechanic) — both genuinely belong to GDS-03/04 (they're about internal
  module behavior, not the system boundary), not to this level. Confirmed here as correctly
  out-of-scope for GDS-02, not overlooked.

## Merge gate

- [x] Client/server/session-process boundary stated unambiguously.
- [x] The two crossing channels (action submission, state-delta push) enumerated, no others
      invented.
- [x] External constraints (browser sandbox, join-link-only access control, network conditions)
      named, each traced to the SOR/NFR that already establishes it.
- [x] No tech-stack commitment made here — explicitly deferred to the GDS-03-adjacent ADR.
- [x] GDS-00/GDS-01 content not restated wholesale — cited, and only expanded where this level's
      own boundary-drawing job requires it.

**Merge decision:** GDS-00/01 remain authoritative for vision/operational-concept statements; this
document is authoritative for the system boundary and does not duplicate their content beyond the
citations above.

**Gate:** closed 2026-08-21. Next: GDS-03 (Architecture) — including the tech-stack ADR, and
resolution of BL-0001 (OQ-11) and BL-0002 (OQ-12), both scheduled to ride with this pass.
