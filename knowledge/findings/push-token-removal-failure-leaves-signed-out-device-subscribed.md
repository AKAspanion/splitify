---
type: Finding
title: A failed or timed-out push-token removal leaves the signed-out device receiving the account's pushes
description: Sign-out gives up on the token removal after 5 seconds and never unsubscribes the browser from FCM, so the PushToken row and the subscription stay and a shared device keeps showing the account's pushes.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T20:00:00Z
---

# A failed or timed-out push-token removal leaves the signed-out device receiving the account's pushes

## Finding

`unregisterThisDevice` (`lib/push/register.ts`) waits at most `PUSH_REMOVAL_DEADLINE_MS = 5000` for `RemoveMyPushToken`,
then drops the stored token and lets sign-out go on. The wait can't cancel the call, and it often spends the 5 seconds
loading modules before the mutation is sent. When the mutation does go out, the person is already signed out and
`RemoveMyPushToken`'s `@auth` refuses it. A removal that fails outright leaves the same state. The result:

- the `PushToken` row stays on the signed-out user;
- the browser's FCM subscription stays, because sign-out never calls messaging `deleteToken`;
- `public/sw.js` shows every background message whatever the sign-in state.

So a shared device keeps showing the signed-out account's group activity until someone signs in there (registering the
token moves it) or FCM drops the token. Nothing retries. It is the accepted trade-off of the deadline, which exists so
sign-out never hangs ([the fixed finding](sign-out-can-hang-on-push-token-removal.md)).

## Evidence

- Final security review of the open-findings-fixes plan, Minor M1 (`.ga/runs/2026-11-06-open-findings-fixes/reviews/final-security-reviewer.md`).
- Final review, Minor 1 (`.ga/runs/2026-11-06-open-findings-fixes/reviews/final-reviewer.md`).
- `lib/push/register.ts` calls `withDeadline(d.remove(token), PUSH_REMOVAL_DEADLINE_MS)`; no code under `lib/` calls `deleteToken`.

## Status

Open.

## Sources

- `lib/push/register.ts`
- `lib/firebase/auth.ts`
- `public/sw.js`
- `dataconnect/app/push-tokens.gql`
