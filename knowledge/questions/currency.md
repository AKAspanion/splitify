---
type: Open Question
title: Is more than one currency planned?
description: Every currency field defaults to inr and amounts are always shown with the rupee symbol. Should groups or expenses have their own currency?
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Is more than one currency planned?

## Question

Should Splitify support currencies other than the rupee, per group or per expense?

## Why it matters

The schema already has a `currency` field on `Group`, `Expense`, `UserPayment` and `UserSplit`, all defaulting to
`inr`, but nothing sets it and every screen uses `RUPEE_SYMBOL` from `constants/ui.ts`. Mixed currencies would also
change how balances are added up.

## Status

Answered: currencies per group and per expense, converted at the rate of the group's creation date. See [multi-currency](../decisions/multi-currency.md).

## History

- 2026-11-05: Sources pointed at the Prisma schema; now the SQL Connect schema, which keeps the same `currency` fields, because Prisma was removed.

## Sources

- `dataconnect/schema/schema.gql`
- `constants/ui.ts`
