---
type: Decision
title: Deleting an account anonymises the person, keeping shared expenses
description: When someone deletes their account, their user row stays so the groups they shared still add up, but everything that identifies them is removed; their expenses, payments and splits are kept.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:24:00Z
---

# Deleting an account anonymises the person, keeping shared expenses

## Context

Google Play requires an app that lets people create an account to let them delete it, in the app and from a web link,
and to delete the data tied to it. In Splitify a person's expenses, payments and splits are also other members' records:
removing them would change what everyone else in those groups owes, with nobody told why.

Deleting everything, including the expenses the person created, was the alternative.

## Decision

- Deleting an account keeps the person's `User` row, their group memberships and every expense, payment and split
  they're part of, so other members' balances and history don't change.
- Everything on that row that identifies them (name, email, pictures) is replaced, and the data that is theirs alone
  is removed. Exactly what is replaced and removed is set in the spec of the Play Store update.
- Other members then see "Deleted user" where the person used to appear.

## Consequences

- Shared expense history outlives the account; the privacy policy has to say so.
- The person can sign up again with the same email as a new, unrelated user.

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (app/api/webhook/clerk/route.ts, prisma/schema.prisma) as plain text, so verify no longer expects them; the decision itself is unchanged.

## Sources

- prisma/schema.prisma
- app/api/webhook/clerk/route.ts
