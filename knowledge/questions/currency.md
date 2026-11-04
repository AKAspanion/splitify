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

Open

## Sources

- `prisma/schema.prisma`
- `constants/ui.ts`
