---
type: Finding
title: Fixed: the admin logs page was open to every signed-in user
description: The /logs page listed every Log row, including logged request bodies, to anyone with a session; the page and the Log table were removed.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Fixed: the admin logs page was open to every signed-in user

## Finding

As found, before the server was removed:

app/(admin)/logs/logs-list.tsx reads `db.log.findMany()` and renders each row's `body`. The `(admin)` route group
adds no check, so the Clerk middleware's session check is the only gate.

## Evidence

- app/(admin)/layout.tsx only wraps its children in `Suspense`.
- app/(admin)/logs/logs-list.tsx queries all logs with no filter.

## Status

Fixed. The page was removed ([decision](../decisions/remove-admin-logs-page.md)) and the `Log` table with it ([decision](../decisions/cloud-logging.md)); logs are in Cloud Logging.

## History

- 2026-11-05: was Open, naming the logs page and the Clerk middleware; now Fixed, because the page, the table and the middleware are removed.

## Sources

- `dataconnect/schema/schema.gql`
