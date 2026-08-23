# Integration Review — Remediation Tranche {IP-9038, IP-9056}

**Reviewed commit:** `b8ec3bd`
**Scope:** IP-9038 (Real Server Bootstrap — VERIFIED via [VR-9038](../implementation/verification/VR-9038-server-bootstrap.md)) and IP-9056 (King-Deployment Wire Exposure — VERIFIED via [VR-9056](../implementation/verification/VR-9056-king-deployment-wiring.md)). Both packages sit outside the original 11-package MVP dependency graph and were authored/executed *after* `docs/reviews/integration-review-mvp-tranche.md` already closed clean — this is the first integration review to see the transport/session-bootstrap seam these two packages jointly created, since neither package existed when the original MVP tranche was reviewed.

Both packages confirmed `VERIFIED` on `docs/implementation/00-master-build-plan.md` before this review began.

## Evidence — G5 gates

- `npm run build` (root workspace script) — clean across `shared`, `server`, `client`. `client` build additionally ran `vite build` successfully (152.62 kB bundle).
- `npm run test` (root workspace script) — **113/113 tests green**, independently counted: `shared` 1, `server` 88 (18 files, including `kingDeploymentFlow.test.ts` and `sessionApi.test.ts`), `client` 24 (7 files, including `KingDeploymentPicker.test.tsx`).

## Dimension 1 — Interface consistency

Read `server/src/transport/websocketServer.ts` end to end (the seam both packages touch) and `shared/src/messages.ts`'s full message union.

- `handleConnection`'s three-way initial-send branch (`!hasSessionRecord` → rejection; `getDeploymentStatus(...).phase === 'deploying'` → `DeploymentStatusMessage`; else → the pre-existing `broadcastToOne` path) composes cleanly with the already-VERIFIED `StateDeltaMessage`/`computeOpponentView` flow — the "active" branch is untouched code, reached only once `SessionStore` itself reports a real `SessionState`.
- `handleDeployKingMessage` calls the pre-existing `store.submitKingDeployment` (IP-1010, unmodified) and then branches on the *same* `getDeploymentStatus` result used by the connection handler — a single accessor, not two divergent notions of "is this session active yet."
- `TemplateCatalogMessage`'s new `missionSets` field (public catalog data) and `DeploymentStatusMessage` (per-player secrecy-scoped status) are structurally distinct types with no overlapping fields — confirmed by reading both interface declarations in `shared/src/messages.ts`, not just the tests.
- IP-9038's HTTP/WS upgrade handler (`server/src/index.ts`) is unmodified by IP-9056 and still the sole entry point `handleConnection` is reached through — no second, competing connection path was introduced.

**Result: consistent, no interface mismatch found.**

## Dimension 2 — Invariant sweep

- **Server authority.** `SessionStore.getDeploymentStatus`/`hasSessionRecord`/`getJoinedPlayerIds` are read-only accessors over server-held state; no new code path accepts a client-supplied belief-state or deployment-status value. `handleDeployKingMessage` only accepts a client's own `missionSetId`/`regime` *choice*, which `submitKingDeployment` (pre-existing, IP-1010) independently validates server-side.
- **Fog-of-war non-leakage.** Confirmed directly by reading `SessionStore.getDeploymentStatus`'s implementation (`server/src/engine/SessionStore.ts`): its return type is `{ phase, ownDeployed, opponentDeployed }` — no field can carry a selection. Every one of `DeploymentStatusMessage`'s three construction sites in `websocketServer.ts` (lines 104, 149, and the pre-active branch) spreads only this accessor's return value. This was independently re-derived here from the code, not merely re-cited from VR-9056.
- **Turn alternation.** Unaffected — `handleDeployKingMessage` operates entirely in the pre-`'active'` phase; once `phase === 'active'`, control passes to the pre-existing, unmodified `broadcastStateDelta`/`TurnManager` path.
- **One-job-per-module.** `websocketServer.ts` gained two new functions (`broadcastDeploymentStatus`, `handleDeployKingMessage`) but no new responsibility class — both are transport-layer message handlers, consistent with every other function in the file.
- **ID namespace collisions.** N/A — no new mission-set/asset-type/effect IDs were introduced by either package; `listMissionSetTemplates()` surfaces existing content unchanged.

**Result: all load-bearing invariants hold across the pair.**

## Dimension 3 — Behavioral coherence

