# Implementation Packages — Index

- **Owned by:** `07-implementation-planning` (rows) · advanced by `08-*`/`09-package-verification`
  (status only) · **Status:** MVP tranche authored, 2026-08-22.

| ID | Title | FS/BL source | Owning 08 peer | Status |
|---|---|---|---|---|
| [IP-0010](IP-0010-project-scaffold.md) | Project Scaffold & Shared Types | — (foundational) | `08-code-implementation` | VERIFIED |
| [IP-1010](IP-1010-session-turn-lifecycle.md) | Session & Turn Lifecycle | FS-101 | `08-code-implementation` | VERIFIED |
| [IP-3010](IP-3010-asset-roster-lifecycle.md) | Asset Roster: Registration & Deploy Lifecycle | FS-102 (code) | `08-code-implementation` | VERIFIED |
| [IP-3011](IP-3011-asset-mission-content.md) | Mission-Set & Asset-Type Content Templates | FS-102 (content) | `08-content-authoring` | VERIFIED |
| [IP-2010](IP-2010-sensing-f2t2e.md) | Sensing & the F2T2E Chain | FS-103 | `08-code-implementation` | VERIFIED |
| [IP-5010](IP-5010-propagator.md) | `Propagator` (Two-Body Orbital Mechanics) | FS-104 | `08-code-implementation` | VERIFIED |
| [IP-4010](IP-4010-effect-resolver.md) | `EffectResolver` (the Five D's Mechanism) | FS-105 (code) | `08-code-implementation` | COMPLETE |
| [IP-4011](IP-4011-effect-content.md) | Five D's Effect-Definition Content | FS-105 (content) | `08-content-authoring` | BLOCKED |
| [IP-6010](IP-6010-fog-of-war-enforcement.md) | Fog-of-War Enforcement | FS-106 | `08-code-implementation` | COMPLETE |
| [IP-7010](IP-7010-transport.md) | Server-Authoritative WebSocket Transport | FS-107 | `08-code-implementation` | BLOCKED |
| [IP-8010](IP-8010-presentation-ui.md) | Presentation / UI | FS-108 | `08-code-implementation` | BLOCKED |

All 11 packages authorized under the current release plan's MVP-bucketing (G3 satisfied by
release-plan coverage — see each package's own Authorization line). See
`docs/implementation/00-master-build-plan.md` for the dependency graph, critical path, and next
action. IP-0010 independently verified 2026-08-22 — see
[VR-0010](../verification/VR-0010-project-scaffold.md). IP-1010 was independently verified
2026-08-22 and initially **RETURNED** to `08-code-implementation` — see
[VR-1010](../verification/VR-1010-session-turn-lifecycle.md) (critical: guessable sequential
session IDs violate NFR-3200) — then fixed and, on a fresh independent re-verification, confirmed
**VERIFIED** — see
[VR-1010-v2](../verification/VR-1010-session-turn-lifecycle-v2.md). IP-3010 was independently
verified 2026-08-22 — see [VR-3010](../verification/VR-3010-asset-roster-lifecycle.md) (both
disclosed deviations, BL-0022 and the `turnsUntilOnline`-field reuse, judged reasonable; one Low,
non-blocking finding on deploy-tick wiring deferred to the future transport/bootstrap package).
IP-3011 was independently verified 2026-08-22 — see
[VR-3011](../verification/VR-3011-asset-mission-content.md) (all 7 asset-type/3 mission-set
templates read directly and schema-confirmed; numeric AP-cost/timing fields confirmed honestly
labeled provisional per BL-0017; BL-0027's `dist/`-content gap confirmed accurate and correctly
scoped; three Low, non-blocking wording-drift findings). With IP-3011 now `VERIFIED`, IP-2010 and
IP-5010 — both already `COMPLETE` and both naming IP-0010/IP-1010/IP-3010/IP-3011 as their sole
blocking dependencies, all four now `VERIFIED` — each become the next checkable package for their
own `09-package-verification` pass. IP-2010 was independently verified 2026-08-22 and
**RETURNED** — see [VR-2010](../verification/VR-2010-sensing-f2t2e.md) (Critical: tasking a sensor
with no F2T2E-relevant `chainRoles` — e.g. an effector — silently succeeds and spends 1 AP instead
of being rejected, violating FS-103 AC4 despite the package's own Checklist marking that item
satisfied; the BL-0028 deviation itself judged reasonable and accurately disclosed). IP-5010 was
independently verified 2026-08-22 and confirmed **VERIFIED** — see
[VR-5010](../verification/VR-5010-propagator.md): the worked example
(`LEO-EQUATORIAL → GEO-POLAR` = 11 fuel / 5 turns) was independently hand-re-derived from FS-104's
raw Maneuver Cost Table formula (not merely re-run as a test), and every populated cell of
`Propagator.ts`'s `ALTITUDE_COST`/`PLANE_COST` tables was cross-checked against FS-104's source
tables — all matched; both disclosed notes (BL-0030's composition root, BL-0031's not-yet-gated
fuel budget) confirmed accurate. Two Low, non-blocking findings (a stale full-suite test-count line;
the package's own Analysis checklist item relying on the regression test alone rather than an
independent re-derivation, which this audit supplied).

**IP-2010 was fixed and, on a fresh independent re-verification, confirmed VERIFIED** — see
[VR-2010-v2](../verification/VR-2010-sensing-f2t2e-v2.md): `hasSensorCapability(chainRoles)` (a
real re-derivation of the capability-ceiling logic, not a stub) is now checked in
`taskAction.ts`'s handler strictly before `assertOnline`/AP-spend, confirmed both by code reading
and by live re-exercise of the exact original failing scenario (an effector-only asset, now
correctly rejected with 0 AP spent and 0 belief entries) plus previously-untested legitimate
ceiling cases (empty roles; full-chain to `'target'`), none of which the fix broke. Build clean;
full suite green (54 tests, matching the package's own claim). No findings. IP-2010's blocking
dependencies were already all `VERIFIED`; with IP-2010 now `VERIFIED` too, **IP-6010** (which names
IP-0010 and IP-2010 as its sole blocking dependencies) has both satisfied — IP-6010 was found
already `COMPLETE` in the tree (implemented concurrently by another session), so it is now the
next package eligible for its own `09-package-verification` pass. No package flips to `READY` from
either the IP-5010 or IP-2010 verification alone: IP-8010 needs every other package `VERIFIED`
first, and IP-4010/IP-4011/IP-7010 remain `BLOCKED` on IP-6010's own verification.
