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
account button.

## Rules

- Signing out lands on the home page `/`, not the sign-in page: the page leaves first, then signs out, and
  `RequireAuth` is told the sign-out was intended (`lib/auth-redirect.ts`, [auth](../security/auth.md)).
- Delete account (`delete-account-action.tsx`) asks for confirmation ("Your shared expenses stay, shown as Deleted user.
  This can't be undone."), calls the `deleteMyAccount` callable ([Cloud Functions](../apps/functions.md)), then goes home
  and clears the local sign-in. The function anonymises the person's row, deletes the groups only they were in, and
  deletes their Auth user ([decision](../decisions/anonymise-deleted-accounts.md)). A failure shows a message and the
  person stays signed in; trying again finishes the job. `/delete-account` remains the public page that describes
  deletion.
- It is a client page over `lib/data/profile.ts` (`useMe`, the `GetMe` query), guarded like the other signed-in screens.

## History

- 2026-11-05: Delete account linked to a page that explained how to ask for deletion; now it deletes the account itself through `deleteMyAccount`, because spec 2c built the function.

## Sources

- `app/(platform)/profile/page.tsx`
- `app/(platform)/profile/page.hosting.tsx`
- `app/(platform)/profile/delete-account-action.tsx`
- `lib/data/profile.ts`
- `lib/auth-redirect.ts`
