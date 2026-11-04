---
type: Business Rule
title: Split types
description: An expense is split EQUAL, EXACT or PERCENT; paid and split amounts must each add up to the total, and balances are rebuilt from the stored rows.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Split types

## Rule

- **EQUAL:** the form divides the total by the number of people ticked, rounded to two places, and stores that
  amount on each `UserSplit`. When balances are computed, an equal expense ignores the stored amounts and splits
  every payment equally among the people who have a split row.
- **EXACT:** each person's amount is entered; it is stored and used as is.
- **PERCENT:** each person's percent is entered; the form turns it into an amount, and both `UserSplit.amount` and
  `UserSplit.percent` are stored. Balances use the stored amount, exactly as for EXACT.
- **Totals must match.** `CreateExpense` (`actions/create-expense/schema.ts`) rejects an expense whose payments,
  or whose splits, don't add up to `amount`. Both sides are compared after rounding to whole units
  (`fixedNum(total, 0)`), so a difference under half a rupee passes.
- **Several payers:** each payment is spread over the splits in proportion. The engine records one expense per payer
  with percent splits (`SplitifyService.addExpense` in `lib/splitify/service/splitify-service.ts`), and for EXACT it
  first checks that the splits and the payments total the same.

## Where it is enforced

- On save: the zod schema in `actions/create-expense/schema.ts`, through `createSafeAction`.
- In the form: the split editors in `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/`.
- When balances are computed: `evaluateExpense` in `app/(platform)/(app)/_utils/calculation.ts` maps each stored expense onto the split
  engine in `lib/splitify/`.

## Sources

- `actions/create-expense/schema.ts`
- `lib/splitify/service/splitify-service.ts`
- `lib/splitify/repository/expense-repository.ts`
- `app/(platform)/(app)/_utils/calculation.ts`
- `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/equal.tsx`
- `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/percent.tsx`
- `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/exact.tsx`
- `utils/validate.ts`
