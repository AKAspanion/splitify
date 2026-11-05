---
type: Decision
title: Log to Cloud Logging instead of a Log table
description: The Log table and APILogger's database logging are dropped; Cloud Functions write structured logs to Cloud Logging, which is where logs are read.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:30:02Z
verified: human:ankitp@geekyants.com
---

# Log to Cloud Logging instead of a Log table

## Context

`APILogger` (lib/logger.ts) wrote `Log` rows when `ENABLE_DB_LOGGING` was on, and
[removing the logs page](remove-admin-logs-page.md) left them to be read from the database. With the app moving to
the browser and Cloud Functions ([hosting](static-build-on-firebase-hosting.md)), the server code that logged is
gone, and Cloud Functions already send their output to Cloud Logging. The developer chose Cloud Logging.

## Decision

- No `Log` table in the SQL Connect schema, and no database logging.
- Cloud Functions log structured lines with `firebase-functions/logger`; they are read in Cloud Logging for project
  `splitify-416321`. A log line carries the cause, never a token, a request body or personal data.

## Consequences

- No admin screen or table is needed to read logs.
- Errors in the browser are not collected anywhere; adding that is a separate choice.

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (lib/logger.ts, prisma/schema.prisma) as plain text, so verify no longer expects them; the decision itself is unchanged.

## Sources

- lib/logger.ts
- prisma/schema.prisma
