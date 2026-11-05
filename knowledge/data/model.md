---
type: Data Model
title: Data model
description: The entities of the SQL Connect schema: users, groups, expenses with their payments and splits, activity, devices, push tokens and feedback.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Data model

The Prisma schema over MySQL is gone; the model is the SQL Connect schema in `dataconnect/schema/schema.gql`, described in
[SQL Connect schema and connectors](sql-connect.md) (tables, keys, connectors and access rules). Read the file for fields.
What each entity is for:

- [Users](user.md): people who signed up (id is their Firebase uid), and offline contacts (`signedUp: false`).
- `Group`: a set of users who share expenses. `Group.type` holds one of `GROUP_TYPES` in `constants/ui.ts`.
- `GroupMember`: membership, one row per person and group, with no role.
- `Friendship`: one row per direction, so a friendship is two rows.
- [Expenses](expense.md): an `Expense` with its `UserPayment` rows (who paid) and `UserSplit` rows (who owes).
- `Activity`: one line in the [activity feed](../features/activity-feed.md), typed by `ActivityType`.
- `AuthnDevice`: one row per user holding all their WebAuthn devices as JSON in `AuthnDevice.devices`, readable only
  through the `admin` connector; see [WebAuthn API](../api/webauthn.md).
- `PushToken`: a device's FCM token ([notifications](../features/notifications.md)).
- `Feedback`: what a person sent from the feedback form. `Feedback.user` is the key, so each person has at most one.

There is no `Log` table ([decision](../decisions/cloud-logging.md)).

## Relations

- `User` and `Group` are many-to-many through `GroupMember`.
- Deleting a `Group` cascades to its members and expenses, and an `Expense` to its payments and splits; `Activity.group`
  is optional, so deleting a group sets it to null instead ([SQL Connect schema](sql-connect.md)).

## History

- 2026-11-05: described the Prisma schema over MySQL (with `Log` and `AuthnDevice.data`); now points at the SQL Connect schema, because spec 2c removed Prisma and MySQL. See [decision](../decisions/sql-connect-database.md).

## Sources

- `dataconnect/schema/schema.gql`
- `constants/ui.ts`
