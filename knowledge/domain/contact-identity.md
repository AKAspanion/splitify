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

## Rule once Firebase Auth replaces Clerk

A contact is a `User` with `signedUp: false` and an `spuser_` id ([users](../data/user.md)). When a person signs up
with its email, the contact is merged into the new account only if the token's email is verified
(`auth.token.email_verified`): otherwise anyone could take over a contact's history by signing up with its address.
`mergeContactOnSignUp` (`functions/src/merge-contact.ts`), triggered by `UpsertMe`, moves the contact's memberships,
payments, splits, friendships (both ways), expenses and activity onto the new account, then deletes the contact, in
one transaction (`dataconnect/admin/merge.gql`). The new account keeps its own id, which ends the id mismatch in
[contact sign-up keeps the contact's id](../findings/contact-signup-keeps-contact-id.md). Planned for the running app
in spec 2; the Clerk webhook above is still what runs today.

## Where it is enforced

- `app/api/webhook/clerk/route.ts`
- `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx` (what counts as verified)

## History

- 2026-11-04: added the Firebase rule beside the Clerk one, because the merge function was built.

## Sources

- `app/api/webhook/clerk/route.ts`
- `actions/create-contact/index.ts`
- `functions/src/merge-contact.ts`
- `dataconnect/admin/merge.gql`
- `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx`
