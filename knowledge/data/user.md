---
type: Data Model
title: Users and contacts
description: A User is either a Clerk sign-up, created by Clerk's webhook, or an offline contact added by someone, with an spuser_ id.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Users and contacts

## Fields

- `User.id` is the primary key. For a Clerk sign-up it is Clerk's user id, so it equals `(await auth()).userId`. For an
  offline contact, `createContact` sets it to `spuser_` plus a random id (`actions/create-contact/index.ts`).
- `User.fromClerk` is `true` for rows written by Clerk's webhook and `false` for contacts.
- `User.email` is `@unique`: it is how a contact is matched when that person signs up
  ([contact identity](../domain/contact-identity.md)).
- `User.uid` is a separate `nanoid()` value; nothing in the app reads it.
- `User.image_url` and `User.profile_image_url` come from Clerk; contacts get the placeholder
  `public/images/placeholder/avatar.jpeg`.

## Under SQL Connect

A contact is a `User` with `signedUp: false` and an `spuser_` id; a signed-up person's id is their Firebase uid
([schema](sql-connect.md)). `email` is indexed but not unique, so `CreateContact` itself refuses an email another row
already has. Planned for the running app in spec 2.

## Rules

- A contact shows as "Verification pending" on its friend page until it becomes a Clerk user
  (`app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx` and `verify-details.tsx`).
- Friendship is symmetric: `createFriend` connects both users ([model](model.md)).

## History

- 2026-11-04: added the SQL Connect shape, because its schema was built.

## Sources

- `prisma/schema.prisma`
- `dataconnect/schema/schema.gql`
- `dataconnect/app/people.gql`
- `actions/create-contact/index.ts`
- `actions/create-friend/index.ts`
- `app/api/webhook/clerk/route.ts`
- `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx`
- `app/(platform)/(app)/(screens)/friends/[id]/verify-details.tsx`
