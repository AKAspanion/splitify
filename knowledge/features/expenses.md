---
type: Feature
title: Expenses
description: Record what someone paid in a group and how it is split, see each expense's breakdown, edit its description, or delete it.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Expenses

## What it does

A person picks a group, enters a description (at least 3 characters), an amount and a category, chooses who paid
(one or several people, in the payment drawer) and how it is split (equally, exactly or by percent, in the split
drawer). The expense screen then shows who paid, the caller's share, and each member's balance on that expense.

## Screens and routes

- Add: `app/(platform)/(app)/(forms)/expense/add/page.tsx`; the form is `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`, with
  `payment-drawer.tsx`, `split-drawer.tsx` and the split editors in `_splits/`. It calls `useCreateExpense` (`lib/data/expenses.ts`).
- One expense: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.tsx`, which
  computes "who paid" and the caller's share in the browser (`whoPaidExpense`, `yourShareInExpense` in
  `app/(platform)/(app)/_utils/expense.ts`).
- Edit: `app/(platform)/(app)/(forms)/expense/[id]/edit/page.tsx`, calling `useUpdateExpense`.
- Delete: `expense-actions.tsx` on the expense screen, calling `useDeleteExpense`.

## Rules

- How amounts are split and checked is in [split types](../domain/split-types.md).
- Editing changes only the description, by decision: [expense edit description only](../decisions/expense-edit-description-only.md).
- The creator is always the signed-in person (`creatorId_expr: "auth.uid"`), and only members of the group can read, edit or
  delete one of its expenses ([missing authorization on writes](../findings/missing-authorization-on-writes.md), fixed).
- Amounts are shown with `RUPEE_SYMBOL` (`constants/ui.ts`); other currencies are decided in [multi-currency](../decisions/multi-currency.md).

## How it reads and writes

The screens read and write through `lib/data/expenses.ts` (`useExpense`, `useCreateExpense`, `useUpdateExpense`,
`useDeleteExpense`) and `lib/data/expense-writes.ts`. Reading, editing and deleting an expense is limited to members of its
group, written in the operations in `dataconnect/app/expenses.gql`; creating one is in the `expense` connector
([schema and connectors](../data/sql-connect.md)). Every id is made in the browser with `crypto.randomUUID()`. The caller's
line on an expense is the net amount ([balances](balances.md)).

## Offline

Adding an expense offline queues it: the card shows "Waiting to sync" and isn't a link, and `useCreateExpense` retries
and rolls back as [queue offline writes](../decisions/queue-offline-writes.md) says. The add form reads the same
queries as the group screens (`useGroupMembers` and the groups list), so it opens offline for a group the person has
seen. Delete and edit are online-only ([offline](offline.md)).

## History

- 2026-11-05: had no offline behaviour; now adding queues offline, because the offline feature was built. See [decision](../decisions/queue-offline-writes.md).
- 2026-11-05: the creator came from the form and any signed-in user could change any expense, through server actions; now the creator is the caller and only members can, in SQL Connect, because spec 2c removed the actions.
- 2026-11-05: planned for the running app; now the screens use it, because spec 2b moved them onto SQL Connect.
- 2026-11-04: added the SQL Connect limits, because the expense operations were built.

## Sources

- `app/(platform)/(app)/(forms)/expense/add/page.tsx`
- `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`
- `app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`
- `app/(platform)/(app)/(forms)/expense/add/(form)/split-drawer.tsx`
- `app/(platform)/(app)/(forms)/expense/[id]/edit/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-actions.tsx`
- `app/(platform)/(app)/_utils/expense.ts`
- `dataconnect/expense/expense-writes.gql`
- `constants/ui.ts`
- `dataconnect/app/expenses.gql`
- `lib/data/expenses.ts`
- `lib/data/expense-writes.ts`
- `lib/offline/queued-writes.ts`
