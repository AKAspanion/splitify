---
type: Security
title: Roles
description: There are no roles: every signed-in person can call every action and route, on any group, expense or user, and open the admin logs page.
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
- The `app/(admin)` route group, which holds `/logs`, has no check beyond the Clerk session.

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
- **Any push to anyone:** `POST /api/push-notification` ([open push relay](../findings/push-notification-open-relay.md)).
- **All logs:** `/logs` ([admin logs unprotected](../findings/admin-logs-unprotected.md)).

Who *should* be able to do what is [an open question](../questions/group-permissions.md).

## Sources

- `proxy.ts`
- `prisma/schema.prisma`
- `app/(admin)/layout.tsx`
- `app/(admin)/logs/page.tsx`
- `actions/get-group/index.ts`
- `actions/get-activities/index.ts`
- `actions/search-user/index.ts`
- `app/api/app/group/route.ts`
- `app/api/app/group/[id]/route.ts`
