---
type: Application
title: Cloud Functions
description: The Firebase Cloud Functions in functions/: the reports and webauthn HTTP functions, deleteMyAccount, the contact merge, the push senders and the budget kill switch.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-04T18:30:00Z
verified: human:ankitp@geekyants.com
---

# Cloud Functions

Node 24 functions in `functions/`, built with their own `typescript` and `tsconfig.json` (test files excluded),
deployed by hand with `pnpm deploy:functions` from a project owner's machine, not by the deploy workflow
([decision](../decisions/ci-cd-functions-deployed-by-hand.md)). `functions/src/index.ts` exports them. All run in
`asia-south1`.

## Functions

- `reports` (`functions/src/reports/index.ts`): HTTP, `POST /api/reports/expenses` with `{ groupId, format }`, format
  `excel`, `csv` or `text`; Hosting rewrites `/api/reports/**` to it. It answers members of the group only (a group
  that does not exist and one the caller isn't in answer the same 404) and reads through the `admin` connector. See
  [reports](../features/reports.md) and [the reports API](../api/generate.md).
- `webauthn` (`functions/src/webauthn/index.ts`): HTTP, the six `/api/webauthn/*` routes of the
  [biometric lock](../features/biometric-lock.md); Hosting rewrites `/api/webauthn/**` to it. It holds the registered
  devices in `AuthnDevice.devices` through the `admin` connector, and the challenge between a request's options and its
  verification in an iron-session cookie named `__session` (the only cookie Hosting forwards to a function). It uses
  the `SESSION_PASSWORD` secret (at least 32 characters, else it answers 500) and the params `AUTHN_RP_ID` and
  `AUTHN_EXPECTED_ORIGIN`, whose defaults are the production host. See [the WebAuthn API](../api/webauthn.md).
- `deleteMyAccount` (`functions/src/account/delete-my-account.ts`, `anonymise.ts`): a callable. It deletes the groups
  whose only member is the caller (with their expenses and activity), anonymises the caller's row and removes the data
  that is theirs alone, then deletes their Firebase Auth user, in that order so a retry after a failure finishes the job
  ([decision](../decisions/anonymise-deleted-accounts.md), [profile](../features/profile.md)).
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

## The guard

Every HTTP function the browser calls runs `guard` (`functions/src/http/guard.ts`) first: it verifies the Firebase ID
token from `Authorization: Bearer` with the admin SDK, then reads the JSON body (at most 65536 bytes), and answers
`401`, `413`, `415` or `400` itself. The callable gets its caller from Firebase. The browser side is
`lib/functions/call.ts` ([auth](../security/auth.md)). Logs carry an error's class, never its message.

## History

- 2026-11-05: the deploy workflow deployed the functions; now a project owner deploys them by hand. See [the decision](../decisions/ci-cd-functions-deployed-by-hand.md).
- 2026-11-05: had the merge, the push senders and the kill switch; now also `reports`, `webauthn` and `deleteMyAccount`, because spec 2c moved the server's work into functions. See [decision](../decisions/static-build-on-firebase-hosting.md).
- 2026-11-05: had the merge and the kill switch; now also the three push senders, because pushes moved to FCM.

## Sources

- `functions/src/index.ts`
- `functions/src/merge-contact.ts`
- `functions/src/kill-switch.ts`
- `functions/src/push-activity.ts`
- `functions/src/reports/index.ts`
- `functions/src/webauthn/index.ts`
- `functions/src/webauthn/session.ts`
- `functions/src/account/delete-my-account.ts`
- `functions/src/account/anonymise.ts`
- `functions/src/http/guard.ts`
- `lib/functions/call.ts`
- `functions/src/activity-text.ts`
- `functions/package.json`
- `firebase.json`
