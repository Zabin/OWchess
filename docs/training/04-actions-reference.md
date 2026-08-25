# 04 — Actions Reference

Every action type the game engine supports, its AP cost/preconditions, and — honestly — whether
the shipped web interface currently lets you complete it yourself.

## Pass

Always legal on your turn, regardless of remaining AP. Ends your turn immediately with no other
effect. **Fully usable in the shipped UI.**

## Deploy Asset

Creates a new asset from one of your mission set's allowed templates and deducts its AP cost.
Each asset takes a number of turns to come "online" before it can act (a ground asset comes
online faster than a space asset — see the table below).

| Asset type | Basing | AP cost | Turns to online | Chain roles | ⚠ |
|---|---|---|---|---|---|
| `wide-area-sda-radar` | ground | 2 | 1 | find, fix | |
| `ground-tracking-array` | ground | 2 | 1 | fix, track | |
| `optical-imaging-sensor-ground` | ground | 2 | 1 | track, target | |
| `space-based-sda-sensor` | space | 3 | 3 | find, fix, track | |
| `optical-imaging-sensor-space` | space | 3 | 3 | track, target | |
| `ew-jamming-effector` | space | 3 | 3 | engage (disrupt/deny/degrade/deceive) | |
| `kinetic-rpo-effector` | space | 4 | 4 | engage (destroy/disrupt/deny) | |

Which of these are available to you depends on your chosen mission set:

| Mission set | Available asset types | King's allowed starting regime(s) |
|---|---|---|
| `satcom` | ground-tracking-array, space-based-sda-sensor, ew-jamming-effector | GEO-EQUATORIAL |
| `isr` | wide-area-sda-radar, optical-imaging-sensor-ground, optical-imaging-sensor-space, kinetic-rpo-effector | LEO-POLAR |
| `pnt-lite` | ground-tracking-array, space-based-sda-sensor | MEO-EQUATORIAL |

**⚠ Confirmed gap (see `03-first-game.md`):** the Deploy button does not currently let you choose
the new asset's orbital regime — it deploys with none. **Partially usable in the shipped UI**
(the asset is created and costs the right AP, but has no real position).

## Maneuver

Moves an online asset (including your King, once online logic allows it) toward a different
orbital regime over a number of turns, at a fuel-analog AP cost the server computes per-request.
Requires: your turn, AP > 0, and at least one online asset not already mid-maneuver. **Not
currently usable in the shipped UI** — the Maneuver button reflects real legality (enabled only
when the above conditions hold), but no interface element lets you specify which asset or which
target regime, both of which the server requires.

## Task Sensor

Directs one of your online sensor-capable assets (chain role find/fix/track/target) to advance
your belief-state precision about a chosen opponent orbital regime, one F2T2E step at a time
(find → fix → track → target), capped by that asset's own chain-role ceiling. Requires: your
turn, AP > 0, at least one online asset with a sensor role. **Not currently usable in the shipped
UI** — same gap as Maneuver: no interface lets you pick the source asset or target regime.

## Engage

Directs one of your online effector-capable assets (chain role `engage`) to apply one of the Five
D's to a target you've already tasked to sufficient precision. Requires: your turn, AP > 0, at
least one online asset with the engage role, and (per `EffectResolver`) sufficient targeting
precision already gathered on the target. **Not currently usable in the shipped UI** — no
interface lets you pick the effector, the target, or which effect to apply.

| Effect | Duration | Who can apply it | What it does |
|---|---|---|---|
| Deceive | until overwritten by a fresh observation | `ew-jamming-effector` | Corrupts the opponent's belief-state entry for the target with a false apparent regime. |
| Disrupt | 3 turns | `kinetic-rpo-effector`, `ew-jamming-effector` | Temporary effect on the target. |
| Deny | 3 turns | `kinetic-rpo-effector`, `ew-jamming-effector` | Temporary effect on the target; against a King, counts toward the mission-denial win condition (6 consecutive denied turns). |
| Degrade | 4 turns, stacks independently | `ew-jamming-effector` | Multiple applications coexist and tick down independently. |
| Destroy | terminal | `kinetic-rpo-effector` | Removes the target from play permanently; against a King, wins the game immediately. |

## Resign

Immediately, permanently ends the game in your opponent's favor — legal on any turn, including
your opponent's (`GameEngine.ts`: "Resign is the one action type legal regardless of turn").
**Not currently exposed in the shipped UI at all** — the Action Menu has no Resign button, even
though the game engine and its win-condition logic fully support it.

## Win conditions (for reference — how a game actually ends)

Checked in this order: **resignation** (immediate) → **destruction** (either King destroyed) →
**mission denial** (either King denied 6 consecutive turns) → **timeout-tiebreak** (60 total
turns elapsed; the player with fewer lifetime denial-turns on their own King wins, or the game
ties if equal).

> Sources: `server/src/content/assetTypes/*.json`, `server/src/content/missionSets/*.json`,
> `server/src/content/effects/*.json` (all real content, read directly); `client/src/legality/
> legalityPreFilter.ts`; `client/src/components/ActionMenu.tsx`; `server/src/engine/
> {deployAction,taskAction,maneuverAction,engageAction,GameEngine}.ts`. Satisfies FR-9110.
