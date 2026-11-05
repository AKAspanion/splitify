---
type: Decision
title: A person's share of an expense shows the same net amount everywhere
description: The "You owe" line on an expense shows owed minus paid, the same net figure as "You get back" and the group's balances, not the whole split amount.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T16:00:40Z
verified: human:ankitp@geekyants.com
---

# A person's share of an expense shows the same net amount everywhere

## Context

`yourShareInExpense` in `app/(platform)/(app)/_utils/expense.ts` works out `paid - owed`. When it is positive the line
says "You get back" that difference; otherwise it says "You owe" the whole `owed` amount. So someone who paid 50 of a
300 expense and owes 100 saw "You owe ₹ 100" while the balances said 50
([question](../questions/your-share-owe-amount.md)).

## Decision

A person's share shows the same amount everywhere: "You owe" shows the net amount, `owed - paid`, as "You get back"
and the group's balances already do.

Decided by the developer, from the ga dashboard, on 2026-11-04.

## Consequences

- The example above reads "You owe ₹ 50", matching the balances.
- Someone who paid exactly their share has nothing to owe or get back on that expense.

## Sources

- `app/(platform)/(app)/_utils/expense.ts`
