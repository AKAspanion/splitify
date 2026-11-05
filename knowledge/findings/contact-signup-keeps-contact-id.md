---
type: Finding
title: Fixed: a contact who signed up kept the contact's id
description: When a contact signed up, Clerk's webhook kept the spuser_ id on their row, while their session carried Clerk's id, so the app couldn't find them; the merge function now moves the contact's rows to the Firebase uid.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Fixed: a contact who signed up kept the contact's id

## Finding

As found, before the server was removed:

For an email that already belongs to a contact, `POST /api/webhook/clerk` writes the Clerk user onto the contact's
row and keeps its `spuser_` id (`id: userIdFound || data.id`). Every action and route then looks the caller up by
`(await auth()).userId`, which is Clerk's id, so nothing matches that row: the person's groups, friends and expenses as a
contact don't appear for them, and actions such as `createFriend` fail on `db.user.update({ where: { id: userId } })`.
Clerk's id isn't stored anywhere on the row.

This follows from reading the code; it hasn't been reproduced.

## Evidence

- app/api/webhook/clerk/route.ts: `userIdFound` from the email lookup wins over `data.id`.
- actions/create-friend/index.ts, and the others, use `(await auth()).userId` as `User.id`.

## Status

Fixed. A person's `User.id` is their Firebase uid, and `mergeContactOnSignUp` moves a verified contact's rows to it and deletes the contact ([contact identity](../domain/contact-identity.md), [Cloud Functions](../apps/functions.md)).

## History

- 2026-11-05: was Open, naming the webhook and server actions; now Fixed, because ids are Firebase uids and the merge function moves the contact's rows.

## Sources

- `functions/src/merge-contact.ts`
- `dataconnect/admin/merge.gql`
