# OW Chess

A two-player, browser-based, turn-based space-domain-awareness/counterspace strategy game. See
`docs/` for the full documentation-driven-development pipeline (vision, architecture, requirements,
feature specs, and implementation packages).

## Monorepo layout

- `shared/` — types, module interfaces, and the WebSocket message schema (GDS-07/GDS-09), consumed
  by both `server` and `client`.
- `server/` — Node.js + TypeScript game engine and WebSocket transport.
- `client/` — React + TypeScript UI.

## Commands

- `npm run build` — TypeScript project-references build across all three workspaces.
- `npm test` — Vitest across all three workspaces.
- `npm run dev` — server (tsx watch) + client (Vite dev server), each workspace's own `dev` script.

## Status

Implementation is tracked package-by-package in `docs/implementation/00-master-build-plan.md`.
