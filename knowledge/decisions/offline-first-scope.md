---
type: Decision
title: Offline, people can read everything and add expenses and settlements
description: The PWA shows groups, expenses and balances from a cache saved in the browser, and queues new expenses and settlements made offline until the connection returns; other changes need a connection.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:05:46Z
---

# Offline, people can read everything and add expenses and settlements

## Context

The developer wants Splitify to be an offline-first PWA. Three scopes were offered: reading only; reading plus
adding expenses and settlements; or every change. The developer chose the middle one. SQL Connect's web SDK keeps
its query cache in memory only ([database](sql-connect-database.md)), so offline reading needs a cache the app
saves itself.

## Decision

- **Reading offline:** groups, their members, expenses, balances and activity that the person has seen are shown
  from a cache saved in IndexedDB, and the app shell is cached by a service worker.
- **Writing offline:** adding an expense and recording a settlement work offline. Each is kept in a queue in the
  browser, shown in the app as waiting to sync, and sent when the connection returns.
- **Online only:** creating, editing or deleting a group, changing its members, editing or deleting an expense, and
  adding or editing friends and contacts. These are disabled while offline, with a message saying so.

## Consequences

- An expense queued offline is checked against the access rules when it reaches SQL Connect, not when it was made:
  if the person was removed from the group in the meantime, it is rejected and the app says so.
- Queued expenses need ids made in the browser, so that a retry doesn't record the same expense twice.

## Sources

- `app/manifest.webmanifest`
