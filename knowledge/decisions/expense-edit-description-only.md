---
type: Decision
title: Editing an expense changes only its description
description: An expense's description is the only thing that can be edited; amounts, payers, splits and category are corrected by deleting the expense and adding it again.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:55:12Z
---

# Editing an expense changes only its description

## Context

`UpdateExpense` and its handler accept only `id` and `description`. Whether amounts, payers, splits and category
should be editable too was open ([question](../questions/expense-edit-scope.md)).

## Decision

Editing an expense stays limited to its description. Anything else is corrected by deleting the expense and adding
it again.

Decided by the developer, from the ga dashboard, on 2026-11-04.

## Consequences

- An expense's amounts, payers and splits never change after they are recorded, so balances only move when an
  expense is added or deleted, and the activity feed shows each of those.
- A corrected expense is a new expense, with its own id and history.

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (actions/update-expense/index.ts, actions/update-expense/schema.ts) as plain text, so verify no longer expects them; the decision itself is unchanged.

## Sources

- actions/update-expense/index.ts
- actions/update-expense/schema.ts
