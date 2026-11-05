---
type: Feature
title: Balances and totals
description: Show who owes whom in a group, simplified to the fewest payments, and how much the group and the caller have spent.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Balances and totals

## What it does

- **Balances** lists, for the whole group, who owes whom and how much, with a link on each line to settle it.
- **Totals** shows the group's total spend and the caller's own spend.
- On a single expense, each member's balance for that expense, and the caller's "You owe" or "You get back" line.

## Screens and routes

- Group balances: `app/(platform)/(app)/(screens)/groups/[id]/balances-list.tsx`, which calls `calcGroupSplits`.
- Group totals: `app/(platform)/(app)/(screens)/groups/[id]/totals-list.tsx`, which calls `evaluateTotals`.
- Expense balances: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list.tsx`, which calls
  `calcExpenseSplits`.
- The caller's share: `yourShareInExpense` in `app/(platform)/(app)/_utils/expense.ts`, no longer an API call.

## Rules

- Balances are computed in the browser from the group's expenses, payments and splits; none is stored
  ([architecture](../project/architecture.md)). `GetGroupLedger` returns them, `toLedgerExpenses` (`lib/data/ledger.ts`)
  shapes them as the split engine's `ExpenseWithPaymentWithSplit`, and the engine itself is unchanged.
- How each expense contributes is in [split types](../domain/split-types.md); how the debts are reduced to the fewest
  payments is in [debt simplification](../domain/debt-simplification.md).
- Totals leave out settlements ([settlements](../domain/settlements.md)).
- The caller's line on one expense shows the net amount (paid minus owed), as the balances do, and "You are settled up" at zero:
  [your share shows the net amount](../decisions/your-share-shows-net-amount.md). The settled-up wording is the implementer's,
  not the decision's.

## History

- 2026-11-05: was computed per request from the API's data and "You owe" the whole split; now computed in the browser from `GetGroupLedger`, with the net amount, because spec 2b moved the screens onto SQL Connect.

## Sources

- `app/(platform)/(app)/(screens)/groups/[id]/balances-list.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/totals-list.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list.tsx`
- `app/(platform)/(app)/_utils/calculation.ts`
- `app/(platform)/(app)/_utils/expense.ts`
- `dataconnect/app/expenses.gql`
- `lib/data/ledger.ts`
