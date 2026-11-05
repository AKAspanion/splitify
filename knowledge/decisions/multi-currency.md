---
type: Decision
title: Currencies per group and per expense, converted at the group's creation-date rate
description: A group has its own currency and each expense can have its own; an expense in another currency is converted at the exchange rate of the day the group was created, which never changes afterwards.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:53:47Z
verified: human:ankitp@geekyants.com
---

# Currencies per group and per expense, converted at the group's creation-date rate

## Context

Every currency field in the schema defaults to `inr` and every screen shows `RUPEE_SYMBOL`
([question](../questions/currency.md)). Groups that travel or span countries need other currencies, and mixed
currencies change how a group's balances are added up.

## Decision

- Currencies are supported per group and per expense.
- The conversion rate is locked on the group's creation date: an expense in a currency other than its group's is
  converted at the rate of the day the group was created, and that rate doesn't change later.

Decided by the developer, from the ga dashboard, on 2026-11-04.

## Consequences

- A group's balances stay stable: a later expense doesn't move earlier totals because a rate moved.
- For a long-running group, the locked rate can drift far from the day's real rate.
- Not decided yet: where the rates come from, and whether a person can override a rate.

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (prisma/schema.prisma) as plain text, so verify no longer expects them; the decision itself is unchanged.

## Sources

- prisma/schema.prisma
- `constants/ui.ts`
