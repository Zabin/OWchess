# Implementation Packages — Index

- **Owned by:** `07-implementation-planning` (rows) · advanced by `08-*`/`09-package-verification`
  (status only) · **Status:** MVP tranche authored, 2026-08-22.

| ID | Title | FS/BL source | Owning 08 peer | Status |
|---|---|---|---|---|
| [IP-0010](IP-0010-project-scaffold.md) | Project Scaffold & Shared Types | — (foundational) | `08-code-implementation` | VERIFIED |
| [IP-1010](IP-1010-session-turn-lifecycle.md) | Session & Turn Lifecycle | FS-101 | `08-code-implementation` | COMPLETE (re-submitted after VR-1010) |
| [IP-3010](IP-3010-asset-roster-lifecycle.md) | Asset Roster: Registration & Deploy Lifecycle | FS-102 (code) | `08-code-implementation` | COMPLETE |
| [IP-3011](IP-3011-asset-mission-content.md) | Mission-Set & Asset-Type Content Templates | FS-102 (content) | `08-content-authoring` | BLOCKED |
| [IP-2010](IP-2010-sensing-f2t2e.md) | Sensing & the F2T2E Chain | FS-103 | `08-code-implementation` | BLOCKED |
| [IP-5010](IP-5010-propagator.md) | `Propagator` (Two-Body Orbital Mechanics) | FS-104 | `08-code-implementation` | BLOCKED |
| [IP-4010](IP-4010-effect-resolver.md) | `EffectResolver` (the Five D's Mechanism) | FS-105 (code) | `08-code-implementation` | BLOCKED |
| [IP-4011](IP-4011-effect-content.md) | Five D's Effect-Definition Content | FS-105 (content) | `08-content-authoring` | BLOCKED |
| [IP-6010](IP-6010-fog-of-war-enforcement.md) | Fog-of-War Enforcement | FS-106 | `08-code-implementation` | BLOCKED |
| [IP-7010](IP-7010-transport.md) | Server-Authoritative WebSocket Transport | FS-107 | `08-code-implementation` | BLOCKED |
| [IP-8010](IP-8010-presentation-ui.md) | Presentation / UI | FS-108 | `08-code-implementation` | BLOCKED |

All 11 packages authorized under the current release plan's MVP-bucketing (G3 satisfied by
release-plan coverage — see each package's own Authorization line). See
`docs/implementation/00-master-build-plan.md` for the dependency graph, critical path, and next
action. IP-0010 independently verified 2026-08-22 — see
[VR-0010](../verification/VR-0010-project-scaffold.md). IP-1010 independently verified 2026-08-22
and **RETURNED** to `08-code-implementation` — see
[VR-1010](../verification/VR-1010-session-turn-lifecycle.md) (critical: guessable sequential
session IDs violate NFR-3200).
