---
type: Business Rule
title: Contact identity
description: When someone signs up with Clerk using an email that belongs to an existing contact, Clerk's webhook marks that contact as from Clerk instead of creating a new user.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Contact identity

## Rule

On `user.created` and `user.updated`, `POST /api/webhook/clerk` looks up a `User` by the first email address in
the event.

- If one exists, the event is written onto that row: it keeps its `id` (an `spuser_` id for a contact), and gets
  the name, images and `fromClerk: true`. The friend page then stops showing "Verification pending".
- If none exists, a new `User` is created with Clerk's id.

The row keeps its `spuser_` id after the merge, while the person's Clerk session carries Clerk's user id, and every
action looks the caller up by that session id: see
[contact sign-up keeps the contact's id](../findings/contact-signup-keeps-contact-id.md).

## Deleting a merged contact

The Clerk session id finds no row for a merged contact, so [account deletion](../features/account-deletion.md) looks
the row up by the Clerk account's primary email.

## Where it is enforced

- `app/api/webhook/clerk/route.ts`
- `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx` (what counts as verified)

## Sources

- `app/api/webhook/clerk/route.ts`
- `actions/delete-account/index.ts`
- `actions/create-contact/index.ts`
- `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx`
