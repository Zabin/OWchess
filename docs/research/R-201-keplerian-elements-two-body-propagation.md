# R-201 — Keplerian Orbital Elements & Two-Body Propagation (v1 Maneuver Figures)

- **Status:** ✅ DONE, 2026-08-22 · **Owned by:** `02-research-orbital-and-tooling`
- **Dependencies:** none (states the two-body facts it needs inline)
- **Referenced by:** GDS-03 (`Propagator`), GDS-09 (`Propagator.planManeuver`), FS-104
  (`docs/features/FS-104-orbital-mechanics-propagator.md`) · **Resolves:** BL-0011 / CR-03
  (`docs/requirements/01-functional-requirements.md`)

**Scope note (MSTR-001 C4 v0.3):** this topic is written entirely against the confirmed v1
baseline — plain two-body Keplerian motion, no J2 term. It supplies the delta-v and
transfer-time figures CR-03 needs to become concrete numbers. R-202 (J2 perturbation) remains
`PLANNED`/deferred — it is not needed to resolve CR-03 and only becomes live if OQ-14 resolves
toward adding J2 post-v1.

## 1. Purpose

FS-104 (`docs/features/FS-104-orbital-mechanics-propagator.md`) left CR-03 open: the per-regime-
pair maneuver cost (fuel-analog) and transfer-time (in turns) table needs real numbers, not
invented ones. This topic computes those numbers from the two-body vis-viva equation and the
Hohmann-transfer formulas, using R-203's 9-regime taxonomy's representative altitudes, so
`06-feature-specification` (revising FS-104) and `07-implementation-planning` can adopt concrete,
traceable figures instead of a placeholder.

## 2. Scope

