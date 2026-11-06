---
type: Finding
title: Another tab can write a signed-out person's saved cache back after it was deleted
description: The set of cleared people in the saved-cache code is per tab, so a background tab that hasn't seen the sign-out keeps saving and recreates the entry that sign-out deleted.
generated:
  by: agent:after-finish
  at: 2026-11-06T12:00:00Z
---

# Another tab can write a signed-out person's saved cache back after it was deleted

## Finding

Sign-out deletes the person's IndexedDB entry and adds their uid to `cleared` in `lib/offline/persist.ts`, so a write
the cache had already queued can't bring it back ([offline](../decisions/offline-first-scope.md)). `cleared` lives in
one tab. Another open tab that hasn't seen the sign-out yet keeps saving that person's cache (a gcTime `removed` event
is enough) and recreates the deleted entry, so their groups and expenses stay on the device. It predates the
cache-restore work.

## Evidence

- `.ga/runs/2026-11-06-cache-restore-without-remount/reviews/final-security-reviewer.md`, "Declined to judge",
  first item: set aside because the diff doesn't touch it; the reviewer recommended recording it.

## Status

Open.

## Sources

- `lib/offline/persist.ts`
- `lib/firebase/auth.ts`
