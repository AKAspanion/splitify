---
type: Decision
title: Every local port is in the 2140 series, assigned one by one
description: The developer's rule that each local development port (the dev server, the emulators and the rule tests) sits in 2140 and up, taken in order, so none clashes with another project's defaults.
status: draft
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-05T15:30:00Z
---

# Every local port is in the 2140 series, assigned one by one

## Context

The Firebase emulators' default ports (9099, 9399, 5001 and others) clash with other projects running on the same machine,
and a rule-test run once failed because another project held them ([finding](../findings/offline-gaps-unchecked.md)).

## Decision

The developer's rule of 2026-11-05: every local port is in the 2140 series, assigned one by one. `next dev` is 2140, the
emulator hub 2141, Auth 2142, and so on in order. The values are in the `emulators` block of `firebase.json` and, for the
rule tests, in `scripts/rules-test-firebase-config.mjs`; this concept doesn't copy the table.

Provisional rulings the developer has not yet signed off on: the Cloud Tasks emulator, which always starts with Functions,
is on 2151 (it took a port outside the series otherwise); and `pnpm test:rules` runs its own emulators on 2152 to 2156 so it
can run while `pnpm dev` runs and cannot empty the dev data. The developer confirms both.

## Consequences

- `lib/firebase/emulators.ts` mirrors the browser's three ports, and its test holds them equal to `firebase.json`.
- The Emulator UI is on 2149.

## Sources

- `firebase.json`
- `scripts/rules-test-firebase-config.mjs`
- `lib/firebase/emulators.ts`
- [Run locally](../operations/run-locally.md)
