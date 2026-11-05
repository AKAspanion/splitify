---
type: Finding
title: A Google sign-in can stay signed in with no User row if sign-out also fails
description: When UpsertMe fails after a Google redirect and Firebase Auth's sign-out then fails too, the session stays, and the sign-in form sends the person into the app without their User row.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T12:24:26Z
---

# A Google sign-in can stay signed in with no User row if sign-out also fails

## Finding

`completeGoogleSignIn` signs the person out when `UpsertMe` fails after a Google redirect, so nobody is signed in
without their `User` row ([sign-in](../features/sign-in.md)). If that sign-out rejects too (a local IndexedDB
failure), it only logs a warning and rethrows `UpsertMe`'s error. The Firebase session stays, and the sign-in form's
signed-in effect then sends the person on to `next` with no `User` row and no contact merge, until a later sign-in
runs `UpsertMe`.

Both failures have to happen together, so it is rare; it was deferred as Minor.

## Evidence

The final fix wave's re-review, `.ga/runs/2026-11-05-google-sign-in-redirect/reviews/final-r1-reviewer.md`, New
Minor 2: "`lib/firebase/auth.ts:98-105`, when signOut also rejects (a local IndexedDB failure), the session stays.
`sign-in-form.tsx:39` then still sends the person into the app with no User row." Deferred in the run's ledger as a
Minor (`docs/plans/2026-11-05-google-sign-in-redirect.record.md`).

## Status

Open.

## Sources

- `lib/firebase/auth.ts`
- `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
