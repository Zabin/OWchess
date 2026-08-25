# Release Assessment — MVP

- **Owned by:** `11-release-readiness` · **Date:** 2026-08-23
- **Release bucket:** MVP (`docs/feature-planning/01-release-plan.md`) — all 8 Features
  (FEAT-1000 through FEAT-8000), by the release plan's own explicit statement that "all eight
  Features are MVP," not a subset.
- **Commit assessed:** `edba50a` (head of `claude/new-session-auwtoo` at assessment time).

## Scope audit

| Feature | FS | Package(s) | VR(s) | Integration coverage | Delivered/deviated |
|---|---|---|---|---|---|
| FEAT-1000 — Session & Turn Lifecycle | FS-101 | IP-1010 | VR-1010 (RETURNED, Critical) → VR-1010-v2 (VERIFIED) | `integration-review-mvp-tranche.md` | Delivered. One Critical finding (guessable session IDs) caught and fixed same day; re-verified clean. |
| FEAT-2000 — Sensing & F2T2E Chain | FS-103 | IP-2010 | VR-2010 (RETURNED, Critical) → VR-2010-v2 (VERIFIED) | included | Delivered. One Critical finding (tasking-legality bypass) caught and fixed same day; re-verified clean. |
| FEAT-3000 — Asset Roster & Mission Sets | FS-102 | IP-3010 (code), IP-3011 (content) | VR-3010 (VERIFIED), VR-3011 (VERIFIED) | included | Delivered, clean on first verification pass for both packages. |
| FEAT-4000 — Effect Resolution (Five D's) | FS-105 | IP-4010 (code), IP-4011 (content) | VR-4010 (VERIFIED), VR-4011 (VERIFIED) | included | Delivered, clean on first verification pass for both packages. |
| FEAT-5000 — Orbital Mechanics / `Propagator` | FS-104 | IP-5010 | VR-5010 (VERIFIED) | included | Delivered, clean on first pass — including an independent hand-re-derivation of the full Maneuver Cost Table, not just a re-run test. |
| FEAT-6000 — Fog-of-War Enforcement | FS-106 | IP-6010 | VR-6010 (VERIFIED) | included | Delivered, clean on first pass — the catalog's own Highest-Risk Feature, confirmed structurally incapable of leaking true state. |
| FEAT-7000 — Server-Authoritative Transport | FS-107 | IP-7010 | VR-7010 (RETURNED, 2 High) → VR-7010-v2 (VERIFIED) | included | Delivered. Two High findings (silent reconnect drop; missing cancellation-outcome field) caught and fixed; re-verified clean. |
| FEAT-8000 — Presentation / UI | FS-108 | IP-8010 | VR-8010 (RETURNED, 1 High) → VR-8010-v2 (VERIFIED) | included | Delivered. One High finding (no data-delivery path for asset-template data) caught and fixed; re-verified clean. |
| — (foundational scaffold, no FS) | — | IP-0010 | VR-0010 (VERIFIED) | included | Delivered, clean on first pass — the monorepo/shared-types foundation every other package builds on. |

**All 8 planned Features, across 11 packages, are delivered and independently `VERIFIED`.** None
was descoped, deferred, or split since planning — the scope actually shipped matches the scope
the release plan promised, feature for feature.

## Evidence

- **Build:** `npm run build` clean across all 3 workspaces (`shared`/`server`: `tsc -b`; `client`:
  `tsc -b && vite build`), re-confirmed at `10-integration-review` against a genuinely fresh
  `npm install` (not a cached `node_modules`).
- **Test suite:** 98 tests passing (1 shared + 80 server + 17 client), zero failures, re-confirmed
  at the same integration-review pass.
- **Verification:** 11/11 packages carry a named, independent Verification Report
  (`docs/implementation/verification/VR-*.md`) — 3 of the 11 required one RETURNED→fixed→re-verified
  cycle each (IP-1010, IP-2010, IP-7010, IP-8010 — four cycles across three... actually IP-1010,
  IP-2010, IP-7010, and IP-8010 each needed exactly one cycle), the other 7 verified clean on the
  first pass. No package was ever marked `VERIFIED` without a dedicated report.
- **Integration:** `docs/reviews/integration-review-mvp-tranche.md` — the full 11-package set
  reviewed together, no Critical/High findings, all five review dimensions actually exercised
  against the live tree (not asserted from memory).

## Known deviations (all disclosed, all judged reasonable by their originating verification pass)

Five additive, backward-compatible interface deviations from GDS-09's original text, accumulated
across the tranche and confirmed mutually consistent by the integration review (the whole tree
still compiles as one unit, no two deviations conflict):

1. **BL-0028** — `BeliefState.applyTasking` gained two parameters (`observerState`,
   `opponentTrueState`) GDS-09's original signature lacked.
2. **BL-0033** — `computeOpponentView`/`applyDeception` similarly gained state-access parameters.
3. **BL-0036** — `TurnEndHook` gained a `turnNumber` parameter.
4. **BL-0045** — `SessionState` gained an additive `cancelled` field; `WinReason` gained a
   `'cancelled'` value — closing VR-7010's F2 finding.
5. **BL-0048** — a new `TemplateCatalogMessage`/`AssetTemplate`-relocated-to-`shared` addition,
   closing VR-8010's F1 finding; FS-108 had stated "no new interface," which was incorrect.

None of these were unauthorized drift — each was disclosed in its originating package's own
Deviation note and independently judged reasonable by that package's verification pass. GDS-09
itself has not yet been formally updated to reflect any of the five (tracked as BL-0052, Low,
non-blocking documentation debt).

## Residual risks

Carried from `10-integration-review`'s findings, none Critical/High:

- **BL-0051 (Medium) — the MVP has never been run end-to-end as a real deployed process.**
  `server/src/index.ts` remains a scaffold (`export {}`) — no package has bootstrapped a real
  `WebSocketServer` wrapping actual sockets into the `Connection` interface (BL-0038) — and
  `server/dist/` does not contain the content JSON `loadContent.ts` reads at runtime (BL-0027,
  re-confirmed reproducing by this session: `find server/dist -name "*.json"` returns nothing).
  **This is the one risk this assessment weighs as directly bearing on whether "MVP" can be
  certified playable.** Every package's own tests exercise the real engine/transport/client logic
  against fake connections and JSDOM, which is why 98/98 tests pass and the logic is genuinely
  verified — but nobody has yet started this server process and connected a real browser to it.
  "All logic verified" and "a human can sit down and play a game" are not the same claim, and only
  the first is true today.
- **BL-0050 (Medium)** — 6 of 8 `FS-###` docs' `Implemented by:` metadata lines are stale
  (say "awaiting verification" for packages now `VERIFIED`). Pure documentation lag, zero
  behavioral impact.
- **BL-0049 (Low)** — `engageAction.ts` never checks `chainRoles` for `'engage'`; the client's
  legality pre-filter does. Confirmed not to cause an NFR-4200 violation (client only ever hides a
  category the server would still accept). A real but cosmetic-severity cross-package asymmetry.
- **BL-0052 (Low)** — GDS-09 documentation lag across the 5 deviations above.
- **BL-0039 (Medium, pre-existing)** — no visual styling (CSS/layout/ZabOW-reference palette) was
  authored; components render semantic markup and `data-testid` hooks only. FS-108's own
  Verification Plan treats this as a Demonstration-scoped criterion, correctly left unchecked
  rather than falsely claimed — but it means the MVP, even once playable per BL-0051, would not
  yet visually resemble the confirmed ZabOW reference.
- **BL-0017 (pre-existing, already tracked)** — every asset-type/effect numeric value (AP costs,
  timings, effect durations) is honestly labeled provisional pending `02-research-domain`'s R-1xx
  doctrinal grounding. Gameplay-shape risk, not a code-correctness risk.

No Critical or High residual risk is open. Every Medium/Low item above has a named owner and a
disposition already recorded in `docs/pipeline/backlog.md`.

## Assessment

**GO, with two residual risks explicitly flagged for the owner's awareness, not as blockers:**

- All 8 promised Features, across 11 packages, are delivered, independently verified (4 genuine
  bugs — 1 Critical, 3 High — caught and fixed along the way, evidence the verification discipline
  is doing real work), and integration-reviewed clean.
- The one risk this assessment weighs most heavily — **BL-0051, that nobody has yet run this as a
  real server a human could connect to** — is real and worth the owner's explicit acknowledgment,
  but it is a small, well-scoped, already-planned follow-up (a bootstrap package), not evidence of
  a design or correctness defect in anything that has been built. Recommending GO does not mean
  recommending skipping that follow-up before anyone actually attempts to play.
- BL-0039 (no visual styling) means a GO here certifies the MVP's *logic and architecture*, not
  its visual fidelity to the ZabOW reference — that is a distinct, already-tracked, Demonstration-
  scoped follow-up.

**This recommendation is advisory.** The actual release decision (G4) is the owner's — this
assessment is the evidence brought to that decision, not a substitute for it.

## Baseline update

**Not yet applied.** Per this skill's own rule, the baseline (the release plan's bucket state,
`CLAUDE.md`'s status line if one existed, affected `INDEX.md` files) is flipped only after the
owner's explicit GO. This section will be completed once that GO is given.
