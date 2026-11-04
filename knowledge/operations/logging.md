---
type: Runbook
title: Logging
description: APILogger writes to the console by default and to the Log table when ENABLE_DB_LOGGING is YES; Prisma query logging is a separate switch.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Logging

## Variables

- `ENABLE_CONSOLE_LOGGING`: console output is on unless it is `NO`.
- `ENABLE_DB_LOGGING`: rows are written to `Log` only when it is `YES`.
- `ENABLE_PRISMA_QUERY_LOGGING`: when `YES`, and not in production, `lib/db.ts` prints every query and its duration.

## Where each is read

- `APILogger` in `lib/logger.ts` has `info` and `error`. `info` stores the body it is given in `Log.body`; `error`
  stores only the message. The push-notification routes are its main callers.
- Logged rows are listed on `/logs` (`app/(admin)/logs/logs-list.tsx`), which any signed-in user can open:
  [admin logs unprotected](../findings/admin-logs-unprotected.md).
- `app/global-error.tsx` logs the error to the browser console and shows its message with a retry button.

## Sources

- `lib/logger.ts`
- `lib/db.ts`
- `app/(admin)/logs/logs-list.tsx`
- `app/global-error.tsx`
