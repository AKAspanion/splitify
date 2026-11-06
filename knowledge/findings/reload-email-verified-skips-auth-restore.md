---
type: Finding
title: reloadEmailVerified doesn't wait for auth to restore
description: A verify reply that lands before Firebase Auth restores the signed-in person may leave the verify banner up until the next reload; inferred from the code, not reproduced.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# reloadEmailVerified doesn't wait for auth to restore

## Finding

`reloadEmailVerified` reads `getFirebaseAuth().currentUser` without awaiting `authStateReady()`. On a signed-in open of
a verify link the apply starts before auth restore; if its reply arrives first, `currentUser` is still `null`, the
function returns `false`, and the banner stays until the next reload or token refresh. This is inferred from the code
and was not reproduced: in the walk-through the banner cleared, so timing usually favours the restore.

## Evidence

- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-r2-reviewer.md`, Out-of-Scope Observations:
  "`lib/firebase/auth.ts:168-172,228-230` ... If the apply's reply arrives first, `currentUser` is still `null`,
  `reloadEmailVerified` returns `false`, and the banner stays." Advice: await `authStateReady()` first.
- `lib/firebase/auth.ts:228-230` at d7ad71f.
- Ledger: "Final review: minor (deferred): reloadEmailVerified reads currentUser without awaiting authStateReady ...
  (inferred)".

## Status

Open. Unconfirmed.

## Sources

- `lib/firebase/auth.ts`
