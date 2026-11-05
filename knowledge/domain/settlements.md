---
type: Business Rule
title: Settlements
description: Paying someone back is stored as an EXACT expense tagged SETTLEMENT: the payer pays the full amount and the payee owes it, so it cancels their debt.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Settlements

## Rule

- The `CreateSettlement` mutation creates an `Expense` with `type` `EXACT`, `tag` `SETTLEMENT` and the description
  "Settlement", one `UserPayment` for the payer and one `UserSplit` for the payee, both for the full amount, and a
  `SETTLEMENT_PLUS` activity naming the payee. In balances this moves the amount from one to the other like any expense.
  Both people must be members of the group.
- Totals leave settlements out: `evaluateTotals` filters out expenses whose `tag` is `SETTLEMENT`.
- Deleting a settlement runs `DeleteExpense`, which records `EXPENSE_MINUS` whatever the tag; the `SETTLEMENT_MINUS`
  activity type exists and is drawn by the activity card, but no mutation writes it now.

## Where it is enforced

- `CreateSettlement` in `dataconnect/expense/expense-writes.gql`, called by `createSettlement` in `lib/data/expense-writes.ts`
- `DeleteExpense` in `dataconnect/app/expenses.gql`
- `evaluateTotals` in `app/(platform)/(app)/_utils/calculation.ts`

## History

- 2026-11-05: settlements were made by the `createSettlement` action (category `settlement`, a "<payer> paid <payee>" description) and a deleted one recorded `SETTLEMENT_MINUS`; now the `CreateSettlement` mutation with the description "Settlement", and a delete records `EXPENSE_MINUS`, because spec 2c removed the actions and the push routes.

## Sources

- `dataconnect/expense/expense-writes.gql`
- `dataconnect/app/expenses.gql`
- `lib/data/expense-writes.ts`
- `app/(platform)/(app)/_utils/calculation.ts`
