---
type: Finding
title: "Fixed: sign out could stay loading if removing the push token never answered"
description: unregisterThisDevice in lib/push/register.ts awaited the token removal with no deadline, so Sign out on Profile stayed loading if that call hung; it now gives up after 5 seconds and signs out anyway.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# Fixed: sign out could stay loading if removing the push token never answered

## Finding

`unregisterThisDevice` (`lib/push/register.ts`) awaited `d.remove(token)` with no deadline; only a thrown error was
caught and logged. The sign-out flow waits on it before it signs out of Firebase Auth, so a removal that never answered
left Sign out loading and the person signed in. The push senders' FCM calls have a 10-second deadline
([Cloud Functions](../apps/functions.md)); this client call had none.

## Evidence

Re-review of the auth-screens-and-bug-fixes plan, reported as out of scope
(`.ga/runs/2026-11-06-auth-screens-and-bug-fixes/reviews/`).

## Status

Fixed: `PUSH_REMOVAL_DEADLINE_MS = 5000`. A removal that doesn't answer in time logs "token removal" with `TimeoutError`,
the stored token is dropped, and sign-out goes on. The price is that a late or failed removal leaves the row and the
subscription behind ([finding](push-token-removal-failure-leaves-signed-out-device-subscribed.md)).

## Sources

- `lib/push/register.ts`
- `lib/firebase/auth.ts`
