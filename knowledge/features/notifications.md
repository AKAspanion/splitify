---
type: Feature
title: Push notifications
description: Members get a OneSignal push when an expense, settlement, group or membership changes; the profile page lets a person allow them.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Push notifications

## What it does

After each change, the people involved get a push with a link back to the group or expense. Who gets which push is
listed in the [push-notification API](../api/push-notification.md). On the profile page a person can allow
notifications in the browser.

## Screens and routes

- `app/launch.tsx` starts OneSignal for a signed-in person, prompts for push, and logs in to OneSignal with their
  user id, which is the `external_id` pushes are sent to.
- `app/(platform)/profile/notification-action.tsx`: asks the browser for permission.
- The OneSignal service workers are `public/OneSignalSDKWorker.js` and `public/OneSignalSDK.sw.js`.

## Rules

- Notification links are made absolute with `NEXT_PUBLIC_HOST_URL` (`getUrlWithHost` in `utils/validate.ts`).
- Setup and failure handling are in [OneSignal](../integrations/onesignal.md).

## Sources

- `app/launch.tsx`
- `app/(platform)/profile/notification-action.tsx`
- `public/OneSignalSDKWorker.js`
- `public/OneSignalSDK.sw.js`
- `utils/validate.ts`
