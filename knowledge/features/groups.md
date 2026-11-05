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

Every group screen reads and writes through `lib/data/groups.ts` over [SQL Connect](../data/sql-connect.md);
there is no server action. A group the caller can't read, or that is gone, shows "We couldn't find that" with a link to
`/groups`. "Download report" calls the reports function ([reports](reports.md)).
The dashboard was a stub and stays one.

## Rules

- Group images are placeholders the create form picks: `/images/placeholder/groups/<n>.png`
  (`app/(platform)/(app)/(forms)/groups/add/form.tsx`).
- Any member of a group can edit it, delete it or add a member, and nobody else can: the rule is in the SQL Connect
  operations ([group member permissions](../decisions/group-member-permissions.md),
  [missing authorization on writes](../findings/missing-authorization-on-writes.md), fixed).
- Deleting a group deletes its expenses and activity ([data model](../data/model.md)).
- Each change writes its activity row, and a function trigger sends the push ([push functions](../apps/functions.md)).

## Offline

Creating, deleting and changing a group are online-only: `OnlineOnly` disables them offline with "You're offline. This needs a connection." The group screens are readable offline from the saved cache ([decision](../decisions/offline-first-scope.md)).

## History

- 2026-11-05: had nothing about offline; now group changes are online-only and screens read the saved cache, because the offline feature was built. See [offline](offline.md).
- 2026-11-05: Download report was hidden, any signed-in user could change any group and pushes came from the push API; now the report is back, only members can change a group and triggers push, because spec 2c removed the server.
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
- `lib/data/groups.ts`
