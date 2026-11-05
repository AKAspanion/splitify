---
type: Feature
title: Activity feed
description: A paged list of what happened in the caller's groups: expenses, settlements, members and group changes.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Activity feed

## What it does

Shows, newest first, every `Activity` in a group the caller belongs to, or that names the caller, fifteen at a time
(`ACTIVITY_PAGE_COUNT` in `constants/numbers.ts`). A group's own activity is on its activity tab.

## Screens and routes

- `app/(platform)/(app)/(screens)/activity/page.tsx` with `activity-list.tsx` and `activity-paginate.tsx`, using the hooks in
  `lib/data/activity.ts`.
- `app/(platform)/(app)/(screens)/activity/[id]/page.tsx`: renders only "Activity not found", whatever the id.
- `app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx`.

## Rules

- Each activity row is written by the SQL Connect mutation that makes the change, in the same transaction, and the push is
  sent by a function trigger ([activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md),
  [push functions](../apps/functions.md)). The types are `ActivityType` in the [data model](../data/model.md).

## How it reads

The screens use `lib/data/activity.ts` (`useMyActivity`, `useActivity`, `useGroupActivity`). A group's feed has no query of
its own: it is the person's feed filtered in the browser, read in chunks of 50 up to a cap, so a quiet group costs several
reads. The feed text is built by `activityLine`, which says "You" for the caller, including "You added <name> as a friend".

The feed returns each activity's type, actor, subject, title and amount, from which its text is built, through the operations in
`dataconnect/app/activity.gql`; deleting an expense records `EXPENSE_MINUS` first, and that activity survives the
delete ([schema and connectors](../data/sql-connect.md)).

## History

- 2026-11-05: rows were written by the push-notification routes, and the screens read through a server action; now the mutations write them and the screens read `lib/data/activity.ts`, because spec 2c removed the server.
- 2026-11-05: planned for the running app; now the screens use it, with the group feed filtered in the browser, because spec 2b moved them onto SQL Connect.
- 2026-11-04: added the SQL Connect shape, because the activity operations were built.

## Sources

- `app/(platform)/(app)/(screens)/activity/page.tsx`
- `app/(platform)/(app)/(screens)/activity/activity-list.tsx`
- `app/(platform)/(app)/(screens)/activity/activity-paginate.tsx`
- `app/(platform)/(app)/(screens)/activity/[id]/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx`
- `constants/numbers.ts`
- `dataconnect/app/activity.gql`
- `lib/data/activity.ts`
