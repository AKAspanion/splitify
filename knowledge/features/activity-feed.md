---
type: Feature
title: Activity feed
description: A paged list of what happened in the caller's groups: expenses, settlements, members and group changes.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Activity feed

## What it does

Shows, newest first, every `Activity` in a group the caller belongs to, or that names the caller, fifteen at a time
(`ACTIVITY_PAGE_COUNT` in `constants/numbers.ts`). A group's own activity is on its activity tab.

## Screens and routes

- `app/(platform)/(app)/(screens)/activity/page.tsx` with `activity-list.tsx` and `activity-paginate.tsx`, using `getActivities`
  (`actions/get-activities/index.ts`) and `hooks/use-activities.ts`.
- `app/(platform)/(app)/(screens)/activity/[id]/page.tsx`: renders only "Activity not found", whatever the id.
- `app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx`.

## Rules

- Activity rows are written by the [push-notification API](../api/push-notification.md), not by the actions; the decision to move them into the actions is
  [activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md). The types are `ActivityType` in the
  [data model](../data/model.md).

## Sources

- `app/(platform)/(app)/(screens)/activity/page.tsx`
- `app/(platform)/(app)/(screens)/activity/activity-list.tsx`
- `app/(platform)/(app)/(screens)/activity/activity-paginate.tsx`
- `app/(platform)/(app)/(screens)/activity/[id]/page.tsx`
- `app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx`
- `actions/get-activities/index.ts`
- `hooks/use-activities.ts`
- `constants/numbers.ts`
