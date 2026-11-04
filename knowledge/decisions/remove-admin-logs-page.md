---
type: Decision
title: Delete the /logs admin page instead of adding an admin role
description: The /logs page, which showed every Log row to any signed-in user, is removed; the app keeps no admin role, and logs are read in Cloud Logging.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T11:30:54Z
---

# Delete the /logs admin page instead of adding an admin role

## Context

`/logs`, in the `app/(admin)` route group, listed every `Log` row, request bodies included, to anyone with a Clerk
session ([finding](../findings/admin-logs-unprotected.md)). The developer was offered an allowlist of admin user
ids in an env key, an admin role in Clerk metadata, or removing the page.

## Decision

Remove the page and the `app/(admin)` route group. The app has no admin role. Logs are read in Cloud Logging
([Cloud Logging](cloud-logging.md)).

## Consequences

- No admin identity to manage or leak.
- Adding an admin screen later means choosing how admins are identified first.

## History

- 2026-11-04: logs were read from the `Log` table; now in Cloud Logging, because the table is dropped. See [Cloud Logging](cloud-logging.md).

## Sources

- `app/(admin)/layout.tsx`
- `app/(admin)/logs/page.tsx`
- `app/(admin)/logs/logs-list.tsx`
