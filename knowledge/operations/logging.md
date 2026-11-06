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
  ([Cloud Functions](../apps/functions.md)). The guard logs a refused sign-in (`guard: sign-in refused`) and a failed
  sign-in check (`guard: sign-in check failed`) by the error's class and code only.
- The browser logs the error's class only, never its message: `[verify-banner] read failed` and
  `[verify-banner] write failed` (`console.warn`, with the error's name) in `lib/auth/verify-banner-dismissal.ts`, and
  `[push] <what> failed: <class>` (`console.error`) in `lib/push/register.ts`, which includes a token removal that
  timed out.
- `app/global-error.tsx` shows "Something went wrong.", the error's `digest` as a reference and a retry button, and never
  the error's message, which can carry internals; Next already logs a caught error to the browser console. Browser
  errors are collected nowhere else.
- There is no admin page for logs ([decision](../decisions/remove-admin-logs-page.md)).

## History

- 2026-11-06: the browser's log shapes weren't written down and the guard's logs were said to carry the class only; now both are stated, with the guard's code, because the open-findings fixes added the verify-banner warnings and the guard's `500` log.
- 2026-11-06: the global error page showed the error's message; now only a fixed line and the digest, because the message can carry internals.
- 2026-11-05: was `APILogger` writing to the console or the `Log` table, with Prisma query logging and a logs page; now Cloud Logging only, because spec 2c removed the server code that logged. See [decision](../decisions/cloud-logging.md).

## Sources

- `functions/src/http/guard.ts`
- `functions/src/webauthn/index.ts`
- `app/global-error.tsx`
- `lib/auth/verify-banner-dismissal.ts`
- `lib/push/register.ts`
