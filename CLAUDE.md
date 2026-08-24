# CLAUDE.md

Read automatically at the start of every session in this repo. These rules apply regardless of
which pipeline skill (if any) is active — they are self-checks Claude runs on its own language and
claims, not process to route through a stage.

They exist because of a real failure, recorded in full at `docs/pipeline/pipeline-journal.md`
(2026-08-23) and enforced structurally as governance rule **G6** in `.claude/skills/README.md`:
with 138/138 tests passing, 11 packages `VERIFIED`, and two clean integration reviews, the shipped
app could not end a game, had no event log, and had no stylesheet. Every defect was found by
running the app or grepping for callers — none was found by writing or reading a document.

## Severity self-check — translate before you write it down

Before describing a gap, defect, or backlog item, check the phrase you're about to use against
this table. If your own words are in the left column, the right column is what actually goes in
the report — not the left column with a lower severity number attached.

| If you're about to write... | Ask this instead, and write the answer | Why |
|---|---|---|
| "styling pass" / "polish" / "visual follow-up" | What does a user literally see, right now, when this ships as-is? | "Styling pass" described five unmet `Must` requirements and a broken vision commitment. It was filed Medium and repeated back to the owner as settled for days. |
| "nit" / "minor" / "small follow-up" | If I ignore this, what can the user specifically not do? | Smallness of the *fix* is not smallness of the *gap*. A one-line change to an unreachable function is still a Critical finding if the function was never called. |
| "not blocking" | Not blocking *what*, exactly — the build, or the actual thing the user asked for? | Every unmet `Must` requirement blocks the release, even when it doesn't block `npm run build`. Those are different gates; only one of them matters at the end. |
| "known limitation" / "out of scope for now" | Was this scoped out on purpose by the owner, or is it just where the work stopped? | A limitation nobody chose is a gap wearing a calmer name. |
| "verified" / "all tests passing" / "package VERIFIED" | Verified against what — my own definition of done, or something I can't quietly edit? | If the same work wrote the spec, the code, and the verification, "verified" only proves internal consistency. State what independent bar was checked. |
| "should work" / "this wires up X" | Have I actually run it and watched it happen, or am I inferring it from the diff? | Say which one. "Should work" from a diff read and "confirmed working" from a live run are different claims and must not be worded the same. |

## Before reporting any status as good news

1. **Can you show it, not just describe it?** A screenshot, a captured session, or a pasted
   terminal transcript from an actual run beats a summary of what the code should do. If you
   can't produce one in a minute, that itself is worth saying.
2. **What would a user see differently after this?** If the honest answer is "nothing yet," say
   that plainly and name what still has to happen before they would notice — don't let "the
   module is wired" stand in for "a person can see the effect."
3. **Did you check this against something outside the work itself?** A package grading its own
   definition of done, or a test suite written by the same pass that wrote the code, is not
   independent evidence. Say what the independent bar was — the owner's own words, a reference
   implementation, a live run, a screenshot — or say there wasn't one yet.

## Full enforcement

The mechanical version of this — reachability sweeps, mandatory demonstration artifacts, and
automatic no-go conditions — lives in the pipeline skills as governance rule **G6**, summarized in
`.claude/skills/README.md`. This file is the plain-language version Claude applies to its own
wording in every session, pipeline-driven or not.
