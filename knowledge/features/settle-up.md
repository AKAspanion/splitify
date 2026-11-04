---
type: Feature
title: Settle up
description: Record that one member paid another back, from a balance line, as a settlement expense.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Settle up

## What it does

Each line on a group's balances links to the settle screen with the two people and the amount filled in. The person
can change the amount and confirm; the app records it as a settlement and notifies the group.

## Screens and routes

- `app/(platform)/(app)/(forms)/groups/[id]/settle/page.tsx`, reached from `balances-list.tsx` with `user1Id`, `user2Id` and
  `owes` in the query string. The form (`app/(platform)/(app)/(forms)/groups/[id]/settle/(form)/form.tsx`) calls
  `createSettlement`, then `POST /api/push-notification/create-settlement`.

## Rules

- `user1Id` is the one who pays and `user2Id` the one paid. How a settlement is stored is in
  [settlements](../domain/settlements.md).

## Sources

- `app/(platform)/(app)/(forms)/groups/[id]/settle/page.tsx`
- `app/(platform)/(app)/(forms)/groups/[id]/settle/settle-expense.tsx`
- `app/(platform)/(app)/(forms)/groups/[id]/settle/(form)/form.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/balances-list.tsx`
- `actions/create-settlement/index.ts`
