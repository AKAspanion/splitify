---
type: Data Model
title: Users and contacts
description: A User is either a signed-up person, whose id is their Firebase uid, or an offline contact added by someone, with an spuser_ id.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Users and contacts

## Fields

- `User.id` is the primary key. For a signed-up person it is their Firebase uid, written by `UpsertMe` from the signed
  token; for an offline contact it is `spuser_` plus a random id made in the browser (`contactId` in `lib/data/people.ts`).
- `User.signedUp` is `true` for a signed-up person and `false` for a contact.
- `User.email` is `@index`, not unique: a contact and the account that later signs up with its email share it until the
  merge ([contact identity](../domain/contact-identity.md)); `CreateContact` itself refuses an email another row has.
- `User.imageUrl` comes from the sign-in provider; contacts and deleted accounts get the placeholder
  `public/images/placeholder/avatar.jpeg`.
- Tables, keys and access rules are in [SQL Connect schema](sql-connect.md).

## Rules

- A contact shows as "Verification pending" on its friend page until it becomes a signed-up user
  (`app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx` and `verify-details.tsx`).
- Friendship is symmetric: adding a friend writes both directions ([model](model.md)).
- A deleted account keeps its row, renamed and with its email replaced, so shared expenses still add up
  ([decision](../decisions/anonymise-deleted-accounts.md)).

## History

- 2026-11-05: described Clerk-created rows (`fromClerk`, a unique email, `createContact`'s action); now Firebase uids, `signedUp` and an indexed email, because spec 2c removed Clerk, Prisma and the actions.
- 2026-11-05: a contact's id was made by an action; now in the browser, because spec 2b has no server for it.
- 2026-11-04: added the SQL Connect shape, because its schema was built.

## Sources

- `dataconnect/schema/schema.gql`
- `dataconnect/app/people.gql`
- `lib/data/people.ts`
- `public/images/placeholder/avatar.jpeg`
- `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx`
- `app/(platform)/(app)/(screens)/friends/[id]/verify-details.tsx`
