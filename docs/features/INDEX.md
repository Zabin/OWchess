# Feature Specifications — Index

- **Owned by:** `06-feature-specification` · **Status:** in progress, 2026-08-22

| FS ID | Title | FEAT source | Epic | Status | Summary |
|---|---|---|---|---|---|
| [FS-101](FS-101-session-turn-lifecycle.md) | Session & Turn Lifecycle | FEAT-1000 | EP-1000 | ✅ Authored | Session create/join, secret King deployment, the AP turn loop, all four win-condition paths, disconnect handling (W7: notify-and-choose, no grace period — resolved 2026-08-22). One Open Question remains (win-condition check ordering, low-stakes default assigned). |

| [FS-102](FS-102-asset-roster-mission-sets.md) | Asset Roster & Mission Sets | FEAT-3000 | EP-1000 | ✅ Authored | Template registration, deploy cost/time-to-online lifecycle, pre-online use blocking. One new Open Question: whether per-template deploy limits exist (currently unbounded, AP-scarcity-only brake). |
| [FS-103](FS-103-sensing-f2t2e-chain.md) | Sensing & the F2T2E Chain | FEAT-2000 | EP-1000 | ✅ Authored | Sensor tasking, capability-gated precision advancement, staleness decay (5-turn window, `'find'`-level entries removed when stale — resolved 2026-08-22). No open questions remaining. |

| [FS-104](FS-104-orbital-mechanics-propagator.md) | Orbital Mechanics & the `Propagator` Boundary | FEAT-5000 | EP-1000 | ✅ Authored | Continuous two-body propagation, maneuver planning/completion, regime classification. CR-03 (fuel/transfer-time table) remains open, owned by `02-research-orbital-and-tooling` first. |

| [FS-105](FS-105-effect-resolution.md) | Effect Resolution (the Five D's) | FEAT-4000 | EP-1000 | ✅ Authored | Engagement gating, Deceive/Destroy dispatch, cumulative Degrade, King denial-streak tracker. Pinned effect durations (Disrupt/Deny 3 turns, Degrade 4 turns) as this stage's own numeric refinement. |

| [FS-106](FS-106-fog-of-war-enforcement.md) | Fog-of-War Enforcement | FEAT-6000 | EP-2000 | ✅ Authored | Server-only ground truth, single-construction-point discipline (`computeOpponentView`). No open questions — fully specified by GDS-06/07/09. |

Remaining FEAT-7000, FEAT-8000 not yet specified — next per the release plan's build sequence:
FEAT-7000, then FEAT-8000.
