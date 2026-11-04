---
type: Log Entry
date: 2026-11-05
at: "2026-11-05T00:39:44.427+05:30"
kind: Fix
by: human:ankitp@geekyants.com
agent: claude-code
---
The deploy job now generates the Prisma client and SQL Connect SDK before the hosting build, which failed to typecheck without them.
