---
type: Business Rule
title: Debt simplification
description: A group's balances are reduced to the fewest payments with a greedy minimum-cash-flow pass: the biggest debtor pays the biggest creditor, repeatedly.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Debt simplification

## Rule

From everyone's net balance in the group, the largest debtor pays the largest creditor as much as settles one of
them, and this repeats until everyone is at zero. The result is the "who owes whom" list on the Balances tab. Amounts
are rounded to two places at each step (`fixedNum`). The detailed, unsimplified balances are available with
`detailed = true`.

## Where it is enforced

- `MinifySplitsService` in `lib/splitify/service/minify-splits-service.ts`: `createGraph` builds the
  who-owes-whom matrix from `SplitifyService.getBalancesTable()`, and `execute` runs `minCashFlow`.
- Called by `calcGroupSplits` and `calcExpenseSplits` in `app/(platform)/(app)/_utils/calculation.ts`.

## Sources

- `lib/splitify/service/minify-splits-service.ts`
- `lib/splitify/service/splitify-service.ts`
- `app/(platform)/(app)/_utils/calculation.ts`
