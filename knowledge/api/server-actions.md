---
type: API Contract
title: Server actions
description: Every write in Splitify is a Next.js server action in actions/, validated by zod through createSafeAction and checked for a Clerk session.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Server actions

## Routes

Server actions have no URL; they are called from client components through `useAction` (`hooks/use-action.ts`).

| Action | Folder | What it does |
|---|---|---|
| `createGroup` | `actions/create-group/` | creates a group with the caller as its only member |
| `updateGroup` | `actions/update-group/` | changes a group's title, type and description |
| `deleteGroup` | `actions/delete-group/` | deletes a group (cascades to its expenses and activity) |
| `updateGroupMember` | `actions/update-group-member/` | adds a user to a group |
| `createExpense` | `actions/create-expense/` | creates an expense with its payments and splits |
| `updateExpense` | `actions/update-expense/` | changes an expense's description only |
| `deleteExpense` | `actions/delete-expense/` | deletes an expense |
| `createSettlement` | `actions/create-settlement/` | records that one user paid another ([settlements](../domain/settlements.md)) |
| `createFriend` | `actions/create-friend/` | makes two users friends, and optionally adds the friend to a group |
| `createContact` | `actions/create-contact/` | creates an offline contact ([users](../data/user.md)) |
| `updateContact` | `actions/update-contact/` | changes a user's name and email |
| `searchUser` | `actions/search-user/` | finds other users by exact email |
| `createFeedback` | `actions/create-feedback/` | saves the caller's feedback |

Reads used by server components: `getGroup`, `getGroupUsers`, `getExpense`, `getExpenses`, `getShare`,
`getWhoPaid` and `getActivities`, each in `actions/get-*/index.ts`.

## Rules

- Each write is `createSafeAction(schema, handler)` (`lib/safe-actions.ts`): the input is parsed with the zod schema
  in the folder's `schema.ts`, and a failure returns `fieldErrors` without running the handler.
- Each handler returns `{ error: "Unauthorized" }` when `auth()` has no user. None checks that the caller belongs to
  the group, or owns the expense or contact, it changes: see
  [missing authorization on writes](../findings/missing-authorization-on-writes.md).
- On success a handler calls `revalidatePath` for the screens it affects. Notifications and activity are sent
  afterwards by the client, not by the action ([architecture](../project/architecture.md)).

## Sources

- `lib/safe-actions.ts`
- `hooks/use-action.ts`
- `actions/create-group/index.ts`
- `actions/update-group/index.ts`
- `actions/delete-group/index.ts`
- `actions/update-group-member/index.ts`
- `actions/create-expense/index.ts`
- `actions/update-expense/index.ts`
- `actions/delete-expense/index.ts`
- `actions/create-settlement/index.ts`
- `actions/create-friend/index.ts`
- `actions/create-contact/index.ts`
- `actions/update-contact/index.ts`
- `actions/search-user/index.ts`
- `actions/create-feedback/index.ts`
