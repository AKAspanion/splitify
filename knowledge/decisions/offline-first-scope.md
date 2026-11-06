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

## How it is built

- **Saved cache:** the react-query cache is saved to IndexedDB with idb-keyval, one entry per signed-in person
  (`splitify-cache-<uid>`), so one person's data never shows for another. It is kept `CACHE_MAX_AGE_MS = 604800000`
  (7 days), is discarded when the app version changes (the buster is `appVersion()`), and is deleted on sign-out.
  Queries run `offlineFirst`, and `syncOnlineState` tells react-query at startup whether the page opened offline, so
  saved data stays on screen instead of giving way to a load error. The provider has no key: it follows the
  signed-in person's saved cache without remounting the page (`followPersonCache`, `lib/offline/restore-cache.ts`).
  On a direct switch from one person to another it renders nothing under the provider for one commit, until the first
  person's queries are cleared (`nextFollowed`, `afterClear`), so the second never sees the first's data and the
  first's saved entry is never overwritten by the clear. Code: `lib/offline/persist.ts`, `lib/offline/online-state.ts`,
  `lib/offline/restore-cache.ts`, `components/providers.tsx`.
- **Shell:** one service worker caches the app shell ([service worker](../operations/service-worker.md)).
- **Queued writes:** [queue offline writes with mutation defaults](queue-offline-writes.md).
- **Online-only actions:** `components/offline/online-only.tsx` disables each one while offline with "You're offline.
  This needs a connection.", including the header popovers for Download report and an expense's Delete. The sign-in
  screens say "You're offline. Connect to sign in." and disable their buttons (`components/offline/offline-sign-in-note.tsx`).
- **Banner:** `components/offline/offline-banner.tsx` says "You're offline. Showing what was saved on this device.",
  and adds how many changes wait to sync, or that they are syncing.
- The add and settle forms read the same query keys as the group screens (members, the groups list), so they open
  offline for a group the person has seen.
- Provisional, for the developer to confirm: the 7-day cache life, the wording of the offline messages, and
  retrying network errors 3 times. They are not in the approved spec.

## Consequences

- An expense queued offline is checked against the access rules when it reaches SQL Connect, not when it was made:
  if the person was removed from the group in the meantime, it is rejected and the app says so.
- Queued expenses need ids made in the browser, so that a retry doesn't record the same expense twice.

## History

- 2026-11-06: the provider was keyed by uid because the saved cache is read only when it mounts; now it follows the person's cache without a key, because the key remounted every page when sign-in finished. See [the fixed finding](../findings/query-provider-remounts-pages-at-auth-restore.md).
- 2026-11-05: said only what works offline; now also how it is built, because the offline feature was built. See [offline](../features/offline.md).

## Sources

- `app/manifest.webmanifest`
- `lib/offline/persist.ts`
- `lib/offline/online-state.ts`
- `lib/offline/version.ts`
- `components/providers.tsx`
- `components/offline/online-only.tsx`
- `components/offline/offline-banner.tsx`
- `components/offline/offline-sign-in-note.tsx`
