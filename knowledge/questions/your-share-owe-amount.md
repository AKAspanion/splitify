---
type: Open Question
title: Should 'You owe' show the net amount?
description: On one expense, a person who paid part and owes more is told they owe their whole split, not the difference. Is that intended?
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Should 'You owe' show the net amount?

## Question

`yourShareInExpense` works out `paid - owed`. When it is positive it shows "You get back" that difference; when it is
not, it shows "You owe" the full `owed` amount. Should it show the difference in both cases?

## Why it matters

Someone who paid 50 of a 300 expense and owes 100 sees "You owe ₹ 100", while the balances say 50.

## Status

Answered: it shows the same net amount everywhere, owed minus paid. See [your share shows the net amount](../decisions/your-share-shows-net-amount.md).

## Sources

- `app/(platform)/(app)/_utils/expense.ts`
