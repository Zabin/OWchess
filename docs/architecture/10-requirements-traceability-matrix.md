# GDS-10 — Requirements Traceability Matrix (level)

- **Owned by:** `03-architecture-design-synthesis` · **Status:** ✅ Authored, 2026-08-21 ·
  **Grounds:** `docs/requirements/` (the full RTM lives there once `04` assigns `FR-####`/
  `NFR-####` IDs)

The final ladder level. States **how traceability is carried** through this project's artifacts —
not the matrix itself (that's `04-requirements-engineering`'s deliverable, since it needs final
`FR-####`/`NFR-####` IDs that don't exist yet).

## The traceability chain, as this architecture pass has actually produced it

```
SOR §7-§9  ──>  GDS-01..04 (concept/context/architecture/domain)
                     │
                     ├──> GDS-05 (capability groups)  ──>  04: FR-####
                     └──> GDS-06 (NFR groups)          ──>  04: NFR-####
                     │
GDS-04/07 (entities/schema) ──> GDS-09 (interface contracts) ──> 07: IP-#### (module-scoped)
                     │
GDS-08 (presentation) ──> 06: FS-### (feature specs, UI-touching features)
                     │
R-203 (research) ──> GDS-04 (OrbitalRegime taxonomy) ──> GDS-07 (schema) ──> GDS-09 (interface)
```

Every `FR-####`/`NFR-####` `04` writes should cite which GDS-05/06 capability/NFR group it
elaborates (already stated in those documents' own tables) and, where applicable, which R-1xx/
R-2xx research topic grounds it — R-203 is the first such citation on record (grounds GDS-04's
`OrbitalRegime` entity, which GDS-07/09 build on).

## What this level confirms is traceable, end to end (a spot-check, not the full matrix)

| SOR requirement | GDS trace | Status |
|---|---|---|
| FR-5005 (`Propagator` interface) | GDS-03 (module) → GDS-09 (`interface Propagator`) | Fully traced, concrete contract exists |
| NFR-2001 (fog-of-war non-leakage) | GDS-06 (security NFR) → GDS-07 (`OpponentView` type) → GDS-08 (client can't accept `PlayerState`) → GDS-09 (`computeOpponentView` sole constructor) | Fully traced, enforced at type + interface level, not just prose |
| FR-1009 (strict turn enforcement) | GDS-01 (turn loop) → GDS-03 (`TurnManager`) → GDS-09 (`submitAction` rejection contract) | Fully traced |
| SOR §7.6 (hybrid orbital fidelity) | GDS-01 → GDS-03 (`Propagator` boundary) → R-203 (regime taxonomy) → GDS-04/07/09 | Fully traced |
| OQ-05/06/07/10 (numeric tuning) | Explicitly NOT traced to a GDS level — correctly deferred to `04`/`06` throughout; every GDS level that touched a numeric value marked it TBD rather than inventing one | Correctly absent, not a gap |

No orphaned SOR requirement was found during this architecture pass — every `FR-1xxx`–`FR-8xxx`/
`NFR-1xxx`–`NFR-6xxx` group in the seed SOR maps to a GDS-05/06 capability/NFR group (confirmed at
those levels' own merge gates).

## What `04-requirements-engineering` inherits concretely

- GDS-05's eight capability groups → source material for numbering individual `FR-####`s.
- GDS-06's NFR groups → source material for numbering individual `NFR-####`s.
- The full GDS-01–09 ladder as the "why" behind every requirement it writes — `04` should cite
  the specific GDS level/module/interface a requirement traces to, not just the SOR section.
- R-203 as the first research citation a requirement can point to (any `FR`/`NFR` touching
  `OrbitalRegime`).
- BL-0005 (deferred research gap, J2 formula cross-verification) — not `04`'s concern directly,
  but worth knowing it exists before any requirement implies a specific numerical propagation
  guarantee.

## Merge gate

- [x] Traceability chain diagram matches what GDS-01–09 actually produced (not aspirational).
- [x] Spot-check table confirms representative requirements trace end-to-end with no gaps.
- [x] Confirms OQ-05/06/07/10's absence from any GDS level is correct (deferred, not dropped).
- [x] No full RTM authored here — correctly deferred to `04`, which owns `FR-####`/`NFR-####` IDs.

**Merge decision:** this document is authoritative for *how* traceability flows through the
architecture tier; `docs/requirements/03-requirements-traceability-matrix.md` (once `04` authors
it) is authoritative for the actual per-requirement matrix.

**Gate:** closed 2026-08-21. **The full GDS-00–10 ladder is now authored and every gate closed.**
No new Open Questions. Next: `04-requirements-engineering` — formalize `FR-####`/`NFR-####` from
GDS-05/06, resolve OQ-05/06/07/10 (asset costs, win thresholds, session length/tiebreak, AP
cadence).
