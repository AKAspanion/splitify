---
type: Runbook
title: Logging
description: Cloud Functions write structured logs to Cloud Logging; the browser logs to its console; there is no Log table or logging switch.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Logging

There is no `APILogger`, no `Log` table and no logging switch (`ENABLE_*`): [the decision](../decisions/cloud-logging.md)
chose Cloud Logging, and the server code that logged is removed.

- Cloud Functions log with `firebase-functions/logger`, read in Cloud Logging for the Firebase project. A line carries
  the operation and the error's class, never its message, a token, a request body or personal data
  ([Cloud Functions](../apps/functions.md)). The guard logs a refused sign-in by class only.
- `app/global-error.tsx` logs the error to the browser console and shows its message with a retry button. Browser errors are
  collected nowhere else.
- There is no admin page for logs ([decision](../decisions/remove-admin-logs-page.md)).

## History

- 2026-11-05: was `APILogger` writing to the console or the `Log` table, with Prisma query logging and a logs page; now Cloud Logging only, because spec 2c removed the server code that logged. See [decision](../decisions/cloud-logging.md).

## Sources

- `functions/src/http/guard.ts`
- `functions/src/webauthn/index.ts`
- `app/global-error.tsx`
