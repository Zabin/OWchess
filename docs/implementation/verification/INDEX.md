# Verification Reports — Index

- **Owned by:** `09-package-verification` · **Status:** first entry authored 2026-08-22.

| VR | Package | Date | Result | Headline findings |
|---|---|---|---|---|
| [VR-0010](VR-0010-project-scaffold.md) | IP-0010 (Project Scaffold & Shared Types) | 2026-08-22 | **VERIFIED** | Build/test/dev gates independently reproduced clean; 3 Low/Medium findings (stale `NFR-5003`→`NFR-5300` ID in the package's Requirements Covered field; per-type GDS citation style gap; project-wide RTM lag) — none blocking. |
| [VR-1010](VR-1010-session-turn-lifecycle.md) | IP-1010 (Session & Turn Lifecycle) | 2026-08-22 | **RETURNED** | Critical: `SessionStore.createSession` issues sequential, guessable IDs (`session-1`, `session-2`, …) — violates NFR-3200 and FS-101 Acceptance Criterion 1; no test would catch it. Medium: RTM rows for NFR-2100/2200/3200/6100 left `UNASSIGNED` despite being in Requirements Covered. Low: BL-0021's Deviation note overstates GDS-07's silence on Destroy's mechanism; DoD's "16 tests" claim conflates this package's own tests with the (24-test) full suite. |
