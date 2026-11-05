---
type: API Contract
title: App API (removed)
description: The read-only /api/app route handlers are gone; the screens read through SQL Connect queries in lib/data/.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# App API (removed)

There is no `/api/app` route any more: the app has no server ([architecture](../project/architecture.md)). Each screen
reads through the hooks in `lib/data/` (react-query over the SQL Connect SDK), and the hook runs a query of the `app`
connector ([SQL Connect schema](../data/sql-connect.md)):

- the caller's groups, with `searchText`, are `lib/data/groups.ts`;
- one group, its members and its expenses (paged) are `lib/data/groups.ts` and `lib/data/expenses.ts`;
- the "you owe / you get back" and "who paid" lines are computed in the browser from the expense, by
  `yourShareInExpense` and `whoPaidExpense` in `app/(platform)/(app)/_utils/expense.ts`.

## Rules

- A query answers only for a signed-in caller and, for a group or expense, only for its members: the rule is in the
  query's `@auth` expression ([roles](../security/roles.md)), which closes
  [missing membership checks on reads](../findings/missing-group-membership-checks-on-reads.md).

## History

- 2026-11-05: was six `GET /api/app/...` route handlers behind Clerk, most without a membership check; now removed, because spec 2c removed the server and the screens read SQL Connect. See [static build decision](../decisions/static-build-on-firebase-hosting.md).

## Sources

- `lib/data/groups.ts`
- `lib/data/expenses.ts`
- `app/(platform)/(app)/_utils/expense.ts`
- `dataconnect/app/groups.gql`
- `dataconnect/app/expenses.gql`
