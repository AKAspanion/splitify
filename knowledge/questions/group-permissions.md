---
type: Open Question
title: Who may change a group, an expense or a contact?
description: The code lets any signed-in person change anything. What should the rules be: any member, the creator, or an owner role?
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Who may change a group, an expense or a contact?

## Question

Which people should be able to:

- edit a group, add or remove its members, or delete it: any member, or only its creator?
- edit or delete an expense: any member of its group, or only who recorded it?
- edit a contact's name and email: only the person who added it?

## Why it matters

The answer decides how [missing authorization on writes](../findings/missing-authorization-on-writes.md) is fixed.
A creator-only rule needs the group's creator stored, and `Group` has no field for one
([roles](../security/roles.md)).

## Status

Open

## Sources

- `prisma/schema.prisma`
- `actions/update-group/index.ts`
- `actions/delete-group/index.ts`
