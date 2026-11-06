---
type: Finding
title: Deleting an account leaves the person's saved cache in IndexedDB on the device
description: The delete-account action signs out through Firebase directly and never calls clearSavedCache, so the deleted person's groups and expenses stay in their IndexedDB entry.
generated:
  by: agent:after-finish
  at: 2026-11-06T12:00:00Z
---

# Deleting an account leaves the person's saved cache in IndexedDB on the device

## Finding

Ordinary sign-out runs `clearSavedCache(uid)` before Firebase's own sign-out (`signOut` in `lib/firebase/auth.ts`).
Account deletion does not: after `deleteMyAccount` succeeds, `handleDelete` in
`app/(platform)/profile/delete-account-action.tsx` calls `firebaseSignOut` directly. The deleted person's groups and
expenses stay in `splitify-cache-<uid>` in IndexedDB, and nothing removes them, because only a restore by that uid
checks the 7-day `maxAge` ([offline](../decisions/offline-first-scope.md)). Personal data stays on the device after the
person asked for it to go. Checked against the code on the merged branch: still true.

## Evidence

- `.ga/runs/2026-11-06-cache-restore-without-remount/reviews/final-security-reviewer.md`, "Declined to judge", second
  item.
- `grep clearSavedCache`: called only from `lib/firebase/auth.ts`.

## Status

Open.

## Sources

- `app/(platform)/profile/delete-account-action.tsx`
- `lib/firebase/auth.ts`
- `lib/offline/persist.ts`
