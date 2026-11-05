---
type: Decision
title: Continue the Splitify codebase in place
description: This repository's own Next.js code is built on where it is, keeping its structure; it is not rewritten. Its data layer moves from Prisma to SQL Connect.
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

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (prisma/) as plain text, so verify no longer expects them; the decision itself is unchanged.
- 2026-11-04: was the Next.js and Prisma code continued in place; now the Next.js code is continued and Prisma over MySQL is replaced by SQL Connect, because the app moves to the browser on Firebase. See [SQL Connect](sql-connect-database.md).

## Sources

- `.ga/project.json`
- `package.json`
- prisma/
