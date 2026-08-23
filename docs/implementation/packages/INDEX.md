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
| [IP-4010](IP-4010-effect-resolver.md) | `EffectResolver` (the Five D's Mechanism) | FS-105 (code) | `08-code-implementation` | VERIFIED |
| [IP-4011](IP-4011-effect-content.md) | Five D's Effect-Definition Content | FS-105 (content) | `08-content-authoring` | VERIFIED |
| [IP-6010](IP-6010-fog-of-war-enforcement.md) | Fog-of-War Enforcement | FS-106 | `08-code-implementation` | VERIFIED |
| [IP-7010](IP-7010-transport.md) | Server-Authoritative WebSocket Transport | FS-107 | `08-code-implementation` | COMPLETE |
| [IP-8010](IP-8010-presentation-ui.md) | Presentation / UI | FS-108 | `08-code-implementation` | COMPLETE |

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

**IP-6010 was independently verified 2026-08-22 and confirmed VERIFIED** — see
[VR-6010](../verification/VR-6010-fog-of-war-enforcement.md): `computeOpponentView`/
`applyDeception` independently confirmed structurally incapable of leaking true opponent state; the
package's own supersession sweep independently re-run across all of `server/src` (every file
touching `PlayerState`, not just the three grepped identifiers) reached the same clean conclusion;
the fog-of-war boundary was live-exercised with three of this session's own constructed scenarios
(zero-belief observer vs. a fully-populated secret opponent, object-identity/mutation isolation,
byte-for-byte true-`Asset` snapshot around `applyDeception`) beyond the committed test file's own
coverage — all held. One Low, non-blocking finding: BL-0033's Deviation note undercounts
`applyDeception`'s actual signature delta (a documentation-completeness gap for
`07-implementation-planning`'s eventual GDS-09 reconciliation, not a code defect). Build clean; full
suite green (57 tests, matching the package's own claim), run from an isolated `git worktree` since
the live shared tree carried unrelated, concurrent, uncommitted IP-4010 edits that broke its own
build. **IP-7010** (names IP-0010, IP-1010, IP-6010 — all three now `VERIFIED`) flips `BLOCKED` →
**`READY`**. **IP-4010** (names IP-0010, IP-2010, IP-6010 — all three now `VERIFIED`) has its
dependency gate satisfied too, but was found already `COMPLETE` in the shared working tree
(uncommitted, concurrent implementation) rather than `BLOCKED` awaiting this flip — it is the next
package eligible for its own `09-package-verification` pass once that work is committed
(observed, at this same moment, to be progressing fast: IP-4011 was also found already `COMPLETE`
in the shared working tree, ahead of IP-4010's own verification — this VR does not audit either).
IP-8010 (depends on all 10 others) remains `BLOCKED`.

**IP-4010 was independently verified 2026-08-22 and confirmed VERIFIED** — see
[VR-4010](../verification/VR-4010-effect-resolver.md): the Deceive/Destroy structural distinction
was live-exercised beyond `EffectResolver.test.ts`'s own coverage, through the real
`GameEngine.handleAction('engage', ...)` path, against a King pre-populated with a non-default
active effect and non-zero denial-streak fields, repeated twice — the true state stayed
byte-for-byte unchanged throughout, while a Destroy call on a separate target did mutate
`destroyed`, confirming genuinely distinct code paths. Denial-streak arithmetic
(`consecutiveDenialTurns`/`totalDenialTurns`) was independently cross-checked field-for-field
against `GameEngine.checkWinConditions` (IP-1010) and FS-105/FR-4400/FR-1420 — no drift. The
`TurnEndHook` `turnNumber` widening (BL-0036) was confirmed additive/backward-compatible by
re-running IP-1010's/IP-3010's own already-`VERIFIED` hook-consumer tests, all unchanged and
passing. Two Low, non-blocking findings: the `resolveEngagement` Deviation note undercounts its
actual signature delta (same category as VR-6010's F1 for `applyDeception`); the package's prose
describes a "`handleAction` switch" that doesn't literally exist (the real mechanism is
`GameEngine.registerHandler`). Build clean; full suite green (66 tests, matching the package's own
claim exactly). **IP-4011** (its sole named blocking dependency, IP-4010, is now `VERIFIED`) is
the next package eligible for its own `09-package-verification` pass. IP-8010 (depends on all 10
others) remains `BLOCKED`.

**IP-4011 was independently verified 2026-08-23 and confirmed VERIFIED** — see
[VR-4011](../verification/VR-4011-effect-content.md): all five effect-definition files were hand-
verified against FS-105's prose and against `EffectResolver.ts`'s real duration constants directly
(not just against the package's own `effectDefinitions.test.ts` assertions). A live re-exercise
beyond that committed test (which only round-trips `disrupt`/`degrade` through the real resolver)
independently confirmed the **Deny** duration, a non-default 7-turn multi-stack Degrade tick past
the 6-turn mission-denial threshold (correct expiry/reset/total arithmetic), and that Deceive's
content-declared `"until-cleared"` duration is never written into a real `EffectStateEntry`. The
effector-to-effect doctrine mapping was independently cross-checked cell-by-cell against IP-3011's
real asset-type `_effectAffinity` content — fully consistent today. Three Low, non-blocking
findings: the committed "references a real asset-type template" test only checks referential
existence, not the doctrine cross-check the package's "Tests to Add" section promises (data is
correct, coverage is thinner than claimed); Task 2's "IP-4010's `EffectDefinition` schema" wording
is imprecise since the schema is authored entirely within this package (already substantively
disclosed by BL-0037); the package's "70 tests" claim is stale (94 today) purely from concurrent
IP-7010/IP-8010 landing. Build clean; full suite green. No package flips to `READY` from this VR
alone — IP-8010 (the only package naming IP-4011) also still needs IP-7010 `VERIFIED`.

**IP-7010 was independently verified 2026-08-23 and RETURNED** — see
[VR-7010](../verification/VR-7010-transport.md): the fog-of-war non-leak claim at the network edge
was live-exercised (not just re-read) and holds — `broadcastStateDelta` genuinely computes two
independent per-player `StateDeltaMessage`s via IP-6010's already-`VERIFIED`
`computeOpponentView`, and `SessionStore`'s `crypto.randomBytes(16)` session-ID generation
(VR-1010-v2's fix) is unchanged and not bypassed by `connectionRegistry.ts`. Two High findings
block `VERIFIED`: (F1) `handleConnection`'s reconnect path silently drops a connection presenting
a nonexistent `sessionId` (sends nothing) rather than the "clear 'session no longer exists'
response" FS-107's own W4 edge case and NFR-7200 require — live-reproduced, uncaught by either
committed test file; (F2) the package's own DoD claim that a cancelled session gets
`outcome: 'cancelled'` is not implemented — `SessionState` has no `outcome` field at all, only
`phase`, so a cancellation is not durably distinguishable from other `'ended'` states as FS-101
§W7 requires, and live-reproducing a cancel past the 60-turn timeout cap shows
`checkWinConditions` actively mislabels it `{winner: null, reason: 'timeout-tiebreak'}`. Build
clean; full suite green (79 shared+server tests, matching the package's own claim exactly). IP-7010
stays `COMPLETE`, routed back to `08-code-implementation` (F1) and `07-implementation-planning`
(F2's `SessionState` schema gap). IP-4011 is independently `VERIFIED` as of this same day (see above); IP-8010 remains `BLOCKED`
pending only IP-7010's own fix-and-reverify cycle now.
