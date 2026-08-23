---
name: 08-training-manual-authoring
description: Author and update the player-facing training corpus under docs/training/ — the install-and-run walkthrough, the interface guide, the first-full-game walkthrough with real screenshots, and the bidirectional feature ⇄ manual traceability matrix — against the FR-9000/NFR-10000 requirements baseline and the shipped, VERIFIED behavior of the actual OW Chess application. Use when asked to "write/update the manual," "document this feature for players," "add screenshots to the training corpus," "update the traceability matrix," or when a manual-impact finding (a feature changed and its mapped sections are stale) needs working off. A Stage 08 peer of 08-code-implementation: it executes training-artifact work the way 08 executes code packages — but it writes ONLY docs/training/ and docs/manual/ (plus that theme's tracker rows), never production code, never requirements/specs, and it documents as-built, VERIFIED behavior only — a capability that hasn't shipped doesn't get manual prose. OW Chess has one shared player-facing corpus, not per-role manuals (unlike the sibling ZabSpaceExercise project this pattern is modeled on, which needs White/Blue/Red-scoped manuals for its facilitated multi-cell exercise) — both players see the same interface and the same instructions.
---

# Training Manual Authoring

Executes **training-corpus work** — the player-facing manual under
[`docs/training/`](../../../docs/training/INDEX.md) plus its screenshots under
[`docs/manual/`](../../../docs/manual/INDEX.md) — as a Stage 08 peer of `08-code-implementation`.
The training corpus is a co-equal product with the code (MSTR-001 C10, owner decision
2026-08-23); this skill is how that product gets built and kept current.

## What this is for (and what it is not)

Three kinds of run:

1. **Feature-driven update** (the common case): a code change touched player-visible behavior;
   the `training/06` traceability matrix names the affected sections; this skill brings them —
   prose, `> Sources:` footers, matrix rows — back to as-built truth (FR-9320).
2. **Coverage work**: a capability shipped without manual coverage (an FR-9110 gap), or a new
   module is needed.
3. **Screenshot work**: the install/run bootstrap (BL-0038/BL-0027) has landed, or the UI changed
   visibly — real screenshots are captured from the actual running application via Playwright
   (pre-installed in this environment; see `PLAYWRIGHT_BROWSERS_PATH` in the environment notes)
   against a real running server, never mocked or hand-drawn.

It SHALL NOT write production code, edit requirements/specs/architecture (gaps route upstream via
their owning skill), or document unshipped/not-yet-`VERIFIED` behavior (FR-9310). If a pass
discovers the *code* is wrong rather than the manual, that's a bug — route it to `00-intake`,
don't paper over it in prose.

## Scope (what this skill owns)

- Every module under `docs/training/` including its traceability matrix, plus `docs/training/
  INDEX.md`.
- Screenshots under `docs/manual/` (plus `docs/manual/INDEX.md`'s captions) — captured via a
  Playwright script driving the real running app, saved as PNGs, never generated any other way
  (NFR-10200).

## Corpus layout (single shared corpus — no per-role split)

OW Chess is symmetric: both players see the identical interface and action set, so there is no
White/Blue/Red-style role split to design around. The corpus is organized by **onboarding
sequence**, not by role:

| Module | Contents | Satisfies |
|---|---|---|
| `01-install-and-run.md` | Zero-prior-experience install: git clone, Node.js install, `npm install`, build, run — Windows/macOS/Linux, every command verbatim, common failure modes named with fixes. | FR-9410 |
| `02-interface.md` | The six-panel layout at a glance (orbital board, action menu, asset tray, mission/King status, intel panel, event log) — what each panel shows and where it comes from. | FR-9110 |
| `03-first-game.md` | One complete example game start to finish — session creation, King deployment, a full F2T2E cycle (task → precision advances → engage), a win condition firing — with a real screenshot at every step. | FR-9420 |
| `04-actions-reference.md` | Every action a player can take (deploy, task, maneuver, engage, pass, resign), its AP cost, and its legality preconditions. | FR-9110 |
| `05-troubleshooting-and-glossary.md` | Common issues (connection lost, port in use, browser compatibility) + a glossary of every SDA/F2T2E term the UI uses. | FR-9110, NFR-10100 |
| `06-manual-traceability.md` | The bidirectional feature ⇄ manual-section index. | FR-9210 |

Right-sizing and exact module boundaries follow the requirements baseline and what's actually
shipped, not this table rigidly — split a module that exceeds NFR-10100's ~300-line cap, merge
two that turn out thin. Record any layout change in the same pass as a note in `06`.

## Inputs (read before writing)

The FR-9000 family + NFR-10000 (`docs/requirements/01`/`02`) — the requirements this corpus must
satisfy; `06-manual-traceability.md` (once it exists) — the index this skill maintains in both
directions; MSTR-001 C10/§2/§9.2 and GDS-00's training-corpus section (audience: adults
interested in wargaming, not necessarily technical — SOR §2); the shipped, `VERIFIED` behavior
itself (read the actual code for anything prose claims; drive the real running app via Playwright
for any interactive flow you haven't personally observed this session — never describe a UI
element you haven't actually seen render).

## Workflow

1. **Establish the target.** From the invoker, a manual-impact finding, or a `06` lookup for
   recently `VERIFIED` packages: the exact sections in scope. Verify against FR-9000 which leaf
   the work serves.
2. **Verify as-built behavior** for everything the prose will claim — code reading at minimum, a
   live drive via Playwright against the real running server for any UI flow. Manuals describe
   what ships and is `VERIFIED`, not what specs promise (FR-9310).
3. **Write/update the content** to the corpus conventions: modules single-topic and ≤300 lines
   (NFR-10100, split when exceeded); plain language, domain jargon defined on first use or
   glossary-linked; every section ends with a `> Sources:` footer naming its backing code/FR IDs
   (FR-9120).
4. **Capture real screenshots** where the module calls for one: launch the real server (per
   `01-install-and-run.md`'s own instructions — dogfood them), drive the client with Playwright
   (Chromium, pre-installed) to the documented state, save a PNG under `docs/manual/`, caption it
   in `docs/manual/INDEX.md`. Never use a mockup, wireframe, or hand-edited image (NFR-10200).
5. **Update the traceability matrix in both directions** (FR-9210) in the same change set — never
   "in a follow-up."
6. **Update `docs/training/INDEX.md`** and `docs/manual/INDEX.md` rows to match the files on disk.
7. **Run the checkable slice**: nothing in this corpus is currently machine-verified beyond link
   resolution and `> Sources:` path existence (FR-9110/9120's own Verification Method is
   Inspection) — spot-check both on everything edited.

## Quality gate (before calling a run done)

- [ ] Every claim in touched prose matches behavior verified this run (code reading or a live
      Playwright drive against the real running app).
- [ ] Every touched section's `> Sources:` footer is current; matrix forward + reverse rows
      agree; no dangling section ID anywhere in the matrix.
- [ ] Module size/audience conventions held (NFR-10100); every domain term defined/linked at
      first use.
- [ ] Every screenshot is a genuine Playwright capture of the real running app at the documented
      step (NFR-10200) — none mocked or hand-drawn.
- [ ] INDEX rows (both `docs/training/` and `docs/manual/`) match the files on disk.
- [ ] Nothing outside `docs/training/`/`docs/manual/` (+ their tracker rows) was written.

## Pipeline position & completion summary (mandatory, every run)

This skill is a **Stage 08 peer** (artifact execution) of the documentation-driven-development
pipeline (see [`.claude/skills/README.md`](../README.md)). Upstream: the FR-9000/NFR-10000
requirements baseline (04), and whatever code change created the manual impact
(08-code-implementation). Downstream: `09-training-manual-review` independently reviews this
skill's output — this skill never reviews its own same-session work.

End **every** invocation with a chat summary containing exactly these three parts:

1. **What changed** — modules/sections written or updated, screenshots captured, matrix rows
   moved, which FR-9xxx/NFR-10xxx leaves the work served.
2. **Recommendations** — code bugs found (→ `00-intake`), requirements gaps (→
   `04-requirements-engineering`), anything the corpus needed that the shipped app doesn't yet
   support.
3. **Next step** — normally `09-training-manual-review` on the touched scope; name anything else
   that must land first (e.g. a real server bootstrap must exist before any screenshot work can
   start at all).

Never end a run without naming the next step — the pipeline is driven one stage at a time, and
the owner relies on each stage's summary to know what to invoke next.
