---
type: Finding
title: Fixed: push-notification routes were an open relay
description: Any signed-in person could push any text to any user, and forge activity entries in any group under another person's name; pushes are now sent by Cloud Functions triggers that take nothing from a request.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Fixed: push-notification routes were an open relay

## Finding

As found, before the server was removed:

- `POST /api/push-notification` sends the `heading` and `content` in the body to every `external_id` in the body,
  through the app's OneSignal account.
- The other notification routes take the actor from `body.userId`, not from `auth()`, and the group from the body,
  then write an `Activity` naming that actor in that group and notify its members. A caller can forge "X added
  expense ..." entries anywhere.

## Evidence

- app/api/push-notification/route.ts passes the body to `sendNotification` after the session check.
- app/api/push-notification/create-expense/route.ts and its siblings read `body?.userId` as the creator.

## Status

Fixed. The routes are removed. A function trigger on each mutation sends the push, to the group's members, with text built from the activity itself, and only for the caller's own change ([push functions](../apps/functions.md), [notifications](../features/notifications.md)).

## History

- 2026-11-05: was Open, naming the removed routes and `lib/onesignal.ts`; now Fixed, because pushes are sent by FCM from triggers that take nothing from a request.

## Sources

- `functions/src/push-activity.ts`
- `functions/src/activity-text.ts`
