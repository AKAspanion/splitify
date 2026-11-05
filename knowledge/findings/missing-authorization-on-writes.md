---
type: Finding
title: Fixed: writes didn't check who may change what
description: Any signed-in person could update or delete any group or expense, add anyone to any group, rename any user and record expenses as someone else; SQL Connect's operations now check membership.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Fixed: writes didn't check who may change what

## Finding

As found, before the server was removed:

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

Fixed. The server actions are gone; each write is a SQL Connect operation whose `@auth` rule checks that the caller is a member of the group, or owns the contact, in the same transaction ([roles](../security/roles.md), [group member permissions](../decisions/group-member-permissions.md)). The rule tests are `pnpm test:rules`.

## History

- 2026-11-05: was Open, naming the server actions; now Fixed, because the server was removed and SQL Connect's rules check each write.

## Sources

- `dataconnect/app/groups.gql`
- `dataconnect/app/people.gql`
- `dataconnect/expense/expense-writes.gql`
