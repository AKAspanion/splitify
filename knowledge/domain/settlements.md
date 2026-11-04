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

- `createSettlement` creates an `Expense` with `type` `EXACT`, `tag` `SETTLEMENT` and `category`
  `settlement`, one `UserPayment` for `user1Id` and one `UserSplit` for `user2Id`, both for the full amount, and the
  description "<payer> paid <payee>". In balances this moves the amount from one to the other like any expense.
- Totals leave settlements out: `evaluateTotals` filters out expenses whose `tag` is `SETTLEMENT`.
- Deleting a settlement records `SETTLEMENT_MINUS` instead of `EXPENSE_MINUS`.

## Where it is enforced

- `actions/create-settlement/index.ts`
- `evaluateTotals` in `app/(platform)/(app)/_utils/calculation.ts`
- `app/api/push-notification/delete-expense/route.ts`

## Sources

- `actions/create-settlement/index.ts`
- `actions/create-settlement/schema.ts`
- `app/(platform)/(app)/_utils/calculation.ts`
- `app/api/push-notification/delete-expense/route.ts`
