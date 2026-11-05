---
type: Decision
title: Changes are tested with end-to-end tests of the main flows
description: The project's testing is end-to-end tests that walk the main flows as a person would; which runner, and which flows count as main, aren't settled yet.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:57:30Z
verified: human:ankitp@geekyants.com
---

# Changes are tested with end-to-end tests of the main flows

## Context

How changes should be tested was open ([question](../questions/testing-approach.md)): unit tests of the split engine,
tests of the server actions, end-to-end tests of the main flows, or none. Since then, Vitest unit tests have been
added beside the actions and routes they cover (`vitest.config.mts`, run by `pnpm test`).

## Decision

Changes are tested with end-to-end tests of the main flows.

Decided by the developer, from the ga dashboard, on 2026-11-04.

## Consequences

- The project needs an end-to-end runner and a way to sign in and seed data for it; `checks.commands.e2e` in
  `.ga/config.json` is set once there is one.
- Not decided yet: the runner, which flows count as main, and what this means for the Vitest unit tests already in
  the repository.

## Sources

- `package.json`
- `vitest.config.mts`
- `.ga/config.json`
