# R-203 — Mapping continuous orbital state to OW Chess's discrete regime/plane-class taxonomy

- **Status:** ✅ DONE, 2026-08-21 · **Owned by:** `02-research-orbital-and-tooling`
- **Dependencies:** none authored yet (R-201/R-202 planned; this topic states the minimum
  Kepler/J2 facts it needs inline rather than waiting on them)
- **Referenced by:** GDS-04 (`docs/architecture/04-domain-model.md`, OQ-13), GDS-07 (Data Model,
  pending) · **Resolves:** BL-0003 / OQ-13

## 1. Purpose

GDS-04 (Domain Model) defined `OrbitalRegime` as "a named altitude band crossed with a small
number of inclination/plane classes" but explicitly deferred the exact count (OQ-13), since SOR
§14 requires that taxonomy to be grounded in research, not guessed. This topic supplies that
grounding: which altitude bands and plane classes are real, doctrinally/physically meaningful
distinctions (not arbitrary slicing) that `Propagator` can map continuous orbital elements onto
losslessly enough for gameplay, and that GDS-07 can turn into a concrete enum.

## 2. Scope

In scope: altitude-band boundaries with real operational meaning; plane-class distinctions that
matter for *access* (what a sensor/effector can reach or observe), matching this project's F2T2E
find→fix→track→target chain. Out of scope: full orbital-element precision, eccentricity/argument-
of-perigee detail (the hybrid-fidelity requirement, SOR §7.6, keeps these internal to
`Propagator`, never player-facing), and any specific numeric AP/cost tuning (OQ-05/06/10 remain
`04`/`06`'s job).

## 3. Concepts

### 3.1 Altitude bands (LEO/MEO/GEO-analog)

Three altitude bands are standard, operationally meaningful divisions, not an arbitrary choice:
**LEO** (Low Earth Orbit, roughly 300–2,000 km altitude), **MEO** (Medium Earth Orbit, roughly
2,000–35,786 km), and **GEO** (Geostationary Earth Orbit, ~35,786 km, the altitude at which
orbital period matches Earth's rotation) [Symmetry Electronics, LEO vs MEO vs GEO Satellites,
accessed 2026-08-21]. These three bands are exactly the ones SOR §7.6 already names ("LEO/MEO/
GEO-analog") — this topic confirms they are real, non-arbitrary divisions (each has genuinely
different orbital period, coverage footprint, and access-window character), not merely a
convenient label set.

### 3.2 Plane classes (inclination-based)

Three inclination-based classes are real, operationally distinct choices satellite designers
actually make, each with a different access/coverage character relevant to this game's find-fix-
track-target chain:

- **Equatorial** (inclination ≈ 0°) — orbital plane aligned with Earth's equator; a satellite here
  has a fixed relationship to equatorial ground sites and (at GEO altitude specifically) can be
  geostationary.
- **Prograde-inclined** (a moderate inclination, neither near-0° nor near-90°) — the general-
  purpose case; covers a band of latitudes wider than equatorial but without the polar-orbit
  ground-track properties below.
- **Polar / sun-synchronous-analog** (inclination ≈ 90°, or, for a real sun-synchronous design,
  slightly retrograde — inclinations around 96°–100° at LEO altitudes, chosen so J2-driven nodal
  precession matches Earth's ~0.9856°/day revolution around the Sun) [J2 nodal precession formula
  Ω̇ = −(3/2)·n·J₂·(Rₑ/p)²·cos(i), where J₂ ≈ 1.08263×10⁻³ is Earth's oblateness coefficient — True
  Geometry, *Calculating Inclination Drift Rates for Sun-Synchronous Orbits*, accessed 2026-08-21].
  A polar/near-polar orbit passes over every latitude band over time, giving global coverage at
  the cost of not staying over any one region continuously — the real reason SOR's own worked
  example (Appendix B) puts an ISR King in "a Sun-synchronous-analog polar regime" for favorable
  imaging geometry.

### 3.3 Why J2 is what makes the polar/sun-synchronous class real, not cosmetic

Without J2 (pure two-body Kepler), every inclination would behave identically except for which
latitudes it passes over — there would be no physical reason to single out ~98° as special. J2
perturbation (Earth's equatorial bulge) causes the orbital plane's ascending node to precess at a
rate depending on inclination and altitude; only near-polar, retrograde inclinations at LEO
altitudes produce a precession rate that matches the Sun's apparent yearly motion, which is
*why* sun-synchronous orbits are a real, named, physically-motivated orbit class and not an
arbitrary one [NASA Technical Reports Server, *Analysis of the Effects of Mean Local Node-Crossing
Time on the Evolution...*, accessed 2026-08-21]. This is the concrete justification for treating
"polar/sun-synchronous-analog" as one of this game's plane classes rather than lumping all
non-equatorial inclinations together — the distinction is physically real, not just a gameplay
label, and is exactly the kind of "chess-legible but doctrinally grounded" distinction MSTR-001's
G-3 goal calls for.

## 4. Operational Context

Not every altitude-band × plane-class combination is operationally distinct in practice — a GEO
polar orbit, for instance, is physically unusual (GEO's entire practical value is *being*
equatorial-and-geostationary; a GEO-altitude polar orbit is not geostationary and has little
real-world precedent). This project does not need to forbid combinations the real world rarely
uses (the fictional-assets-only scope, SOR §5.2, means "would a real operator actually choose
this" is flavor, not a hard rule), but the taxonomy below is ordered so the *common, doctrinally
recognizable* combinations (equatorial-GEO for SATCOM/comms relay; polar/sun-synchronous-LEO for
ISR) are the ones the v1 mission-set roster (GDS-04) actually gravitates toward, matching SOR
Appendix B's own worked example.

## 5. Implementation Guidance

- **Recommended v1 taxonomy: 3 altitude bands × 3 plane classes = 9 named regimes** (e.g.
  `LEO-EQUATORIAL`, `LEO-PROGRADE`, `LEO-POLAR`, `MEO-EQUATORIAL`, ... `GEO-POLAR`), each a fixed
  label `Propagator` maps continuous elements onto for presentation. This is a **recommendation
  for `04-requirements-engineering`/`06-feature-specification` to formally adopt**, not a locked
  decision this research-tier topic can make on its own (per this pipeline's own write-scope rule)
  — but it is now a grounded, non-arbitrary recommendation rather than an open guess.
- **`Propagator` must own the continuous→discrete mapping** (GDS-03's boundary): given a true
  inclination/altitude pair, classify into the nearest of the 9 labels using fixed, documented
  thresholds (e.g., inclination bands centered on 0°/45°/90°, altitude bands as in §3.1) — this
  classification logic lives entirely inside `Propagator`, never duplicated in `GameEngine`,
  `BeliefState`, or the client, per FR-5002/FR-5005.
- **Do not expose raw inclination/altitude numbers past the `Propagator` boundary** — only the
  9-value discrete label, matching FR-5002's "discrete regimes, not raw orbital elements"
  requirement exactly.
- **Maneuver-target selection (SOR §7.2's "maneuver" action) should offer the 9 labels as the
  selectable target set**, not a continuous slider — this is what makes maneuver decisions
  "chess-legible" per SOR §7.6.
- **Do not silently drop the equatorial/GEO or polar/LEO combinations as somehow more "correct"
  than others** — all 9 should be legal targets for any asset whose maneuver budget can reach
  them; realism constrains *flavor* (mission-set affinity, per SOR §7.4's "different orbital-
  regime affinity" requirement for King placement) not *legality*.

## 6. Feature Mapping

Grounds: GDS-04 `OrbitalRegime` entity (resolves OQ-13's open taxonomy question with a concrete
9-value recommendation); GDS-07 (Data Model, pending) — the `OrbitalRegime` enum/type should use
this 9-value set as its starting point; `06-feature-specification` — any FS touching maneuver
target selection or King-placement regime choice should cite this topic rather than re-deriving
the taxonomy.

## 7. Related Topics

R-201 (Keplerian elements) and R-202 (J2 perturbation) are the fuller general grounding this topic
draws its inclination/precession facts from in condensed form; both remain `PLANNED` and should be
authored before `Propagator`'s actual implementation (07/08) needs the full two-body/J2 equations
of motion, not just this topic's classification-level facts. R-204 (`Propagator` interface
boundary) should cite this topic's §5 guidance directly when it specifies the interface's exact
method contract.

### Sources

- Symmetry Electronics, *LEO vs MEO vs GEO Satellites*, https://www.symmetryelectronics.com/blog/leo-vs-meo-vs-geo-satellites/ (accessed 2026-08-21)
- True Geometry, *Calculating Inclination Drift Rates for Sun-Synchronous Orbits*, https://blog.truegeometry.com/calculators/sun_synchronous_orbit_inclination_calculation_for_Calculations.html (accessed 2026-08-21) — J2 nodal-precession formula and the ~98° sun-synchronous inclination figure. **Single-source for the exact formula coefficients** — cross-verify against a primary astrodynamics reference (e.g. Vallado, *Fundamentals of Astrodynamics and Applications*) before this formula is used for anything beyond taxonomy justification (i.e., before `Propagator`'s actual numerical implementation).
- NASA Technical Reports Server, *Analysis of the Effects of Mean Local Node-Crossing Time on the Evolution of Sun-Synchronous Orbits*, https://ntrs.nasa.gov/api/citations/19930015517/downloads/19930015517.pdf (accessed 2026-08-21)
