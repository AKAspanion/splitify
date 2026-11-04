---
type: Application
title: Cloud Functions
description: The Firebase Cloud Functions in functions/: the contact merge after sign-up, the push senders and the budget kill switch.
status: draft
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-04T18:30:00Z
---

# Cloud Functions

Node 24 functions in `functions/`, built with their own `typescript` and `tsconfig.json` (test files excluded),
deployed by [the deploy workflow](../operations/ci-cd.md). `functions/src/index.ts` exports them.

## Functions

- `mergeContactOnSignUp` (`functions/src/merge-contact.ts`): a SQL Connect trigger on the `app` connector's
  `UpsertMe` mutation, in `asia-south1`. It merges a contact into the verified new account through the `admin`
  connector ([SQL Connect schema](../data/sql-connect.md), [contact identity](../domain/contact-identity.md)).
- `sendActivityPushApp`, `sendActivityPushExpense` and `sendGroupDeletedPush` (`functions/src/push-activity.ts`):
  SQL Connect triggers in `asia-south1` that send each change's push through FCM
  ([decision](../decisions/firebase-cloud-messaging.md), [notifications](../features/notifications.md)). The first
  two listen on every operation of the `app` and `expense` connectors, because a trigger takes one operation and no
  alternation, and the handler's allowlist decides: other mutations, such as `UpsertMe`, start the function and
  return. `sendGroupDeletedPush` filters exactly on `DeleteGroup`.
  - Recipients: every group member except the actor, or the friend an activity names when it has no group. A muted
    group sends nothing. The activity must belong to the trigger's caller (`event.authId`), or nothing is sent, so a
    caller can only push for their own change. Nothing from the request names recipients or text.
  - Text comes from `activityText` (`functions/src/activity-text.ts`) for all twelve activity types; it has no
    viewer parameter, so a member-added push reads the same for the added person as for the others.
  - Tokens come from `ListPushTokens`; FCM's "not registered" and "invalid token" answers delete the token through
    `DeletePushTokens`. Every FCM call has a 10-second deadline, at most 500 tokens go in one multicast, and a failure
    is logged by its class only and never thrown.
- `billingKillSwitch` (`functions/src/kill-switch.ts`, wired in `index.ts`): a Pub/Sub trigger on topic
  `budget-alerts` in `asia-south1`, running as `billing-kill-switch@` with `maxInstances: 1`. It unlinks billing once
  actual spend reaches the budget ([decision](../decisions/budget-kill-switch.md)). Its tests cover
  `parseNotification`, `enforceBudget` and the trigger options; the handler body itself has no direct test.

## History

- 2026-11-05: had the merge and the kill switch; now also the three push senders, because pushes moved to FCM.

## Sources

- `functions/src/index.ts`
- `functions/src/merge-contact.ts`
- `functions/src/kill-switch.ts`
- `functions/src/push-activity.ts`
- `functions/src/activity-text.ts`
- `functions/package.json`
- `firebase.json`
