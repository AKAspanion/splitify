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
  `payment-drawer.tsx`, `split-drawer.tsx` and the split editors in `_splits/`. It calls `createExpense`.
- One expense: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.tsx`, using
  `GET /api/app/expense/:id/who-paid` and `GET /api/app/group/:id/your-share/:expenseId`.
- Edit: `app/(platform)/(app)/(forms)/expense/[id]/edit/page.tsx`, calling `updateExpense`.
- Delete: `expense-actions.tsx` on the expense screen, calling `deleteExpense`.

## Rules

- How amounts are split and checked is in [split types](../domain/split-types.md).
- Editing changes only the description; see [expense edit scope](../questions/expense-edit-scope.md).
- `createExpense` takes the creator (`createrId`) from the form, not from the session; and any signed-in user can
  edit or delete any expense by its id: [missing authorization on writes](../findings/missing-authorization-on-writes.md).
- Amounts are shown with `RUPEE_SYMBOL` (`constants/ui.ts`); see [currency](../questions/currency.md).

## Sources

- `app/(platform)/(app)/(forms)/expense/add/page.tsx`
- `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`
- `app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`
- `app/(platform)/(app)/(forms)/expense/add/(form)/split-drawer.tsx`
- `app/(platform)/(app)/(forms)/expense/[id]/edit/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-actions.tsx`
- `actions/create-expense/index.ts`
- `actions/create-expense/schema.ts`
- `actions/update-expense/index.ts`
- `actions/delete-expense/index.ts`
- `constants/ui.ts`
