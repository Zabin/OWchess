# 05 — Troubleshooting and Glossary

## Troubleshooting

**"command not found: node" / "'node' is not recognized"**
Node.js isn't installed, or your terminal needs restarting after installing it. Reopen your
terminal and try `node --version` again; if it still fails, reinstall from
<https://nodejs.org> and make sure you accepted the installer's default options (they add Node to
your system PATH).

**`npm install` prints warnings**
Warnings (as opposed to lines ending in "npm ERR!" or the command exiting with an error) are
normal and don't mean the install failed.

**"Error: listen EADDRINUSE" when starting the server**
Something else on your machine is already using port 3000. Either stop that program, or start OW
Chess on a different port (`PORT=3001 node server/dist/index.js` on macOS/Linux, or
`$env:PORT=3001; node server/dist/index.js` in Windows PowerShell) — then use that port number in
the browser URL instead.

**Browser shows "This site can't be reached" / connection refused**
The server isn't running, or you're using the wrong port. Check the terminal window running
`node server/dist/index.js` — if it's not still open and showing "listening on...", start it
again.

**The page loaded but looks completely unstyled (plain black text, default browser buttons)**
That's the real, current appearance of the app — not a loading problem. See `02-interface.md`.

**An asset I deployed shows a blank orbital regime (nothing after the dash on the board)**
This is a known, confirmed gap in the current build — see the warning box in `03-first-game.md`.
It's not something wrong with your setup.

**Clicking Task Sensor, Maneuver, or Engage doesn't seem to do anything useful**
Also a known, confirmed gap — see `03-first-game.md` and `04-actions-reference.md`. The buttons
correctly enable/disable based on real game state, but the current interface doesn't yet collect
the extra information (which asset, which target, which effect) those three actions need.

**Second player can't reach the game from another computer**
Make sure both computers are on the same local network, and that the second player uses your
machine's local network IP address (not `localhost`) in the browser URL — see the end of
`01-install-and-run.md`. Also check that your computer's firewall isn't blocking the chosen port.

## Glossary

**AP (Action Points)** — Your budget for actions on your turn. Deploying, maneuvering, tasking,
and engaging all cost AP; Pass costs none. Shown live in the Mission/King Status panel.

**Asset** — Any deployable unit: a sensor (radar, tracking array, optical imager) or an effector
(jammer, kinetic RPO vehicle). Everything except your King is an asset.

**Belief state / fog of war** — What you currently know (or think you know) about your
opponent's assets, built up entirely through your own sensing actions. You never see your
opponent's true state directly — only your own derived belief about it, shown in the Intel Panel.

**Chain role** — Which step(s) of the find-fix-track-target-engage chain an asset type can
perform (see below). A radar with roles `find, fix` can only ever get you to "fix" precision on a
contact, no matter how many turns you spend tasking it.

**Deceive / Disrupt / Deny / Degrade / Destroy (the "Five D's")** — The five categories of effect
an effector asset can apply to a target, from temporary/reversible (Disrupt, Deny, Degrade,
Deceive) to permanent (Destroy). See `04-actions-reference.md` for what each does.

**F2T2E (Find-Fix-Track-Target-Engage)** — The doctrinal chain this game's core mechanic is
modeled on: you must locate a contact (Find), refine its location (Fix), maintain custody of it
over time (Track), gather weapons-quality precision (Target), before you can act on it (Engage).

**King** — Each player's one secretly-deployed, must-protect asset. Losing your King (destroyed,
or denied for 6 consecutive turns) loses you the game.

**Mission set** — One of three thematic asset/King-regime packages (SATCOM, ISR, PNT-lite) you
choose at the start of the game; it determines which asset types you can deploy and where your
King is allowed to start.

**Orbital regime** — One of nine simplified orbit categories (three altitude bands — LEO, MEO,
GEO — crossed with three plane classes — Equatorial, Prograde, Polar) standing in for continuous
orbital mechanics.

**Precision (find/fix/track/target)** — How well-resolved your belief about a contact is, from
"something is there" (find) up to weapons-quality data (target) — the prerequisite ladder for
Engage.

**Session** — One game instance, identified by a session ID, holding exactly two players.

**Turn** — Players strictly alternate; only the active player's actions are accepted (except
Resign, which either player can invoke at any time).

> Sources: this session's live troubleshooting reproduction (port-in-use and blank-regime cases,
> commit `b8ec3bd`); `shared/src/types.ts`, `shared/src/interfaces.ts` (glossary term
> definitions). Satisfies FR-9110, NFR-10100 (jargon defined at first use).
