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

`functions/package.json` lists `@google-cloud/functions-framework` though no code imports it. `functions/` has its
own `pnpm-lock.yaml`, so Cloud Build installs it with pnpm, and with pnpm the Node.js buildpack refuses to build
unless the Framework is a declared dependency (with npm it adds it itself). Keeping `functions/` out of the root
workspace is what keeps that lockfile in the uploaded folder ([run locally](../operations/run-locally.md)).

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
  that is theirs alone, then deletes their Firebase Auth user, in that order so a retry after a failure finishes the job.
  It refuses a sign-in older than 5 minutes (`unauthenticated`) and revokes the caller's refresh tokens first
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

## Instance cap

`functions/src/global-options.ts` calls `setGlobalOptions({ maxInstances: 10 })`, and `index.ts` imports it first, so
every function is capped at 10 instances and one request flood can't scale the bill without bound. The kill switch
overrides it with `maxInstances: 1`.

## The guard

Every HTTP function the browser calls runs `guard` (`functions/src/http/guard.ts`) first: it verifies the Firebase ID
token from `Authorization: Bearer` with the admin SDK (`verifyIdToken(token, true)`, so Auth is asked about revocation,
one lookup per request), then reads the JSON body (at most 65536 bytes), and answers `401`, `413`, `415` or `400`
itself. A missing token, or a check error whose code is in `REFUSED_SIGN_IN_CODES`, is `401` "Sign in again to
continue." (logged `guard: sign-in refused`); any other failure of the check (an Auth outage, quota, the network; not a failed fetch of Google's signing keys, which firebase-admin reports as `auth/argument-error` and so reads as a refusal, [accepted](../findings/guard-accepts-revoked-id-tokens.md)) is
`500` "Something went wrong. Try again." (logged `guard: sign-in check failed`). Both logs carry the error's class and
code. The callable gets its caller from Firebase, which doesn't check revocation, and neither does SQL Connect
([finding](../findings/callable-and-sql-connect-accept-revoked-id-tokens.md)). The browser side is
`lib/functions/call.ts` ([auth](../security/auth.md)). Logs carry an error's class, never its message. The Auth
emulator always checks revocation, so an emulator test can't show the check is missing.

## Who may invoke them

Cloud Run answers 403 before any code runs unless the service lets `allUsers` invoke it, so the two HTTP functions
declare `invoker: "public"` (`reports`, `webauthn`) and every deploy sets it; the guard above is what actually checks
the caller. The callable `deleteMyAccount` gets the Cloud Run Invoker role (roles/run.invoker) only when it is created, so a lost binding is
restored by hand ([deploy setup](../operations/deploy-setup.md)).

## History

- 2026-11-06: the guard didn't ask Auth about revocation and answered `401` for every failed check; now it passes `checkRevoked`, answers `401` only for a missing token or a refused credential and `500` when the check itself fails, because a token revoked by an account deletion still worked for an hour and an Auth outage looked like a bad sign-in. See [the fixed finding](../findings/guard-accepts-revoked-id-tokens.md).
- 2026-11-06: the HTTP functions relied on Cloud Run's default policy and production answered 403 before any code ran; now `reports` and `webauthn` declare `invoker: "public"` and the callable's binding is restored by hand if lost, because the services had empty IAM policies. See [deploy setup](../operations/deploy-setup.md).

- 2026-11-06: functions had no instance cap and `deleteMyAccount` took any sign-in; now every function is capped at 10 instances and deleting needs a sign-in from the last 5 minutes, because the security review found both gaps.
- 2026-11-05: the deploy workflow deployed the functions; now a project owner deploys them by hand. See [the decision](../decisions/ci-cd-functions-deployed-by-hand.md).
- 2026-11-05: had the merge, the push senders and the kill switch; now also `reports`, `webauthn` and `deleteMyAccount`, because spec 2c moved the server's work into functions. See [decision](../decisions/static-build-on-firebase-hosting.md).
- 2026-11-05: had the merge and the kill switch; now also the three push senders, because pushes moved to FCM.

## Sources

- `functions/src/index.ts`
- `functions/src/global-options.ts`
- `functions/src/account/delete-my-account.ts`
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
- `functions/pnpm-lock.yaml`
- `firebase.json`
