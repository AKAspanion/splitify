---
type: API Contract
title: Push-notification API (removed)
description: There is no push-notification route; Cloud Functions triggers send each change's push through FCM.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Push-notification API (removed)

There is no push-notification route and no server action that sends one. A Cloud Functions trigger on each SQL Connect
mutation sends the push through FCM, with the recipients and the text built from the activity row, not from anything
the browser sends ([Cloud Functions](../apps/functions.md), [decision](../decisions/firebase-cloud-messaging.md),
[notifications](../features/notifications.md)). The text comes from `functions/src/activity-text.ts`; a failed push is
logged by its class only and never fails the change ([logging](../operations/logging.md)).

## Rules

- Nothing a browser sends names the actor, the recipients or the text of a push, which closes
  [the open push relay](../findings/push-notification-open-relay.md).
- Activity exists for every change that commits, whatever the browser does afterwards.

## History

- 2026-11-05: said the server actions sent pushes through OneSignal (`lib/notification/notify.ts`); now Cloud Functions triggers send them through FCM, because spec 2c removed the server actions and OneSignal. See [decision](../decisions/firebase-cloud-messaging.md).
- 2026-11-04: was a set of `POST /api/push-notification/*` routes the browser called after each action, taking the actor and group from the request body; now removed, because the actions did the work themselves. See [activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md).

## Sources

- `functions/src/push-activity.ts`
- `functions/src/activity-text.ts`
