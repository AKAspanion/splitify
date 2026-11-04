---
type: Decision
title: Send push notifications with Firebase Cloud Messaging
description: Pushes move from OneSignal to Firebase Cloud Messaging; each browser and the iOS app register an FCM token on the signed-in person's account, and a Cloud Function triggered by each change sends the push built from its activity.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T19:00:12Z
---

# Send push notifications with Firebase Cloud Messaging

## Context

Pushes went through OneSignal: the browser logged in to OneSignal under the person's id, and each server action
sent its push through OneSignal's REST API ([notifications in actions](activity-and-notifications-in-actions.md)).
With the app moving to the browser, [Firebase Auth](firebase-auth.md) and Cloud Functions, the developer was offered
keeping OneSignal or moving to Firebase Cloud Messaging, and chose FCM. The iOS wrapper already uses Firebase
Messaging and hands its token to the page as a `push-token` event (`packages/ios/src/Splitify/PushNotifications.swift`).

## Decision

- Pushes are sent with Firebase Cloud Messaging from the project's own Cloud Functions; OneSignal, its web SDK and
  its service workers are removed.
- Each device registers its FCM token on the signed-in person's account: a browser through `firebase/messaging` and a
  service worker, the iOS app through the token its `push-token` event carries. A token is removed when the person
  signs out on that device, and when FCM reports it no longer valid.
- A Cloud Function triggered by each SQL Connect mutation that records activity reads that activity and the group's
  members with the admin SDK, builds the text from the activity's fields, and sends it to every member's tokens except
  the actor's own. Nothing the browser sends names the recipients or the text.

## Consequences

- No third-party push service or key: FCM needs only the project's Web Push certificate (a public VAPID key) in the
  browser.
- The iOS app's Firebase config must be this project's (`splitify-416321`), or its tokens can't be sent to.
- The browser's push service worker and spec 4's offline service worker must share one registration.

## Sources

- `lib/onesignal.ts`
- `app/launch.tsx`
- `packages/ios/src/Splitify/PushNotifications.swift`
