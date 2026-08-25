# Docs — Master router

All prose documentation for **OW Chess**, organized by pipeline stage (see
[`.claude/skills/README.md`](../.claude/skills/README.md) for the pipeline itself). Every
directory has its own `INDEX.md`; statuses live there, kept in sync by the owning skill.

This pipeline is adapted from a separate reference project (`ZabGBCprocgenMusic`) — see
`docs/master/MSTR-001-program-vision.md` §0 for exactly what's reused (process pattern only) vs.
built fresh. This is a from-scratch increment — there is no shipped code yet, so every index below
starts `⛔ Planned` except what this bootstrap run has authored.

**Current gate:** `01-vision` closed 2026-08-21 — the owner confirmed standalone scope (OQ-01),
strict-alternating turns (OQ-01b), and MVP-first scope (OQ-09), and delegated the tech-stack
choice (OQ-02) to `03-architecture-design-synthesis` rather than confirming the SOR's candidate
stack outright. See
[`docs/architecture/strategic-assumptions-register.md`](architecture/strategic-assumptions-register.md)
for full detail and the remaining open items (OQ-04–08, OQ-10), which were never gating and
proceed to their named downstream stage as scoped.

| Directory | Contents | Owning skill(s) |
|---|---|---|
| [`pipeline/`](pipeline/pipeline-journal.md) | The manager's journal ([pipeline-journal.md](pipeline/pipeline-journal.md)) and backlog ([backlog.md](pipeline/backlog.md)) | `00-pipeline-manager`, `00-intake` |
| [`master/`](master/INDEX.md) | Program-level MSTR documents (vision, governance, …) | `01-vision` (+ `03`) |
| [`research/`](research/INDEX.md) | Research encyclopedia (R-###), grounding SDA/counterspace vocabulary in `ZabSpaceExercise`'s research corpus | `02-research-*` |
| [`architecture/`](architecture/INDEX.md) | The GDS-00…10 ladder, ADS clusters, ADRs, assumptions register | `03-architecture-design-synthesis` (+ `01-vision` for GDS-00) |
| [`requirements/`](requirements/INDEX.md) | FR/NFR baselines, Requirements Review, RTM | `04-requirements-engineering` |
| [`feature-planning/`](feature-planning/INDEX.md) | Release plan, epic/feature catalogs, dependency graph, feature review | `05-feature-decomposition` |
| [`features/`](features/INDEX.md) | Full Feature Specifications (FS-###) | `06-feature-specification` |
| [`implementation/`](implementation/) | Master Build Plan, work breakdown, packages (IP-####), verification reports (VR-####) | `07-implementation-planning`, stage-08 peers, `09-package-verification` |
| [`reviews/`](reviews/) | Content reviews, integration reviews, release assessments | `09-content-review`, `10-integration-review`, `11-release-readiness` |

Repo-root working docs (`CLAUDE.md`, developer quick-reference) are added once `03`/`08` need them.
