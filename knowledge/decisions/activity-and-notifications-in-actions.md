---
type: Decision
title: Server actions record activity and send notifications themselves
description: Each server action writes its activity entry and sends its push notifications on the server after its change succeeds; the /api/push-notification routes and the browser's NotificationService calls are removed.
status: superseded
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T11:52:00Z
superseded_by: decisions/activity-in-mutations-pushes-from-triggers
---

# Server actions record activity and send notifications themselves

## Context

After each change the browser called an `/api/push-notification/*` route, which wrote the `Activity` row and sent
the pushes. Those routes took the actor and the group from the request body, so anyone signed in could push any text
to anyone and forge activity in any group ([open push relay](../findings/push-notification-open-relay.md)), and an
activity entry existed only if the browser made the second call
([where activity is recorded](../questions/activity-recording-location.md)). Two fixes were offered: keep the routes
and check the session and membership in them, or move the work into the actions. Keeping the routes would still have
had to trust a member list from the browser when a group is deleted, since the group is gone by then.

## Decision

- Each server action that changes a group, a member, an expense, a settlement or a friendship writes its `Activity`
  row in the same transaction as the change, with the session's user as the actor.
- It sends its pushes on the server after the change commits, through lib/onesignal.ts, without making the action
  wait or fail when OneSignal does.
- The `/api/push-notification` routes, `NotificationService` and the browser calls to it are removed.

## Consequences

- The activity feed has an entry for every change that commits, whatever the browser does afterwards.
- Nothing a browser sends can name the actor, the recipients or the text of a push.

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (lib/notification/notify.ts, lib/onesignal.ts) as plain text, so verify no longer expects them; the decision itself is unchanged.
- 2026-11-04: Sources named `lib/notification/service/index.ts` and `app/api/push-notification/route.ts`, the removed route and its client; now lib/notification/notify.ts, because the code those described is gone.

## Sources

- lib/onesignal.ts
- lib/notification/notify.ts
