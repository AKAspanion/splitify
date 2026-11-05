---
type: Feature
title: Push notifications
description: Members get a push through Firebase Cloud Messaging when an expense, settlement, group or membership changes; each device registers its token on the signed-in account, and the profile lets a person allow them.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Push notifications

## What it does

After each change, the people involved get a push with a link back to the group or expense, sent by a Cloud Function
from the activity the change recorded ([decision](../decisions/firebase-cloud-messaging.md)). On the profile page a
person can allow notifications in the browser. Who gets which push is in [Cloud Functions](../apps/functions.md).

## Devices

- `lib/push/register.ts`: `registerWebPush` asks permission, gets the browser's FCM token (service worker
  `public/sw.js`, the one service worker the offline cache shares ([service worker](../operations/service-worker.md)), public VAPID key `NEXT_PUBLIC_FIREBASE_VAPID_KEY`) and registers it with `RegisterMyPushToken`; `listenForIosToken` registers the token the iOS wrapper hands
  over in its `push-token` event; `unregisterThisDevice` removes this device's token. None of them ever rejects, and
  they log only the error's class, never a token.
- The token is kept in `localStorage` under `splitify.pushToken` so sign-out knows which one to remove; sign-out
  (`lib/firebase/auth.ts`) removes it before signing out, and goes on whatever happens.
- `app/launch.tsx` starts the iOS listener for a signed-in person and re-registers the browser's token when permission is already granted, without ever raising the prompt; `app/(platform)/profile/notification-action.tsx`
  is the profile's control, which now only turns notifications on (its "Turn off" action went with OneSignal).
- A token belongs to whoever is signed in on that device now: registering one another person holds moves it.
- The push messaging uses its own named Firebase app, with the sender id taken from the web app id, until the
  sender id moves into `lib/firebase/app.ts`.

## Rules

- Notification links are made absolute with `NEXT_PUBLIC_HOST_URL` (`getUrlWithHost` in `utils/validate.ts`).
- Not exercised in a real browser yet: the FCM token flow needs the VAPID key and the real project, and is tested
  through fakes only.

## History

- 2026-11-05: the browser's push worker was `public/firebase-messaging-sw.js`; now `public/sw.js`, shared with the offline cache. See [service worker](../operations/service-worker.md).
- 2026-11-05: was a OneSignal push, sent by server actions, with OneSignal service workers; now FCM, sent by Cloud Functions, with tokens registered per device, because of [the decision](../decisions/firebase-cloud-messaging.md).

## Sources

- `lib/push/register.ts`
- `lib/firebase/auth.ts`
- `lib/firebase/app.ts`
- `public/sw.js`
- `app/launch.tsx`
- `app/(platform)/profile/notification-action.tsx`
- `functions/src/push-activity.ts`
- `dataconnect/app/push-tokens.gql`
- `utils/validate.ts`
