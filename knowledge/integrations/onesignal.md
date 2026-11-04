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

## What it is used for

- In the browser, `app/launch.tsx` initialises `react-onesignal`, prompts for push, and calls `OneSignal.login` with
  the Clerk user id; `app/layout.tsx` loads OneSignal's web SDK script; the service workers are
  `public/OneSignalSDKWorker.js` and `public/OneSignalSDK.sw.js`.
- On the server, `sendNotification` in `lib/onesignal.ts` posts to OneSignal's `/notifications` endpoint, targeting
  users by `include_aliases.external_id` on the `push` channel, with a `web_url` and `app_url` built from
  `NEXT_PUBLIC_HOST_URL`. It is called by the [push-notification API](../api/push-notification.md).

- `deleteOneSignalUser` in `lib/onesignal.ts` deletes a deleted account's OneSignal user by external id (the Clerk user
  id). It never throws and treats `404` as already gone; [account deletion](../features/account-deletion.md) calls it
  after the transaction commits.

## Configuration

`NEXT_PUBLIC_ONE_SIGNAL_APP_ID`, `NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID` and `ONE_SIGNAL_REST_API_KEY`
([environment](../operations/environment.md)).

## Failure modes

- `sendNotification` and `deleteOneSignalUser` never throw: a network error comes back as `{ errors: [message] }`.
- The notification routes use `Promise.allSettled`, so one failed push doesn't stop the others or the activity
  write; each result is logged with `APILogger.info`.
- A person who never allowed push, or never opened the web app signed in, gets nothing.

## History

- 2026-11-04: had no user deletion; now `deleteOneSignalUser`, because Play requires deleting the data tied to a deleted account. See [the decision](../decisions/anonymise-deleted-accounts.md).

## Sources

- `lib/onesignal.ts`
- `app/launch.tsx`
- `app/layout.tsx`
- `public/OneSignalSDKWorker.js`
- `public/OneSignalSDK.sw.js`
- `app/api/push-notification/create-expense/route.ts`
