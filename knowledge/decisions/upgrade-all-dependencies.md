---
type: Decision
title: Upgrade every dependency to its latest version at once
description: All packages, including the framework majors (Next, React, Clerk, Prisma, Tailwind, ESLint), move to their latest release on one branch; a package not yet compatible with the rest stays on its newest compatible release.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T08:43:05Z
---

# Upgrade every dependency to its latest version at once

## Context

On 2026-11-04 most of the project was one or more major versions behind: 28 of the 55 packages in `package.json`,
among them Next, React, Clerk, Prisma, Tailwind, ESLint and zod. The developer was offered three scopes: everything
at once; only patches and low-risk majors; or the coupled framework majors (Next, React, Clerk) first.

## Decision

Everything goes to its latest release on one branch, `feat/dependency-updates`, with one commit per group of
related packages, fixing breakages as they come. A package whose latest release doesn't work with the rest yet
stays on its newest compatible release, and the reason is recorded here.

## Consequences

- The exact versions are whatever `package.json` and `yarn.lock` hold; this concept doesn't repeat them.
- The branch is checked by typecheck, lint, `next build` and a run of the app against the developer's own dev
  `.env` (sign-in and the main screens), because the repository has no tests (see
  [how should changes be tested?](../questions/testing-approach.md)).
- Installs on this branch run with scripts off, because `postinstall` runs `prisma db push` against whatever
  database `DATABASE_URL` names.

## Sources

- `package.json`
- `yarn.lock`
