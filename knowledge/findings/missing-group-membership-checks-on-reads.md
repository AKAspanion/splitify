---
type: Finding
title: Fixed: group reads didn't check membership
description: Several read routes and actions only checked for a session, so any signed-in person could read any group's expenses, members, shares and reports by id; SQL Connect's queries and the reports function now check membership.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Fixed: group reads didn't check membership

## Finding

As found, before the server was removed:

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

Fixed. The routes and actions are gone. Reads are SQL Connect queries whose `@auth` rule limits them to the caller's groups, and the `reports` function answers members only, with one answer for a group that does not exist and one the caller isn't in ([roles](../security/roles.md), [reports](../features/reports.md)).

## History

- 2026-11-05: was Open, naming the removed routes and actions; now Fixed, because reads are SQL Connect queries with membership rules and the reports function checks membership.

## Sources

- `dataconnect/app/groups.gql`
- `dataconnect/app/expenses.gql`
- `functions/src/reports/index.ts`
