# 01 — Installing and Running OW Chess

This module assumes you have **never used a command line, Node.js, or TypeScript before.** Every
command below is copy-pasteable. If a step fails, see `05-troubleshooting-and-glossary.md`.

## What you'll end up with

A web page running in your own browser where you and a second player (on the same machine, in a
second browser window, or on another machine on the same network) can play a full game of OW
Chess against each other.

## Step 1 — Install Node.js

OW Chess is written in a language called TypeScript, which needs a program called **Node.js** to
run. Node.js also comes with **npm** ("Node Package Manager"), which downloads the pieces the
game needs.

1. Go to <https://nodejs.org> in your browser.
2. Download the **LTS** (Long-Term Support) version for your operating system (Windows, macOS, or
   Linux) and run the installer, accepting the defaults.
3. Confirm it worked. Open a **terminal**:
   - **Windows:** press the Start key, type `cmd`, press Enter.
   - **macOS:** open **Terminal** from Applications → Utilities.
   - **Linux:** open your distribution's terminal application.
4. In the terminal, type the following and press Enter:
   ```
   node --version
   ```
   You should see a version number like `v22.x.x`. If you instead see something like
   "command not found," see the troubleshooting module.

A terminal is just a way to type instructions to your computer instead of clicking icons. Every
line below that starts with `$` is a command to type — don't type the `$` itself.

## Step 2 — Get the code

You need **git** to download ("clone") the project. Node.js's installer does not include git.

- **Windows/macOS:** install git from <https://git-scm.com/downloads>.
- **Linux:** git is usually already installed; if not, use your package manager (e.g.
  `sudo apt install git`).

Then, in your terminal, navigate to a folder where you want the project (e.g. your Desktop) and
run:

```
$ git clone https://github.com/Zabin/OWchess.git
$ cd OWchess
```

The second command moves your terminal *into* the newly downloaded project folder — every command
below assumes you're standing in that folder.

## Step 3 — Install the project's dependencies

OW Chess is split into three parts that share one dependency install: `shared` (types both sides
use), `server` (the game engine and the process you'll actually run), and `client` (the web page
UI). One command installs all three:

```
$ npm install
```

This downloads everything the project needs into a `node_modules` folder. It can take a minute or
two and will print a lot of text — that's normal.

## Step 4 — Build the project

TypeScript source code needs to be **compiled** into plain JavaScript before it can run. This one
command builds all three parts, in the right order:

```
$ npm run build
```

If this finishes without an error message ending in "Error" or a non-zero exit, the build
succeeded. This also builds the client's web page into `client/dist/`, which the server serves
directly — there is no separate client server to run.

## Step 5 — Run the game server

```
$ node server/dist/index.js
```

You should see:

```
OW Chess server listening on http://localhost:3000
```

Leave this terminal window open — it's the running game server. Closing it (or pressing Ctrl+C in
it) stops the game for everyone connected.

> If port 3000 is already used by something else on your machine, set a different port before
> starting: on macOS/Linux run `PORT=3001 node server/dist/index.js`; on Windows PowerShell run
> `$env:PORT=3001; node server/dist/index.js`. Substitute your chosen port in the URL below.

## Step 6 — Open the game in your browser

Open a web browser and go to:

```
http://localhost:3000
```

You should see the OW Chess landing page (a heading, a "Create Game" button, and a "Join Game"
box) — real screenshot below.

![OW Chess landing page](../manual/landing.png)

> The interface is currently intentionally unstyled (plain black-on-white HTML) — this is the
> real, as-shipped appearance of the MVP, not a broken screenshot. See `02-interface.md`.

## Playing with a second player

- **Same computer, testing solo:** open a *second* browser window (or a private/incognito window
  — a regular second tab in the same browser window may share login state oddly, but a second
  window works fine) and go to the same `http://localhost:3000` address.
- **Two different computers on the same network:** the second player needs your computer's local
  network address instead of `localhost` (e.g. `http://192.168.1.23:3000`) — find yours with
  `ipconfig` (Windows) or `ifconfig`/`ip addr` (macOS/Linux) and share it with the other player.
  This project has no internet-facing deployment story yet (v1 is a local/LAN-only demo, per
  MSTR-001).

Continue to `02-interface.md` to see what each screen shows, or straight to `03-first-game.md`
for a full walkthrough.

> Sources: `package.json`, `server/package.json`, `client/package.json` (real build/run scripts);
> `server/src/index.ts` (PORT env var, default 3000, static-serves `client/dist/`); live-verified
> this session by running the exact commands above against commit `b8ec3bd` and confirming the
> server started and the landing page rendered. Satisfies FR-9410.
