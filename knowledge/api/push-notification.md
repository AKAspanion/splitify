---
type: API Contract
title: Push-notification API
description: POST routes the browser calls after each write: they send OneSignal pushes to the people involved and record the Activity row.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Push-notification API

## Routes

<!-- GA-GENERATED:routes app/api/push-notification -->

- `POST /api/push-notification`: `app/api/push-notification/route.ts`
- `POST /api/push-notification/create-expense`: `app/api/push-notification/create-expense/route.ts`
- `POST /api/push-notification/create-friend`: `app/api/push-notification/create-friend/route.ts`
- `POST /api/push-notification/create-group`: `app/api/push-notification/create-group/route.ts`
- `POST /api/push-notification/create-settlement`: `app/api/push-notification/create-settlement/route.ts`
- `POST /api/push-notification/delete-expense`: `app/api/push-notification/delete-expense/route.ts`
- `POST /api/push-notification/delete-group`: `app/api/push-notification/delete-group/route.ts`
- `POST /api/push-notification/update-expense`: `app/api/push-notification/update-expense/route.ts`
- `POST /api/push-notification/update-group`: `app/api/push-notification/update-group/route.ts`
- `POST /api/push-notification/update-group-member`: `app/api/push-notification/update-group-member/route.ts`

<!-- GA-GENERATED:END -->

The client calls these through `NotificationService` (`lib/notification/service/index.ts`) from each form's
`onSuccess`. Request bodies are typed in `types/api.d.ts`.

- `POST /api/push-notification/create-expense`, `/update-expense`, `/create-settlement`: notify every member of the
  group and record `EXPENSE_PLUS`, `EXPENSE_UPDATE` or `SETTLEMENT_PLUS`.
- `POST /api/push-notification/delete-expense`: notifies every member and records `EXPENSE_MINUS`, or
  `SETTLEMENT_MINUS` for a settlement.
- `POST /api/push-notification/create-group`, `/update-group`, `/delete-group`: notify only the person who acted, and
  record `GROUP_PLUS`, `GROUP_UPDATE` or `GROUP_MINUS`.
- `POST /api/push-notification/update-group-member`: tells the added person and the one who added them, and records
  `MEMBER_PLUS`. `NotificationService.createFriend` posts here too, not to `/create-friend`.
- `POST /api/push-notification/create-friend`: notifies a new friend; nothing in the client calls it.
- `POST /api/push-notification`: sends any `heading` and `content` to any list of `external_id`s.

Pushes go out through `sendNotification` in `lib/onesignal.ts` ([OneSignal](../integrations/onesignal.md)); each
result is logged with `APILogger.info` ([logging](../operations/logging.md)).

## Rules

- `401` without a session; `400` when a required id is missing.
- The actor is the `userId` in the request body, not the session's user, and the group is not checked against the
  caller: see [open push relay](../findings/push-notification-open-relay.md).
- Activity is written here, so an activity entry exists only if the browser made this second call after the
  action succeeded. The decision to remove these routes is [activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md).

## Sources

- `lib/notification/service/index.ts`
- `lib/onesignal.ts`
- `types/api.d.ts`
- `app/api/push-notification/route.ts`
- `app/api/push-notification/create-expense/route.ts`
- `app/api/push-notification/update-expense/route.ts`
- `app/api/push-notification/create-settlement/route.ts`
- `app/api/push-notification/delete-expense/route.ts`
- `app/api/push-notification/create-group/route.ts`
- `app/api/push-notification/update-group/route.ts`
- `app/api/push-notification/delete-group/route.ts`
- `app/api/push-notification/update-group-member/route.ts`
- `app/api/push-notification/create-friend/route.ts`
