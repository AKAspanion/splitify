---
type: API Contract
title: App API
description: Read-only JSON route handlers under /api/app that the client's react-query hooks call for groups, expenses and shares.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# App API

## Routes

<!-- GA-GENERATED:routes app/api/app -->

- `GET /api/app/expense/:id/who-paid`: `app/api/app/expense/[id]/who-paid/route.ts`
- `GET /api/app/group`: `app/api/app/group/route.ts`
- `GET /api/app/group/:id`: `app/api/app/group/[id]/route.ts`
- `GET /api/app/group/:id/expense`: `app/api/app/group/[id]/expense/route.ts`
- `GET /api/app/group/:id/users`: `app/api/app/group/[id]/users/route.ts`
- `GET /api/app/group/:id/your-share/:expenseId`: `app/api/app/group/[id]/your-share/[expenseId]/route.ts`

<!-- GA-GENERATED:END -->

- `GET /api/app/group` lists the caller's groups, newest first, six unless `show=true`, filtered by `searchText`.
- `GET /api/app/group/:id` returns one group, only if the caller is a member.
- `GET /api/app/group/:id/expense` pages a group's expenses by `page`, `limit` (default `EXPENSE_PAGE_COUNT` in
  `constants/numbers.ts`) and `queryText`, and returns `{ count, expenses }`.
- `GET /api/app/group/:id/users` lists a group's members.
- `GET /api/app/group/:id/your-share/:expenseId` returns the caller's "you owe / you get back" line for one
  expense, from `yourShareInExpense` in `app/(platform)/(app)/_utils/expense.ts`.
- `GET /api/app/expense/:id/who-paid` returns the "who paid" line for one expense, from `whoPaidExpense`.

## Rules

- Every route returns `401` without a Clerk session.
- Only `GET /api/app/group` and `GET /api/app/group/:id` limit results to the caller's groups. The others return
  any group's or expense's data to any signed-in caller: see
  [missing membership checks on reads](../findings/missing-group-membership-checks-on-reads.md).
- The same reads also exist as server actions (`actions/get-*`), used by server components; see
  [debt](../risks/debt.md).

## Sources

- `app/api/app/group/route.ts`
- `app/api/app/group/[id]/route.ts`
- `app/api/app/group/[id]/expense/route.ts`
- `app/api/app/group/[id]/users/route.ts`
- `app/api/app/group/[id]/your-share/[expenseId]/route.ts`
- `app/api/app/expense/[id]/who-paid/route.ts`
- `app/(platform)/(app)/_utils/expense.ts`
- `constants/numbers.ts`
