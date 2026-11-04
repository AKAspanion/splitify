---
type: API Contract
title: Push-notification API (removed)
description: The /api/push-notification routes the browser called after each write are gone; the server actions now record activity and send pushes themselves.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Push-notification API (removed)

There is no push-notification route any more. Each server action writes its `Activity` row and sends its pushes
after its change commits, through `notifyAfterResponse` in `lib/notification/notify.ts`, with the message text built
in `lib/notification/messages.ts` and the actor taken from the session
([decision](../decisions/activity-and-notifications-in-actions.md)). Pushes go out through `sendNotification` in
`lib/onesignal.ts` ([OneSignal](../integrations/onesignal.md)); a failed push is logged with the activity type only
([logging](../operations/logging.md)).

## Rules

- Nothing a browser sends names the actor, the recipients or the text of a push, which closes
  [the open push relay](../findings/push-notification-open-relay.md).
- Activity exists for every change that commits, whatever the browser does afterwards.

## History

- 2026-11-04: was a set of `POST /api/push-notification/*` routes the browser called after each action, taking the actor and group from the request body; now removed, because the actions do the work themselves. See [activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md).

## Sources

- `lib/notification/notify.ts`
- `lib/notification/messages.ts`
- `lib/onesignal.ts`
