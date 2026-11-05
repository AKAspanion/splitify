---
type: Open Question
title: How should changes be tested?
description: The repository has no tests, test runner or CI; ga's workflow is test-first. Which tests should new work add, and with what?
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# How should changes be tested?

## Question

What testing should changes here come with: unit tests for the split engine in `lib/splitify/`, tests for the
server actions, end-to-end tests of the main flows, or none for now? And with which runner?

## Why it matters

ga's workflow writes a failing test before each change. With no runner set up, `checks.commands.test` is `none`
and that step can't run. The split engine and the balance calculation are pure functions and the cheapest place to
start.

## Status

Answered: end-to-end tests of the main flows. See [e2e of the main flows](../decisions/e2e-main-flows.md).

## Sources

- `package.json`
- `lib/splitify/service/splitify-service.ts`
