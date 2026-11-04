---
type: Integration
title: OneSignal
description: Web push notifications: the browser registers with OneSignal under the user's id, and the server sends pushes through OneSignal's REST API.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# OneSignal

Being replaced by [Firebase Cloud Messaging](../decisions/firebase-cloud-messaging.md). The browser no longer uses
it: `react-onesignal`, its service workers and the login in the launch component are gone, and devices register FCM tokens
([notifications](../features/notifications.md)). What is left is the server side, until the server actions that call
it move to Cloud Functions (spec 2c, planned).

## What it is used for

- `app/layout.tsx` still loads OneSignal's web SDK script.
- On the server, `sendNotification` in `lib/onesignal.ts` posts to OneSignal's `/notifications` endpoint, targeting
  users by `include_aliases.external_id` on the `push` channel, with a `web_url` and `app_url` built from
  `NEXT_PUBLIC_HOST_URL`. It is called by the [push-notification API](../api/push-notification.md).

## Configuration

`NEXT_PUBLIC_ONE_SIGNAL_APP_ID`, `NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID` and `ONE_SIGNAL_REST_API_KEY`
([environment](../operations/environment.md)).

## Failure modes

- `sendNotification` never throws: a network error comes back as `{ errors: [message] }`.
- The notification routes use `Promise.allSettled`, so one failed push doesn't stop the others or the activity
  write; each result is logged with `APILogger.info`.
- A person who never allowed push, or never opened the web app signed in, gets nothing.

## History

- 2026-11-05: the browser registered with OneSignal under the user id; now it does not, because devices register FCM tokens instead. See [the decision](../decisions/firebase-cloud-messaging.md).

## Sources

- `lib/onesignal.ts`
- `app/layout.tsx`
