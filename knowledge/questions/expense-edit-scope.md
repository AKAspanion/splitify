---
type: Open Question
title: Should editing an expense change more than its description?
description: updateExpense only changes the description; amounts, payers and splits can't be edited, only deleted and re-added.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Should editing an expense change more than its description?

## Question

Is editing meant to be limited to the description, or should amounts, payers, splits and category be editable too?

## Why it matters

`UpdateExpense` and its handler accept only `description` and `id`; correcting an amount means deleting the
expense and adding it again, which loses its history.

## Status

Answered: only the description is editable. See [expense edit description only](../decisions/expense-edit-description-only.md).

## Sources

- `actions/update-expense/index.ts`
- `actions/update-expense/schema.ts`
