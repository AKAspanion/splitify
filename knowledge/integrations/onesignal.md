---
type: Integration
title: OneSignal (removed)
description: OneSignal is removed; pushes go through Firebase Cloud Messaging, sent by Cloud Functions.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# OneSignal (removed)

Nothing uses OneSignal any more: its web SDK script, lib/onesignal.ts and the `NEXT_PUBLIC_ONE_SIGNAL_*` and
`ONE_SIGNAL_REST_API_KEY` keys are gone from the code. Devices register FCM tokens and Cloud Functions triggers send the
pushes ([decision](../decisions/firebase-cloud-messaging.md), [notifications](../features/notifications.md),
[push functions](../apps/functions.md)). The OneSignal keys stay in `.env.sample` until the developer removes them
([environment](../operations/environment.md)).

## History

- 2026-11-05: still sent pushes from the server actions; now removed, because spec 2c moved the sending to FCM in Cloud Functions.
- 2026-11-05: the browser registered with OneSignal under the user id; now it does not, because devices register FCM tokens instead. See [the decision](../decisions/firebase-cloud-messaging.md).

## Sources

- `functions/src/push-activity.ts`
- `.env.sample`
