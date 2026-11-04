---
type: Finding
title: Group reads don't check membership
description: Several read routes and actions only check for a session, so any signed-in person can read any group's expenses, members, shares and reports by id.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Group reads don't check membership

## Finding

These return data for the group or expense id they are given, to any signed-in caller, without checking that the
caller is a member of the group:

- `GET /api/app/group/:id/expense`, `GET /api/app/group/:id/users`, `GET /api/app/group/:id/your-share/:expenseId`,
  `GET /api/app/expense/:id/who-paid`;
- `POST /api/generate/excel/expense`, `POST /api/generate/csv/expense`, `POST /api/generate/text/expense`;
- the actions `getExpenses`, `getExpense`, `getGroupUsers`, `getShare` and `getWhoPaid`.

`GET /api/app/group/:id` and `getGroup` do check, with `users: { some: { id: userId } }`.

## Evidence

Each of the files below queries by the given id with no membership condition, after the `auth()` check.

## Status

Open.

## Sources

- `app/api/app/group/[id]/expense/route.ts`
- `app/api/app/group/[id]/users/route.ts`
- `app/api/app/group/[id]/your-share/[expenseId]/route.ts`
- `app/api/app/expense/[id]/who-paid/route.ts`
- `app/api/generate/excel/expense/route.ts`
- `app/api/generate/csv/expense/route.ts`
- `app/api/generate/text/expense/route.ts`
- `actions/get-expenses/index.ts`
- `actions/get-expense/index.ts`
- `actions/get-group-users/index.ts`
- `actions/get-share/index.ts`
- `actions/get-who-paid/index.ts`
- `app/api/app/group/[id]/route.ts`
- `actions/get-group/index.ts`
