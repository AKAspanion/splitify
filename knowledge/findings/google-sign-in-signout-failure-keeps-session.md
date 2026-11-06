---
type: Finding
title: "Fixed: A Google sign-in could stay signed in with no User row if sign-out also failed"
description: When UpsertMe failed after a Google redirect and Firebase Auth's sign-out then failed too, the session stayed, and the sign-in form sent the person into the app without their User row.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T12:24:26Z
---

# Fixed: A Google sign-in could stay signed in with no User row if sign-out also failed

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

Fixed: when sign-out fails, `clearSavedSignIn` removes the saved auth records (local and session storage, and
IndexedDB), so the next load doesn't restore the user, and the sign-in form stays on `/sign-in/` and shows the error.
Residual: if `signOut` fails before Firebase clears its in-memory user, a token refresh can save the user again.

## Sources

- `lib/firebase/auth.ts`
- `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
