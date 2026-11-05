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
  `useCreateSettlement` (`lib/data/expenses.ts`), which writes through the `expense` connector's `CreateSettlement`
  ([SQL Connect](../data/sql-connect.md)); the push to the group is sent by a Cloud Function, not by the form.

## Rules

- `user1Id` is the one who pays and `user2Id` the one paid. How a settlement is stored is in
  [settlements](../domain/settlements.md).

## Offline

Recording a settlement works offline: it is queued like an expense and its form opens offline for a group seen before ([decision](../decisions/queue-offline-writes.md)). The offline toast has its own wording.

## History

- 2026-11-05: had nothing about offline; now a settlement queues offline, because the offline feature was built. See [offline](offline.md).
- 2026-11-05: called the `createSettlement` action and the push API; now `useCreateSettlement` over SQL Connect, because spec 2b moved the screen.

## Sources

- `app/(platform)/(app)/(forms)/groups/[id]/settle/page.tsx`
- `app/(platform)/(app)/(forms)/groups/[id]/settle/settle-expense.tsx`
- `app/(platform)/(app)/(forms)/groups/[id]/settle/(form)/form.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/balances-list.tsx`
- `dataconnect/expense/expense-writes.gql`
- `lib/data/expenses.ts`
