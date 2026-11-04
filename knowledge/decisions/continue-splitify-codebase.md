---
type: Decision
title: Continue the Splitify codebase in place
description: This repository's own Next.js and Prisma code is built on where it is, keeping its structure; it is not rewritten or migrated.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:13:13Z
---

# Continue the Splitify codebase in place

## Context

ga was set up in this repository on 2026-11-04 with `/ga:learn .`. The code handed over is the repository's own
Splitify app (a Next.js app with a Prisma schema), at the repository root. ga asks whether existing code is for
reference, to continue, or to migrate, because each one changes how later work treats it.

## Decision

The developer chose **continue**: new work builds on this code where it is, in its existing structure. It is
neither read-only reference material nor the source for a replacement build.

## Consequences

- Features and fixes go into the existing folders and follow the conventions already in the code, as learned by
  `ga:learn-codebase`, instead of a structure ga would generate.
- The repository is adopted (`origin: adopted` in `.ga/project.json`), so ga's `build`, `update` and `plan`
  commands don't restructure it; modules are added with `/ga:add-module`.
- No migration plan is written for it.

## Sources

- `.ga/project.json`
- `package.json`
- `prisma/`
