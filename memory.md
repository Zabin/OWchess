# memory.md

Quick-reference tables for OW Chess's shipped game content — mission sets, asset types, and effect
definitions. Backfilled from the authoritative source files under `server/src/content/`; if this
file and those JSON files ever disagree, the JSON files are correct and this file is stale (flag it
via `00-intake` as a `doc-defect`, or fix it directly if you're already touching the content
peer).

Read automatically alongside `CLAUDE.md` at the start of every session. `09-content-review` checks
this file's currency as one of its five review dimensions (Documentation coherence).

## Mission sets

`server/src/content/missionSets/*.json` — each mission set constrains which asset types a player
may deploy and where their King may be placed.

| Mission set | Asset type IDs | King regime affinity |
|---|---|---|
| `isr` | `wide-area-sda-radar`, `optical-imaging-sensor-ground`, `optical-imaging-sensor-space`, `kinetic-rpo-effector` | `LEO-POLAR` |
| `pnt-lite` | `ground-tracking-array`, `space-based-sda-sensor` | `MEO-EQUATORIAL` |
| `satcom` | `ground-tracking-array`, `space-based-sda-sensor`, `ew-jamming-effector` | `GEO-EQUATORIAL` |

## Asset types

`server/src/content/assetTypes/*.json`. `regimeAffinity` lists every `OrbitalRegimeLabel` the
asset may be assigned to on deploy (9-value taxonomy: `{LEO,MEO,GEO}-{EQUATORIAL,PROGRADE,POLAR}`).
`chainRoles` are the F2T2E roles the asset can perform (`find`/`fix`/`track`/`target`/`engage`).
`_effectAffinity` (space-based effectors only) constrains which `FiveDsEffect`s the asset can apply
on Engage — see `applicableEffects` in `shared/src/interfaces.ts`.

| Template ID | Basing | AP cost | Time to online | Chain roles | Regime affinity | Effect affinity |
|---|---|---|---|---|---|---|
| `wide-area-sda-radar` | ground | 2 | 1 | find, fix | LEO-EQUATORIAL, LEO-PROGRADE, LEO-POLAR | — |
| `ground-tracking-array` | ground | 2 | 1 | fix, track | LEO-EQUATORIAL, LEO-PROGRADE, LEO-POLAR, MEO-EQUATORIAL | — |
| `optical-imaging-sensor-ground` | ground | 2 | 1 | track, target | LEO-POLAR, LEO-PROGRADE | — |
| `optical-imaging-sensor-space` | space | 3 | 3 | track, target | LEO-POLAR, MEO-EQUATORIAL, GEO-EQUATORIAL | — |
| `space-based-sda-sensor` | space | 3 | 3 | find, fix, track | all 9 regimes | — |
| `ew-jamming-effector` | space | 3 | 3 | engage | all 9 regimes | disrupt, deny, degrade, deceive |
| `kinetic-rpo-effector` | space | 4 | 4 | engage | LEO-EQUATORIAL, LEO-PROGRADE, LEO-POLAR, MEO-EQUATORIAL | destroy, disrupt, deny |

**Known caveat (BL — see backlog):** `basing: 'ground'` asset types are nonetheless assigned an
orbital `trueRegime` by `deployAction.ts`, and `regimeAffinity` is enforced only at deploy time —
`taskAction`/`applyTasking` never consult it, so an asset can successfully task a target outside
its own `regimeAffinity`. Roster depth is presently closer to cosmetic than mechanical; see the
Wave-1 remediation plan and `06-feature-specification`/GDS-04 for the intended fix.

## Effect definitions (the Five D's)

`server/src/content/effects/*.json`. `stacking: 'none'` means a second application of the same
effect on an already-affected target does not extend or restack it; `'independent'` means multiple
applications each run their own duration clock.

| Effect | Duration (turns) | Stacking | Allowed effector template IDs |
|---|---|---|---|
| `destroy` | terminal | none | `kinetic-rpo-effector` |
| `deny` | 3 | independent | `kinetic-rpo-effector`, `ew-jamming-effector` |
| `disrupt` | 3 | independent | `kinetic-rpo-effector`, `ew-jamming-effector` |
| `degrade` | 4 | independent | `ew-jamming-effector` |
| `deceive` | until-cleared | none | `ew-jamming-effector` |

**Known defect (BL — see backlog):** `engageAction.ts` passes the *acting* player's own
`observerState` into `applyDeception` rather than the target's, and the client never sends
`falseRegime`, so a successful Deceive currently corrupts the deceiver's own belief map with the
target's *true* regime instead of planting a false one in the victim's. Do not treat Deceive as
functioning correctly until this is fixed and re-verified.

## Status

As of `e0bf3ac` (2026-08-23): all content above is shipped and covered by `VERIFIED` packages
(IP-3010/IP-3011 asset types & mission sets, content peer). The **engine wiring** that makes this
content fully playable is not yet complete — see `CLAUDE.md`'s Known Good Behavior section for
what is and isn't reachable in the running app today.
