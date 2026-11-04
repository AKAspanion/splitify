---
type: Finding
title: Push-notification routes are an open relay
description: Any signed-in person can push any text to any user, and forge activity entries in any group under another person's name.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Push-notification routes are an open relay

## Finding

- `POST /api/push-notification` sends the `heading` and `content` in the body to every `external_id` in the body,
  through the app's OneSignal account.
- The other notification routes take the actor from `body.userId`, not from `auth()`, and the group from the body,
  then write an `Activity` naming that actor in that group and notify its members. A caller can forge "X added
  expense ..." entries anywhere.

## Evidence

- `app/api/push-notification/route.ts` passes the body to `sendNotification` after the session check.
- `app/api/push-notification/create-expense/route.ts` and its siblings read `body?.userId` as the creator.

## Status

Open.

## Sources

- `app/api/push-notification/route.ts`
- `app/api/push-notification/create-expense/route.ts`
- `app/api/push-notification/update-group-member/route.ts`
- `lib/onesignal.ts`
