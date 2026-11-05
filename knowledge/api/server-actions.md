---
type: API Contract
title: Server actions (removed)
description: The Next.js server actions are gone; every write is a SQL Connect mutation run from a lib/data/ hook.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Server actions (removed)

There is no `actions/` folder, no `createSafeAction` and no `useAction` any more: the app has no server
([architecture](../project/architecture.md)). Each write is a SQL Connect mutation run from a hook in `lib/data/`, which
refreshes the affected queries itself, and the mutation's `@auth` rule checks the caller
([SQL Connect schema](../data/sql-connect.md)).

| Was | Now |
|---|---|
| `createGroup`, `updateGroup`, `deleteGroup`, `updateGroupMember` | `lib/data/groups.ts` |
| `createExpense`, `updateExpense`, `deleteExpense`, `createSettlement` | `lib/data/expense-writes.ts` |
| `createFriend`, `createContact`, `updateContact`, `searchUser` | `lib/data/people.ts`, `lib/data/search.ts` |
| `createFeedback` | `lib/data/feedback.ts` |
| `getActivities` and the other `get-*` reads | `lib/data/activity.ts` and the hooks beside it |

## Rules

- A failure reaches the screen as a message a person can read, through `toUserMessage` (`lib/data/errors.ts`), and
  never as the raw error.
- Who may change what is decided by the mutation's rule, which closes
  [missing authorization on writes](../findings/missing-authorization-on-writes.md); the activity row is written in the
  same mutation, and the push is sent by a function trigger ([push notifications](push-notification.md)).

## History

- 2026-11-05: was fifteen server actions wrapped by `createSafeAction`, each checking only for a Clerk session; now removed, because spec 2c removed the server and the screens write through SQL Connect. See [static build decision](../decisions/static-build-on-firebase-hosting.md).

## Sources

- `lib/data/groups.ts`
- `lib/data/expense-writes.ts`
- `lib/data/people.ts`
- `lib/data/search.ts`
- `lib/data/feedback.ts`
- `lib/data/activity.ts`
- `lib/data/errors.ts`