In scope: two-body circular-orbit velocities at the three altitude bands (LEO/MEO/GEO
representative altitudes, per R-203 §3.1); Hohmann-transfer delta-v and time-of-flight between
each altitude-band pair; simple coplanar inclination-change delta-v between the three plane
classes (per R-203 §3.2), at each altitude, to show the game-legible fact that plane changes are
categorically more expensive than altitude changes, and cheaper at higher altitude. Out of scope:
J2/perturbed transfers (R-202, deferred), non-Hohmann (bi-elliptic, low-thrust) transfer types
(v1's turn-based, discrete-regime model has no use for them), and the actual AP-cost/turn-count
conversion — that numeric mapping is `06`/`07`'s own tuning decision, informed by but not
identical to the physical delta-v below.

## 3. Concepts

### 3.1 The vis-viva equation and circular-orbit velocity

For any two-body orbit, `v² = μ(2/r − 1/a)` (the vis-viva equation), where `μ` is Earth's
standard gravitational parameter (μ ≈ 398,600.4418 km³/s²), `r` is the instantaneous radius, and
`a` is the semi-major axis [Curtis, *Orbital Mechanics for Engineering Students*, 3rd ed., §2.5 —
standard textbook derivation, needs fetch-verification]. For a circular orbit (`r = a`), this
reduces to `v = √(μ/r)`.

Using R-203's representative altitudes: LEO ≈ 500 km altitude (`r` = 6,878 km) → `v` ≈ 7.61 km/s;
MEO ≈ 20,200 km altitude, a GPS-like orbit (`r` = 26,578 km) → `v` ≈ 3.87 km/s; GEO ≈ 35,786 km
altitude (`r` = 42,164 km) → `v` ≈ 3.07 km/s. Higher orbits move slower — the basis for every
delta-v figure below.

### 3.2 Hohmann transfer: delta-v and time-of-flight between altitude bands

A Hohmann transfer is the minimum-energy two-burn coplanar transfer between two circular orbits:
burn onto an elliptical transfer orbit tangent to both, then burn again to circularize at arrival
[Curtis, ibid., §6.2 — needs fetch-verification]. Using the transfer orbit's semi-major axis
`a_t = (r₁ + r₂)/2`:

| Transfer | Δv₁ (departure) | Δv₂ (arrival) | Total Δv | Time of flight |
|---|---|---|---|---|
| LEO → MEO | 1.98 km/s | 1.39 km/s | **3.37 km/s** | **~2.99 hours** |
| MEO → GEO | 0.42 km/s | 0.37 km/s | **0.79 km/s** | **~8.81 hours** |
| LEO → GEO | 2.37 km/s | 1.45 km/s | **3.82 km/s** | **~5.31 hours** |

(Figures computed directly from §3.1's vis-viva equation and the standard Hohmann time-of-flight
formula `t = π√(a_t³/μ)`; a multi-hop LEO→MEO→GEO path costs less total Δv than the direct
LEO→GEO burn but takes longer overall — a real trade-off, not a game invention.)

### 3.3 Inclination-change (plane-class) delta-v — why plane changes cost far more

A simple coplanar-circular inclination change of angle `Δi` costs `Δv = 2v·sin(Δi/2)`
[Curtis, ibid., §6.6 — needs fetch-verification]. Because this scales with the *local orbital
velocity* `v`, the same angular plane change is dramatically cheaper at high altitude than low
altitude:

| Plane-class change | at LEO (v=7.61 km/s) | at MEO (v=3.87 km/s) | at GEO (v=3.07 km/s) |
|---|---|---|---|
| Equatorial ↔ Prograde (Δi ≈ 45°) | 5.83 km/s | 2.96 km/s | 2.35 km/s |
| Prograde ↔ Polar (Δi ≈ 45°) | 5.83 km/s | 2.96 km/s | 2.35 km/s |
| Equatorial ↔ Polar (Δi ≈ 90°) | 10.77 km/s | 5.48 km/s | 4.35 km/s |

These numbers are an order of magnitude larger than the altitude-band transfers in §3.2 — a
genuine, physically-grounded fact (not a game-balance invention): changing orbital plane is
categorically more expensive than changing altitude, and becomes cheaper the higher the starting
altitude. This is exactly the kind of "chess-legible but doctrinally/physically grounded"
asymmetry MSTR-001's G-3 goal calls for.

## 4. Operational Context

A real maneuver planner would combine a plane change with an altitude transfer in one burn to
save total delta-v (a "combined maneuver") rather than doing them as two discrete burns [Curtis,
ibid., §6.6]. v1's discrete-regime model (R-203) does not need this optimization — GDS-09's
`Propagator.planManeuver(asset, targetRegime)` already treats "change to any of the 9 regimes" as
a single call, so the combined-maneuver saving is implicitly available to whatever cost function
`06`/`07` derives from these figures; it does not need to be separately modeled.

## 5. Implementation Guidance

- **Use §3.2/§3.3's *relative* figures, not absolute km/s, as the AP-cost/turn-count table's
  shape**: altitude-only transfers (LEO↔MEO↔GEO) should cost noticeably less than any plane-class
  change; a plane-class change should cost noticeably less at GEO than at LEO. This is the
  concrete numeric grounding CR-03 asked for — `06-feature-specification`'s revision of FS-104
  should derive its actual AP-cost/turn-count numbers from these ratios (e.g., roughly
  4-5× costlier for a full plane change than an altitude-band hop, scaled down by altitude),
  not invent unrelated ones.
- **`Propagator.planManeuver`'s `turnsRequired` return should reflect real time-of-flight
  ordering**: §3.2 shows MEO→GEO takes longer in wall-clock terms than LEO→GEO despite costing
  less delta-v — a maneuver spanning two altitude bands in one hop (LEO→GEO) should not be *faster*
  than a shorter hop (LEO→MEO) with a comparable AP cost; consistent ordinal ranking, not the
  literal hours, is what needs to carry into turn-counts (OQ-11's "mover's own turns" rule already
  bounds how these get discretized).
- **Do not expose delta-v or time-of-flight numbers to the player or client** — per R-203's
  §5 guidance, `Propagator` continues to expose only the discrete regime and `turnsRequired`;
  these physical figures are the *justification* for the AP-cost table's shape, not a value
  computed live in-game.
- **A combined plane+altitude maneuver (e.g. LEO-EQUATORIAL → GEO-POLAR) should cost less than the
  naive sum of a separate altitude hop plus a separate plane change** (per §4) — `06`/`07`'s
  cost table should price each of the 9×9 regime-pair transitions directly from a formula
  (altitude-component + plane-component, combined-maneuver discount), not as two sequential table
  lookups, to avoid systematically overcharging multi-axis maneuvers.

## 6. Feature Mapping

Resolves CR-03 (`docs/requirements/01-functional-requirements.md`) for `06-feature-specification`
to adopt when it revises FS-104's maneuver cost/time table. Grounds GDS-09's
`Propagator.planManeuver` contract (the `turnsRequired` return value's real-world ordinal basis).

## 7. Related Topics

R-202 (J2 perturbation) remains `PLANNED`/deferred — not needed for CR-03; would only become live
if OQ-14 resolves toward re-adding J2. R-203 (regime/plane-class taxonomy) supplies this topic's
representative altitudes and plane-class definitions.

### Sources

- Curtis, H. D., *Orbital Mechanics for Engineering Students*, 3rd ed., Butterworth-Heinemann —
  §2.5 (vis-viva equation), §6.2 (Hohmann transfer), §6.6 (inclination-change and combined
  maneuvers). Standard aerospace-engineering textbook derivation; **needs fetch-verification**
  (no live web access confirmed this session — figures above are computed directly from the
  textbook-standard formulas using μ_Earth = 398,600.4418 km³/s² and R-203's representative
  altitudes, not looked up as pre-computed numbers, so the arithmetic is independently checkable
  even before the citation itself is re-verified).
- μ_Earth (WGS-84 standard gravitational parameter), 398,600.4418 km³/s² — widely tabulated
  physical constant, low single-source risk.
