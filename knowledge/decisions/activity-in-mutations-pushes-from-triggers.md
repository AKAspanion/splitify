---
type: Decision
title: Each mutation writes its activity; a Cloud Functions trigger sends the push
description: The SQL Connect mutation that makes a change writes its Activity row in the same transaction, and an onMutationExecuted trigger sends that activity's push through FCM, so nothing the browser sends names the actor, the recipients or the text.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T07:23:21Z
---

# Each mutation writes its activity; a Cloud Functions trigger sends the push

## Context

[Server actions record activity and send notifications themselves](activity-and-notifications-in-actions.md) moved the
activity and the pushes out of the browser-called `/api/push-notification` routes and into the server actions, which
sent through OneSignal. Spec 2c then removed the server: there are no server actions, and pushes go through FCM
([FCM](firebase-cloud-messaging.md), [static build](static-build-on-firebase-hosting.md)). The two guarantees that
decision gave still have to hold: an activity entry for every change that commits, and no push whose actor, recipients
or text the browser chose ([open push relay](../findings/push-notification-open-relay.md)).

## Decision

- Each SQL Connect mutation that changes a group, a member, a friendship, an expense or a settlement inserts its
  `Activity` row in the same `@transaction` as the change, with the actor taken from the signed token
  (`dataconnect/app/groups.gql`, `people.gql`, `expenses.gql`, `dataconnect/expense/expense-writes.gql`).
- An `onMutationExecuted` trigger per connector (`sendActivityPushApp`, `sendActivityPushExpense` in
  `functions/src/push-activity.ts`) runs after each mutation, keeps only the operations it pushes for, and sends the
  push for that activity through FCM, with the recipients read from the database and the text from
  `functions/src/activity-text.ts`. A deleted group's push takes its title and members from what `DeleteGroup`
  returns, read before the delete.
- A failed push is logged by its class and dropped: it never fails or undoes the change.

## Consequences

- The activity feed has an entry for every change that commits, whatever the browser does afterwards.
- Nothing a browser sends can name the actor, the recipients or the text of a push.
- A trigger can't be filtered on a list of operations, so each handler checks the operation name itself.

## Sources

- `functions/src/push-activity.ts`
- `functions/src/activity-text.ts`
- `dataconnect/app/groups.gql`
- `dataconnect/app/people.gql`
- `dataconnect/app/expenses.gql`
- `dataconnect/expense/expense-writes.gql`
