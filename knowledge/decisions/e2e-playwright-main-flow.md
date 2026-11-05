---
type: Decision
title: End-to-end tests run Playwright on the emulators, starting with the main flow, on every pull request
description: The e2e runner is Playwright against the Firebase emulators; the main flow is sign in, create a group, add an equal-split expense with a contact, and see the balance; CI runs it on every pull request.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T12:45:35Z
verified: human:ankitp@geekyants.com
stated: "Should this change add CI end-to-end tests, Playwright on the Firebase emulators, with the main flow as: sign in, create a group, add an equal-split expense with a contact, see the balance? — Yes, that flow (Recommended)"
stated_via: qa
---

# End-to-end tests run Playwright on the emulators, starting with the main flow, on every pull request

## Context

[Changes are tested with end-to-end tests of the main flows](e2e-main-flows.md) left two things open: the runner, and
which flows count as main. The repository-modernization work of 2026-11-05 settled both.

## Decision

- The runner is Playwright, against the Firebase emulators that `pnpm dev` uses
  ([local development on the demo project](local-development-on-the-demo-project.md)), so a test needs no `.env` and
  no real account.
- The main flow is: sign in, create a group, add an expense split equally with a contact, and see the balance.
- CI runs the e2e tests on every pull request.

## Consequences

- A test user is created on the Auth emulator with generated credentials, never a real account.
- New flows join the same suite as they are built.

## Sources

- `.github/workflows/ci.yml`
- `package.json`
