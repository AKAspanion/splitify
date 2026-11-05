---
type: Feature
title: Profile
description: The profile screen of the hosted site: who is signed in, notifications, the biometric lock, feedback, theme, sign out and a link to delete the account.
status: draft
generated:
  by: agent:after-finish
  at: 2026-11-05T13:00:00Z
---

# Profile

## What it does

`/profile` shows the signed-in person's name and email (from `useMe`, falling back to the Firebase Auth user while it
loads), the dark-mode toggle, a link to [feedback](feedback.md), the push-notification control
([notifications](notifications.md)), the [biometric lock](biometric-lock.md) entry, a Sign out button and a Delete
account link.

## Rules

- Signing out lands on the home page `/`, not the sign-in page: the page leaves first, then signs out, and
  `RequireAuth` is told the sign-out was intended (`lib/auth-redirect.ts`, [auth](../security/auth.md)).
- Delete account links to `/delete-account`, the page that says how to ask for deletion, until account deletion
  moves to a Cloud Function (spec 2c).
- It is a client page over `lib/data/profile.ts` (`useMe`, the `GetMe` query), guarded like the other signed-in screens.

## Sources

- `app/(platform)/profile/page.tsx`
- `app/(platform)/profile/page.hosting.tsx`
- `app/(platform)/profile/delete-account-action.tsx`
- `lib/data/profile.ts`
- `lib/auth-redirect.ts`
