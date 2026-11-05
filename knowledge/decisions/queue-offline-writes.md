---
type: Decision
title: Queue offline writes with react-query mutation defaults
description: Adding an expense or a settlement offline is a paused react-query mutation whose function is registered by key, so it survives a reload; a repeated id counts as success and a rejection is rolled back by id.
status: draft
generated:
  by: ga-plugin/after-finish
  at: 2026-11-05T00:00:00Z
---

# Queue offline writes with react-query mutation defaults

## Context

[Offline, people can read everything and add expenses and settlements](offline-first-scope.md) needs a queue that
outlives a reload. A paused mutation saved with the cache loses its function when the page reloads, unless the
mutation's behaviour is registered by key.

## Decision

- `CreateExpense` and `CreateSettlement` have mutation defaults registered by key (`CREATE_EXPENSE_KEY`,
  `CREATE_SETTLEMENT_KEY`) in `lib/offline/queued-writes.ts`, so paused writes resume after a reload.
- The optimistic row is marked "Waiting to sync" and is not a link.
- Network errors are retried up to 3 times (provisional, for the developer to confirm).
- A write the server rejects is rolled back by its id, not by a snapshot, so other changes made meanwhile stay, and
  the app toasts "An expense you added offline couldn't be saved: <reason>".
- A repeated id is success: the retry of a write that had already reached the server must not fail. `isDuplicateIdError`
  is checked before `toUserMessage` (see [SQL Connect](../data/sql-connect.md) for the error's shape).
- Offline, the forms mutate, toast "Expense saved. It will sync when you're back online." (the settlement has its own
  wording; both provisional) and go back at once instead of waiting.

## Consequences

- The ids are made in the browser, which the duplicate rule depends on ([expenses](../features/expenses.md)).
- The banner counts queued changes ([offline](../features/offline.md)).

## Sources

- `lib/offline/queued-writes.ts`
- `lib/data/expenses.ts`
- `components/providers.tsx`
