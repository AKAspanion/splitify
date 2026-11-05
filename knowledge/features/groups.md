---
type: Feature
title: Groups
description: Create a group, see its expenses, balances and totals, edit it, add members, and delete it.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Groups

## What it does

A group is where shared expenses live. A person creates one with a title, a type (`GROUP_TYPES` in
`constants/ui.ts`: trip, home, couple, project, event, other), a description and a placeholder image, and becomes its
first member. The group screen has three tabs, Expenses, Balances and Totals (`app/(platform)/(app)/(screens)/groups/[id]/expenses-tabs.tsx`),
plus its activity, its members and settings.

## Screens and routes

- List: `app/(platform)/(app)/(screens)/groups/page.tsx`, fed by `useMyGroups`.
- Create: `app/(platform)/(app)/(forms)/groups/add/page.tsx`, calling `useCreateGroup`.
- One group: `app/(platform)/(app)/(screens)/groups/[id]/page.tsx`; expenses page through `useGroupExpenses`; balances
  come from `useGroupLedger` ([balances](balances.md)).
- Edit: `app/(platform)/(app)/(forms)/groups/[id]/edit/page.tsx`, calling `useUpdateGroup`.
- Add a member: `app/(platform)/(app)/(screens)/groups/[id]/add-member/page.tsx`, calling `useAddGroupMember`.
- Settings and delete: `app/(platform)/(app)/(screens)/groups/[id]/settings/page.tsx`; `group-delete.tsx` asks for confirmation,
  then calls `useDeleteGroup`.
- Group activity: `app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx`.

## Data

On the hosted site every group screen reads and writes through `lib/data/groups.ts` over [SQL Connect](../data/sql-connect.md);
none calls a server action. A group the caller can't read, or that is gone, shows "We couldn't find that" with a link to
`/groups`. "Download report" is hidden until the reports move to a Cloud Function (spec 2c): [reports](reports.md).
The dashboard was a stub and stays one.

## Rules

- Group images are placeholders the create form picks: `/images/placeholder/groups/<n>.png`
  (`app/(platform)/(app)/(forms)/groups/add/form.tsx`).
- Any signed-in user can edit or delete any group, or add a member to it, by its id:
  [missing authorization on writes](../findings/missing-authorization-on-writes.md). The rule is any member of the
  group ([group member permissions](../decisions/group-member-permissions.md)).
- Deleting a group deletes its expenses and activity ([data model](../data/model.md)).
- Each change notifies through the [push-notification API](../api/push-notification.md).

## History

- 2026-11-05: read through the API and server actions; now through `lib/data/groups.ts`, with Download report hidden, because spec 2b moved the screens onto SQL Connect.

## Sources

- `constants/ui.ts`
- `app/(platform)/(app)/(screens)/groups/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/expenses-tabs.tsx`
- `app/(platform)/(app)/(forms)/groups/add/page.tsx`
- `app/(platform)/(app)/(forms)/groups/add/form.tsx`
- `app/(platform)/(app)/(forms)/groups/[id]/edit/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/add-member/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/settings/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/settings/group-delete.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx`
- `hooks/use-expenses.ts`
- `actions/create-group/index.ts`
- `actions/update-group/index.ts`
- `actions/delete-group/index.ts`
- `actions/update-group-member/index.ts`
- `lib/data/groups.ts`
