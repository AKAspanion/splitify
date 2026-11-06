---
type: Finding
title: The expense form restores stale unticks when the group changes from A to B and back with no amount
description: onGroupChange clears the equal-split edits only when an amount is entered, so switching group A to B and back to A without one lays A's old unticks back on, where the old effect ticked everyone.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# The expense form restores stale unticks when the group changes from A to B and back with no amount

## Finding

In `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`, `onGroupChange` clears the equal-split edits only when a
payer and an amount exist. With the amount still empty the edits keep their `usersKey`, so going from group A to B and
back to A without editing in B makes `equalSplitFor` put A's old unticks back. Before the React Compiler lint fix
([finding](react-compiler-lint-warnings.md)) an effect reset the split to everyone ticked. Only the untick state is
wrong; saving checks the split as before ([expenses](../features/expenses.md)).

## Evidence

The repository-modernization run's final review, M3. Suggested fix: clear the edits on every group change, outside the
amount check.

## Status

Open.

## Sources

- `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`
