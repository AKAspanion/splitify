---
type: Feature
title: Account deletion
description: A person deletes their account from the profile page, or Clerk reports it deleted; the person is anonymised and their shared expenses stay.
status: draft
work_item: tmp-play-store-update
generated:
  by: agent:after-finish
  at: 2026-11-04T16:00:00Z
---

# Account deletion

Google Play requires deletion in the app and from a web link. The rule that shared expenses stay is
[the decision](../decisions/anonymise-deleted-accounts.md).

## Behaviour

- The Profile page's "Delete account" button (`app/(platform)/profile/delete-account-action.tsx`, a `Dialog`) runs the
  `deleteAccount` action (`actions/delete-account/`). It ignores its input and acts on the session's own account.
- The action anonymises the row and deletes the Clerk account in one Prisma transaction, with `timeout: 15000` for the
  Clerk call. Clerk is called last, so a refusal from Clerk rolls the anonymisation back. The OneSignal user is
  deleted after the commit, and a failure there is only logged.
- A merged contact keeps its `spuser_` id ([contact identity](../domain/contact-identity.md)), so when the session id
  finds no row the action finds it by the Clerk account's primary email.
- Clerk's `user.deleted` webhook runs the same anonymisation ([Clerk](../integrations/clerk.md)).
- People without the app use the public `/delete-account` page ([privacy policy](privacy-policy.md)).

## What anonymising does

`anonymiseUser` in `lib/account/anonymise.ts`:

- Replaces the name with `Deleted user`, the email with `deleted-<id>@deleted.invalid` and both pictures with the
  placeholder avatar; removes the passkey devices, the person's feedback and their friendships.
- Deletes groups whose only member is the person; in groups shared with others, replaces the person's name in the
  activity messages.
- Keeps memberships, expenses, payments and splits.
- Safe to run twice. It returns `{ anonymised: false }` only for a missing or already anonymised row; any query error
  rejects, so the caller's transaction rolls back.

## Sources

- `lib/account/anonymise.ts`
- `actions/delete-account/index.ts`
- `app/(platform)/profile/delete-account-action.tsx`
- `app/api/webhook/clerk/route.ts`
- `lib/onesignal.ts`
- `docs/specs/2026-11-04-play-store-update.md`
