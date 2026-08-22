# Feature Specifications — Index

- **Owned by:** `06-feature-specification` · **Status:** in progress, 2026-08-22

| FS ID | Title | FEAT source | Epic | Status | Summary |
|---|---|---|---|---|---|
| [FS-101](FS-101-session-turn-lifecycle.md) | Session & Turn Lifecycle | FEAT-1000 | EP-1000 | ✅ Authored | Session create/join, secret King deployment, the AP turn loop, all four win-condition paths, disconnect handling (W7: notify-and-choose, no grace period — resolved 2026-08-22). One Open Question remains (win-condition check ordering, low-stakes default assigned). |

| [FS-102](FS-102-asset-roster-mission-sets.md) | Asset Roster & Mission Sets | FEAT-3000 | EP-1000 | ✅ Authored | Template registration, deploy cost/time-to-online lifecycle, pre-online use blocking. One new Open Question: whether per-template deploy limits exist (currently unbounded, AP-scarcity-only brake). |
| [FS-103](FS-103-sensing-f2t2e-chain.md) | Sensing & the F2T2E Chain | FEAT-2000 | EP-1000 | ✅ Authored | Sensor tasking, capability-gated precision advancement, staleness decay. **CR-01 (decay rate) ripened here — genuinely blocks this spec's numeric completeness, needs owner input.** |

Remaining FEAT-4000–8000 not yet specified — next per the release plan's build sequence:
FEAT-5000, then FEAT-4000/FEAT-6000, then FEAT-7000, then FEAT-8000.
