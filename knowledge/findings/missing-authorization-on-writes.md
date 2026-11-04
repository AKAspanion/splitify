---
type: Finding
title: Writes don't check who may change what
description: Any signed-in person can update or delete any group or expense, add anyone to any group, rename any user, and record expenses as someone else.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Writes don't check who may change what

## Finding

The server actions check only that there is a session:

- `updateGroup`, `deleteGroup` and `updateGroupMember` act on any `groupId`;
- `updateExpense` and `deleteExpense` act on any expense id;
- `updateContact` changes the `email` and `name` of any user id, including people who signed up through Clerk, not
  only the caller's own contacts;
- `createExpense` stores the `createrId` from the form, and payments and splits for any user ids, in any group;
- `createSettlement` and `createFriend` (with a `groupId`) likewise accept any group.

## Evidence

Each handler goes from `auth()` straight to `db.*.update`, `delete` or `create` with ids from its input.

## Status

Open.

## Sources

- `actions/update-group/index.ts`
- `actions/delete-group/index.ts`
- `actions/update-group-member/index.ts`
- `actions/update-expense/index.ts`
- `actions/delete-expense/index.ts`
- `actions/update-contact/index.ts`
- `actions/create-expense/index.ts`
- `actions/create-settlement/index.ts`
- `actions/create-friend/index.ts`
