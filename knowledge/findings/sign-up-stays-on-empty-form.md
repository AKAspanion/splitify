---
type: Finding
title: "Fixed: after email sign-up the page stayed on an empty sign-up form"
description: The keyed query provider remounted the sign-up form when sign-in finished, which dropped its created state and left an empty form; fixed by following the saved cache without a key.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# Fixed: after email sign-up the page stayed on an empty sign-up form

## Finding

After an email sign-up the account was created and the person signed in, but the page stayed on an empty sign-up form
instead of showing the confirmation ([sign in](../features/sign-in.md)). The cause was `QueryProvider` keyed by uid:
when sign-in finished the key changed and the sign-up form remounted, dropping its "created" state. It was on `main`
too, since b8ceee0. See [the remount finding](query-provider-remounts-pages-at-auth-restore.md).

## Evidence

- Ledger: "Final review: minor (deferred): after email sign-up the page stayed on an empty sign-up form though the
  account was created and signed in".
- Fixed by 259fe40 and the commits after it. Confirmed in the browser: the form mounts once and the confirmation shows.

## Status

Fixed. The provider has no key, so sign-in no longer remounts the page
([decision](../decisions/offline-first-scope.md)).

## Sources

- `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- `components/providers.tsx`
- `lib/offline/restore-cache.ts`
