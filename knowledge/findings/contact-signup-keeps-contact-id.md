---
type: Finding
title: A contact who signs up keeps the contact's id
description: When a contact signs up, Clerk's webhook keeps the spuser_ id on their row, while their session carries Clerk's id, so the app can't find them by session.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# A contact who signs up keeps the contact's id

## Finding

For an email that already belongs to a contact, `POST /api/webhook/clerk` writes the Clerk user onto the contact's
row and keeps its `spuser_` id (`id: userIdFound || data.id`). Every action and route then looks the caller up by
`auth().userId`, which is Clerk's id, so nothing matches that row: the person's groups, friends and expenses as a
contact don't appear for them, and actions such as `createFriend` fail on `db.user.update({ where: { id: userId } })`.
Clerk's id isn't stored anywhere on the row.

This follows from reading the code; it hasn't been reproduced.

## Evidence

- `app/api/webhook/clerk/route.ts`: `userIdFound` from the email lookup wins over `data.id`.
- `actions/create-friend/index.ts`, and the others, use `auth().userId` as `User.id`.

## Status

Open.

## Sources

- `app/api/webhook/clerk/route.ts`
- `actions/create-friend/index.ts`
- `actions/create-contact/index.ts`
