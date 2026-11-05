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

A contact is a `User` with `signedUp: false` and an `spuser_` id ([users](../data/user.md)). When a person signs up with
its email, the contact is merged into the new account only if the token's email is verified
(`auth.token.email_verified`): otherwise anyone could take over a contact's history by signing up with its address.
`mergeContactOnSignUp` (`functions/src/merge-contact.ts`), triggered by `UpsertMe`, moves the contact's memberships,
payments, splits, friendships (both ways), expenses and activity onto the new account, then deletes the contact, in
one transaction (`dataconnect/admin/merge.gql`). The new account keeps its own id, the Firebase uid, which ended the id
mismatch in [contact sign-up keeps the contact's id](../findings/contact-signup-keeps-contact-id.md). The friend page
stops showing "Verification pending" once the contact is a signed-up user.

Clerk's webhook, which used to write a signed-up person onto the contact's row and keep the `spuser_` id, is removed
([Clerk](../integrations/clerk.md)).

## Where it is enforced

- `functions/src/merge-contact.ts` and `dataconnect/admin/merge.gql`
- `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx` (what counts as verified)

## History

- 2026-11-05: had a Clerk-webhook rule that kept the contact's id; now only the verified-email merge, because spec 2c removed Clerk and its webhook.
- 2026-11-04: added the Firebase rule beside the Clerk one, because the merge function was built.

## Sources

- `functions/src/merge-contact.ts`
- `dataconnect/admin/merge.gql`
- `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx`
