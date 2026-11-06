---
type: Finding
title: Sign out can stay loading if removing the push token never answers
description: unregisterThisDevice in lib/push/register.ts awaits the token removal with no deadline, so Sign out on Profile stays in its loading state if that call hangs.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# Sign out can stay loading if removing the push token never answers

## Finding

`unregisterThisDevice` (`lib/push/register.ts`) awaits `d.remove(token)` with no deadline; only a thrown error is
caught and logged. The sign-out flow waits on it before it signs out of Firebase Auth, so a removal that never answers
leaves Sign out loading and the person signed in. The push senders' FCM calls do have a 10-second deadline
([Cloud Functions](../apps/functions.md)); this client call has none.

## Evidence

Re-review of the auth-screens-and-bug-fixes plan, reported as out of scope
(`.ga/runs/2026-11-06-auth-screens-and-bug-fixes/reviews/`).

## Status

Open.

## Sources

- `lib/push/register.ts`
- `lib/firebase/auth.ts`
