---
type: Decision
title: Any group member may change the group and its expenses; contacts only by their friends
description: Every member of a group may edit or delete it, change its members, and edit or delete its expenses; non-members can neither read nor change it. A contact is edited only by someone who has them as a friend, and a Clerk user by nobody else.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T11:30:54Z
verified: human:ankitp@geekyants.com
---

# Any group member may change the group and its expenses; contacts only by their friends

## Context

The security audit of 2026-11-04 confirmed that the server actions and `/api/app` routes check only for a session,
so any signed-in person could read or change any group, expense or user by id
([writes](../findings/missing-authorization-on-writes.md), [reads](../findings/missing-group-membership-checks-on-reads.md)).
The fix needed a rule, which [who may change a group](../questions/group-permissions.md) asked for. The developer was offered
"any member" or "only the creator"; a creator-only rule would have needed a new `Group` column, and existing groups
have no recorded creator.

## Decision

- **Groups:** any member of a group (a user in `Group.users`) may read it, edit it, delete it, and add or remove its
  members. Someone who isn't a member may do none of these.
- **Expenses:** any member of an expense's group may read, edit or delete it. Recording an expense, payment, split
  or settlement in a group requires the caller to be a member, and every user it names to be a member too. The
  expense's creator is the caller, never an id from the request.
- **Contacts:** a contact (a user whose `fromClerk` isn't true) may be edited only by someone who has them as a
  friend. A user who signed up through Clerk is never edited by anyone else: their own details come from Clerk.
- No roles and no schema change.

## Consequences

- One check, "is the caller a member of this group", guards every group-scoped read and write.
- A member can remove anyone, including the group's original creator, and delete the group for everyone. The
  developer chose this over recording an owner.

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (actions/delete-group/index.ts, actions/update-contact/index.ts, actions/update-group/index.ts, prisma/schema.prisma) as plain text, so verify no longer expects them; the decision itself is unchanged.

## Sources

- prisma/schema.prisma
- actions/update-group/index.ts
- actions/delete-group/index.ts
- actions/update-contact/index.ts
