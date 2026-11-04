---
type: Security
title: Roles
description: There are no roles: every signed-in person can call every action and route, on any group, expense or user, and could once open the admin logs page.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Roles

## Roles

- **Signed out:** the landing page, `/privacy`, and the public routes in `proxy.ts` ([auth](auth.md)).
- **Signed in:** everything else. The schema has no role field, and group membership (`Group.users`) carries no role,
  so the group's creator is not recorded as its owner ([data model](../data/model.md)).

## What each may do

What the code allows today, handler by handler:

- **Reads limited to the caller:** `GET /api/app/group`, `GET /api/app/group/:id`, `getGroup`, `getActivities` and
  the WebAuthn routes.
- **Any user by email:** `searchUser` returns any other user whose email matches exactly, with their friends.
- **Reads of any group or expense by id:** the other `/api/app` routes, the report exports, and `getExpenses`,
  `getExpense`, `getGroupUsers`, `getShare`, `getWhoPaid`:
  [missing membership checks on reads](../findings/missing-group-membership-checks-on-reads.md).
- **Writes to any group, expense or user by id:** `updateGroup`, `deleteGroup`, `updateGroupMember`,
  `updateExpense`, `deleteExpense`, `updateContact`, and `createExpense` with any `createrId`:
  [missing authorization on writes](../findings/missing-authorization-on-writes.md).
- **Any push to anyone:** the push-notification route that took any recipient list ([open push relay](../findings/push-notification-open-relay.md)); it has since been removed.
- **All logs:** the logs page, since removed ([admin logs unprotected](../findings/admin-logs-unprotected.md)).

Under SQL Connect each of these limits is written into the operation: the people and group rules in
`dataconnect/app/people.gql` and `dataconnect/app/groups.gql` ([where each rule lives](../data/sql-connect.md)).
Planned for the running app in spec 2.

Who *should* be able to do what is decided in [group member permissions](../decisions/group-member-permissions.md):
any member of a group, for that group and its expenses. The logs page has been removed
([decision](../decisions/remove-admin-logs-page.md)).

## History

- 2026-11-04: added where SQL Connect enforces the rules; dropped the push relay and admin page from what the code allows, because both routes were removed ([decision](../decisions/remove-admin-logs-page.md)).

## Sources

- `proxy.ts`
- `prisma/schema.prisma`
- `dataconnect/app/people.gql`
- `dataconnect/app/groups.gql`
- `actions/get-group/index.ts`
- `actions/get-activities/index.ts`
- `actions/search-user/index.ts`
- `app/api/app/group/route.ts`
- `app/api/app/group/[id]/route.ts`
