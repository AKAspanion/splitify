---
type: Finding
title: A local pnpm test:e2e writes its users and groups into the developer's .emulator-data
description: The e2e run starts scripts/dev.mjs, which imports and exports .emulator-data, so local runs leave test users and groups in the developer's emulator data; CI starts empty.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# A local pnpm test:e2e writes its users and groups into the developer's .emulator-data

## Finding

`pnpm test:e2e` starts `node scripts/dev.mjs` or reuses a running `pnpm dev` ([run locally](../operations/run-locally.md)).
`dev.mjs` imports `.emulator-data` at start and exports it at exit, so the users and groups a local run creates land in
the developer's own emulator data. The tests use unique emails, so they don't depend on what is there; the cost is
clutter. In CI the job starts with no data. Separating the two needs a change to `scripts/dev.mjs`, which the e2e task
left alone.

## Evidence

Task 5's report in the repository-modernization run, concern 3, deferred as Minor in the run's ledger.

## Status

Open.

## Sources

- `scripts/dev.mjs`
- `playwright.config.ts`