No divergent implementation of the same behavior was found: there is exactly one code path that transitions a session from "deploying" to "active" (`submitKingDeployment` → `getDeploymentStatus` check → `broadcastStateDelta` or `broadcastDeploymentStatus`), and exactly one code path that renders that transition (`main.tsx`'s Landing → `KingDeploymentPicker` → `App` gating on `state.ownState`/`state.deploymentStatus`). No workflow dead-ends: a King deployment always produces either a `deployment-status` update or a `state-delta` — never a silent drop.

**Result: coherent.**

## Dimension 4 — Traceability coherence

Cross-checked `docs/implementation/00-master-build-plan.md`, `docs/implementation/packages/INDEX.md`, `docs/implementation/verification/INDEX.md`, and `docs/requirements/04-requirements-traceability-matrix.md` against each other and against the tree:

- All four tell the same story: IP-9038 and IP-9056 both `VERIFIED`, both dated 2026-08-23, both cross-linking to their VRs.
- FR-1210/FR-1220's RTM rows correctly cite both `IP-1010` (logic) and `IP-9056` (wire exposure), and both `TurnManager.test.ts` and `kingDeploymentFlow.test.ts`.
- **Confirmed BL-0059 (Low, already on the backlog, not new):** FR-1230's RTM row cites only `IP-1010`/`SessionStore.test.ts` — it does not also cite `kingDeploymentFlow.test.ts`'s fourth test (the live re-deployment-rejection check), even though that test now exercises FR-1230 at the wire level too. This is a traceability *completeness* gap, not a *correctness* one — the row's existing citations are accurate, just incomplete. Not an integration defect; the package that introduced the new test never promised this row (it promised only FR-1210/1220's rows). No action required here beyond what's already tracked.
- **Confirmed BL-0060 (Low, already on the backlog):** grepped `docs/features/FS-101-session-turn-lifecycle.md` for any IP-9038/IP-9056 cross-reference — none found. The package text promised a metadata note there; it was never added. This is a doc-hygiene gap, not a behavioral or interface defect — FS-101's actual content (the W1/W2 workflows) is still accurate to what shipped.
- **Confirmed BL-0061 (Low, already on the backlog):** `client/src/__tests__/AssetTray.test.tsx`'s fixture touch is exactly the 1-line addition of a required `missionSets: []` field, mechanically forced by the `TemplateCatalogMessage` interface change — verified by reading the diff; no behavior in `AssetTray.tsx` itself changed.
- **Re-checked BL-0057** (WS-upgrade validates only param presence, not store-validity): still correctly non-blocking. Traced the actual runtime sequence — an upgrade with a bogus `sessionId` still succeeds at the socket level, but `handleConnection`'s very next statement (`!store.hasSessionRecord(sessionId)`) sends an explicit `action-rejected` message before any other message type could be misinterpreted as valid. BL-0056's closure changes nothing about this: the rejection path was already reachable pre-IP-9056 and remains the only outcome for a bogus session, deploying or not.
- **Re-checked BL-0058** (FR-9410/FR-9420 RTM rows left `UNASSIGNED`): still correct — the training corpus has not yet been authored.

**Result: coherent. No new traceability defect found; all three fresh Low findings and both carried-forward Low findings confirmed as reported, none reclassified.**

## Dimension 5 — Documentation coherence

No `CLAUDE.md` or `memory.md` exist yet in this project (first-run status, consistent with the project's own vision-stage note that no as-built baseline exists) — this dimension reduces to the `INDEX.md` files audited under Dimension 4, which are consistent with each other and with the tree.

**Result: consistent (no doc drift to correct).**

## Findings

No new findings. All five previously-filed Low findings tied to this tranche (BL-0057, BL-0058, BL-0059, BL-0060, BL-0061) were independently re-derived here and confirmed non-blocking, correctly scoped, and correctly dispositioned on the backlog already — none is an integration defect and none is reclassified by this review.

| Finding | Packages/artifacts involved | Description | Severity | Recommended owner |
|---|---|---|---|---|
| (none) | — | Clean review — see dimension sections above for what was exercised. | — | — |

## Conclusion

The {IP-9038, IP-9056} remediation tranche integrates cleanly with the already-VERIFIED MVP tranche and with each other. The transport/session-bootstrap seam these two packages jointly created — the first seam in this project ever exercised by a real client from a cold process start — holds every load-bearing invariant (server authority, fog-of-war non-leakage, turn alternation) and introduces no interface mismatch, behavioral divergence, or traceability break. The game is genuinely, verifiably playable end-to-end by a real client for the first time in this project's history.
