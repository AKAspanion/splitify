---
type: Data Model
title: Expense, payments and splits
description: An Expense records the total; UserPayment rows say who paid how much; UserSplit rows say who owes how much.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Expense, payments and splits

## Fields

- `Expense.amount` is the total, a `Float`. `Expense.currency` defaults to `inr`, as do the currency fields of
  `UserPayment`, `UserSplit` and `Group`; nothing in the app sets another (see
  [currency](../questions/currency.md)).
- `Expense.type` is an `ExpenseType`: `EQUAL`, `EXACT` or `PERCENT`, the way it was split
  ([split types](../domain/split-types.md)).
- `Expense.tag` is an `ExpenseTag`: `EXPENSE` for an ordinary expense, `SETTLEMENT` for a payment between two people
  ([settlements](../domain/settlements.md)). `Expense.settlement` (a boolean) is in the schema but no action writes it.
- `Expense.category` is free text; the form offers `EXPENSE_CATEGORY_TYPES` from `constants/ui.ts`, and
  `createExpense` defaults it to `General`.
- `Expense.createrId` (spelled so in the schema) is the user who recorded it, and `Expense.groupId` the group.
- `UserPayment.amount` is what one user paid towards the expense.
- `UserSplit.amount` is what one user owes of it; `UserSplit.percent` is kept as well for a percent split.

## Rules

- Each expense stores amounts, not just ratios: for every type, the payments and the splits must each add up to the
  total ([split types](../domain/split-types.md)).
- Payment and split rows go when their expense goes (`onDelete: Cascade`).

## Sources

- `prisma/schema.prisma`
- `actions/create-expense/index.ts`
- `actions/create-expense/schema.ts`
- `constants/ui.ts`
