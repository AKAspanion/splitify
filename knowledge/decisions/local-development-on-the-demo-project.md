---
type: Decision
title: Local development runs on the demo project demo-splitify
description: pnpm dev starts the emulators and the web app as the Firebase demo project demo-splitify, so nothing run locally can reach production data or services.
status: draft
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-05T15:30:00Z
---

# Local development runs on the demo project demo-splitify

## Context

Local development needs the Auth, SQL Connect and Functions emulators. Pointing them at the real project id risks a stray
call reaching production; a `demo-` project id makes the Firebase tools refuse any call to a real service.

## Decision

The developer chose, on 2026-11-05, that local development runs on the demo project `demo-splitify`: `pnpm dev` starts the
emulators with `--project demo-splitify` and `next dev` with demo Firebase keys, with no `.env`. The rule tests use the same
project id. Local data lives in `.emulator-data/`, not in any real project.

## Consequences

- Nothing local reaches production; there is no key to leak into local runs.
- The Hosting emulator is not started by `pnpm dev`: it would serve whatever `out/` holds under the production CSP.
- Functions triggered by SQL Connect mutations don't run in the local Functions emulator ([finding](../findings/sql-connect-triggers-not-run-locally.md)).

## Sources

- `scripts/dev.mjs`
- `scripts/dev-env.mjs`
- `package.json`
- `firebase.json`
- [Run locally](../operations/run-locally.md)
