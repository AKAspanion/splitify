---
type: Finding
title: Admin logs page is open to every signed-in user
description: /logs lists every Log row, including logged request bodies, to anyone with a Clerk session.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Admin logs page is open to every signed-in user

## Finding

`app/(admin)/logs/logs-list.tsx` reads `db.log.findMany()` and renders each row's `body`. The `(admin)` route group
adds no check, so the Clerk middleware's session check is the only gate.

## Evidence

- `app/(admin)/layout.tsx` only wraps its children in `Suspense`.
- `app/(admin)/logs/logs-list.tsx` queries all logs with no filter.

## Status

Open.

## Sources

- `app/(admin)/layout.tsx`
- `app/(admin)/logs/page.tsx`
- `app/(admin)/logs/logs-list.tsx`
- `middleware.ts`
