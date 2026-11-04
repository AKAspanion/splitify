---
type: Data Model
title: Data model
description: The Prisma schema over MySQL: users, groups, expenses with their payments and splits, activity, devices, logs and feedback.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Data model

## Entities

<!-- GA-GENERATED:models prisma -->

- `Activity`: `prisma/schema.prisma`
- `AuthnDevice`: `prisma/schema.prisma`
- `Expense`: `prisma/schema.prisma`
- `Feedback`: `prisma/schema.prisma`
- `Group`: `prisma/schema.prisma`
- `Log`: `prisma/schema.prisma`
- `User`: `prisma/schema.prisma`
- `UserPayment`: `prisma/schema.prisma`
- `UserSplit`: `prisma/schema.prisma`

<!-- GA-GENERATED:END -->

- [Users](user.md): people who signed up through Clerk, and offline contacts.
- `Group`: a set of users who share expenses. `Group.type` holds one of `GROUP_TYPES` in `constants/ui.ts`.
- [Expenses](expense.md): an `Expense` with its `UserPayment` rows (who paid) and `UserSplit` rows (who owes).
- `Activity`: one line in the [activity feed](../features/activity-feed.md), typed by `ActivityType`.
- `AuthnDevice`: one row per user holding all their WebAuthn devices as JSON in `AuthnDevice.data`; see
  [WebAuthn API](../api/webauthn.md).
- `Log`: rows written by `APILogger` when DB logging is on; see [logging](../operations/logging.md).
- `Feedback`: what a person sent from the feedback form. `Feedback.userId` is `@unique`, so each person has at most one.

## Relations

- `User` and `Group` are many-to-many (`User.groups`, `Group.users`): membership has no row or role of its own.
- Friendship is a self-relation named `UserFriends`. `User.symmetricFriends` exists only because Prisma needs the
  second side, as the schema's comment says; the app reads `User.friends`, and `createFriend` connects both
  directions.
- Deleting a `Group` cascades to its expenses and activity; deleting an `Expense` cascades to its payments and splits
  (`onDelete: Cascade` in the schema).
- The datasource uses `relationMode = "prisma"`, so Prisma, not MySQL, enforces the relations, and each foreign key
  has an `@@index`.

## Sources

- `prisma/schema.prisma`
- `constants/ui.ts`
- `actions/create-friend/index.ts`
