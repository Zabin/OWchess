# Kickoff Prompt — OW Chess

Paste everything below this line to Claude Code as your opening message in a fresh repository.

---

I want to build **OW Chess** — a two-player, turn-based, web-browser multiplayer strategy game built on space-domain-awareness and counterspace doctrine, played chess-style: each side secretly deploys a "King" satellite and wins by finding, tracking, and denying/destroying the opponent's King first. Turns are fixed and strictly alternating — not live/real-time action.

**Before anything else: read `https://github.com/Zabin/ZabOW/tree/claude/orbital-warfare-campaign-FWLKi` — that branch is the actual GUI/visual style reference for this project.** A prior chat session drafting the attached SOR was blocked from browsing it (GitHub's robots rules blocked that fetch tool from viewing non-default-branch trees); you have normal repo/git tooling and should not have that problem. If you find you genuinely can't reach it either, say so explicitly and ask me for another way in — don't silently fall back to the SOR's placeholder visual direction (§9.1) without flagging that you did.

**The attached `STATEMENT_OF_REQUIREMENTS.md` is the source of truth for what this project is.** Read it in full before doing anything else. Do not start writing game code from this prompt alone — the SOR is deliberately more precise than this message, and where they conflict, the SOR wins.

## Process — read this before touching code

This project is to be built using a **documentation-driven-development pipeline**, structurally the same pattern used in my other project `ZabGBCprocgenMusic` (stages `00`–`11`, numbered skills in `.claude/skills/`, hard rules G1–G5). I don't want you to copy that project's content — it's about generative Game Boy Color music and has nothing to do with orbital mechanics — I want you to **adapt the process pattern**: the stage structure, the artifact ID conventions (`FR-####`, `NFR-####`, `IP-####`, `VR-####`, `ADR-####`, etc.), and the hard rules. If you have access to fetch that repo, read `.claude/skills/README.md` there first as the canonical description of the pattern; if you don't have access, the pattern is fully described in §3 of the attached SOR — use that.

Also read (or ask me for access to) `ZabSpaceExercise`, my flagship PME wargaming simulator — it's the doctrine/research source and the origin of several architectural patterns this project reuses **conceptually** (not as shared code — different stack, see the SOR §3.3 and §8.1 for exactly what transfers and what doesn't):

- The six-access-channel model and the "Five D's" effect taxonomy
- The `Propagator` interface pattern for isolating orbital mechanics behind a swappable boundary
- Server-enforced fog-of-war (belief-state rendering, never raw ground truth to a client)
- A validated, schema-driven JSON/YAML asset template library

## What I need from you, in order

1. **Bootstrap the pipeline scaffold** — `.claude/skills/` (adapted from the ZabGBCprocgenMusic pattern, retargeted to this project's domain), `docs/pipeline/` (journal + backlog), and the rest of the `docs/` tree per the stage table in SOR §3.1.
2. **Run `01-vision`** using SOR §1–§6 as source material. This is the gate where you should surface every item in **SOR §16 (Assumptions & Open Questions)** back to me explicitly — I made reasonable calls to keep that document complete, but none of them are locked, especially:
   - Whether this is fully standalone from the earlier "ORBITAL COMMAND" campaign concept (OQ-01)
   - The proposed tech stack (OQ-02) — confirm before it hardens into an ADR
   - The visual-style placeholder (OQ-03) — see the branch pointer at the top of this prompt. Revise SOR §9.1 once you've actually seen it, before doing any real visual/UI work.
3. **Run `02-research-*`** grounding this project's own domain vocabulary in `ZabSpaceExercise`'s research corpus (citing it, not duplicating its classified-material sourcing standard verbatim without checking it still applies — it should, since this project is fictional-assets-only per SOR §5.2, but confirm).
4. **Run `03-architecture-design-synthesis`** using SOR §7–§9. This is where the hybrid orbital-mechanics requirement (SOR §7.6) and the `Propagator`-equivalent interface boundary (FR-5005) need real design attention — that's the architecturally hardest part of this project and deserves a proper ADR, not a rushed default.
5. **Run `04-requirements-engineering`** to formalize SOR §10–§11 into properly tiered, individually-traceable `FR-####`/`NFR-####` docs, and to resolve the numeric tuning questions this SOR explicitly deferred (SOR §14, OQ-05/06/07/10) — those are placeholders, not decisions.
6. From there, follow the pipeline normally: `05` feature decomposition → `06` feature specs → `07` implementation planning → **stop and get my explicit go-ahead (G3) before `08` writes any code, package by package.**

## Hard constraints (already decided, don't relitigate these)

- Two players, fixed strictly-alternating turns (chess-style I-go-you-go), not live/real-time simultaneous action (SOR §7.2) — WebSocket is still used, but only to push turn-change notifications instantly rather than requiring polling
- Hybrid orbital-mechanics fidelity: real Kepler+J2-minimum math internally, simplified discrete regime/slot presentation to players (SOR §7.6)
- New standalone repository — no shared runtime code with `ZabSpaceExercise`
- No accounts, no database, no matchmaking for v1 — a shareable session link is the entire onboarding flow (SOR §5.2, §8.5)
- Server-authoritative game state and server-enforced fog-of-war are non-negotiable (SOR §7.7, NFR-2001) — this is a security requirement, not just a design preference, since a client-side leak is trivially inspectable via browser devtools

## A note on my working style

I'll be reviewing this primarily through chat with you, not by reading every generated doc line by line as it's produced — so end every pipeline-skill run with the mandatory chat summary the pattern calls for (what changed, findings routed upstream/downstream, explicit next step), and hold at every gate the pattern defines rather than assuming momentum means permission to continue. If you hit a question that SOR §16 didn't anticipate, surface it the same way — tier it per SOR §3.1's question-ordering logic (higher pipeline stage first) rather than batching everything at once.

Start with step 1.
