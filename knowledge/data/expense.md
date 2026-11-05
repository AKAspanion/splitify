---
type: Data Model
title: Expense, payments and splits
description: An Expense records the total; UserPayment rows say who paid how much; UserSplit rows say who owes how much.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Expense, payments and splits

## Fields

- `Expense.amount` is the total, a `Float`. `Expense.currency` and `Group.currency` default to `inr`; nothing in the app sets another
  ([multi-currency](../decisions/multi-currency.md) decides how others will work).
- `Expense.type` is an `ExpenseType`: `EQUAL`, `EXACT` or `PERCENT`, the way it was split
  ([split types](../domain/split-types.md)).
- `Expense.tag` is an `ExpenseTag`: `EXPENSE` for an ordinary expense, `SETTLEMENT` for a payment between two people
  ([settlements](../domain/settlements.md)).
- `Expense.category` is free text; the form offers `EXPENSE_CATEGORY_TYPES` from `constants/ui.ts`, and
  `CreateExpense` defaults it to `General`.
- `Expense.creator` is the user who recorded it, and `Expense.group` the group.
- `UserPayment.amount` is what one user paid towards the expense.
- `UserSplit.amount` is what one user owes of it; `UserSplit.percent` is kept as well for a percent split.

## Rules

- Each expense stores amounts, not just ratios: for every type, the payments and the splits must each add up to the
  total ([split types](../domain/split-types.md)).
- Payment and split rows go when their expense goes (a required reference cascades; [SQL Connect schema](sql-connect.md)).

## History

- 2026-11-05: described the Prisma fields (`createrId`, `settlement`); now the SQL Connect ones (`creator`, `group`), because spec 2c removed Prisma and the actions. See [SQL Connect schema](sql-connect.md).

## Sources

- `dataconnect/schema/schema.gql`
- `dataconnect/expense/expense-writes.gql`
- `constants/ui.ts`
