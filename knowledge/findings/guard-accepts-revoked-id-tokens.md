---
type: Finding
title: "Fixed: the HTTP guard accepted an ID token revoked by an account deletion"
description: guard called verifyIdToken without checkRevoked, so an ID token issued before an account was deleted still passed on reports and webauthn for up to an hour; it now checks revocation. The callable and SQL Connect still don't.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# Fixed: the HTTP guard accepted an ID token revoked by an account deletion

## Finding

`guard` in `functions/src/http/guard.ts` called `verifyIdToken(token)` without `checkRevoked`. `deleteMyAccount`
revokes the person's refresh tokens and deletes their Auth user, but an ID token already issued stays valid until it
expires, up to an hour, so a copy of it still got through `reports` and `webauthn` in that time. What it could reach
was bounded: the person's row is anonymised and their groups are gone, so there was little left to read.

## Evidence

- Security review of the auth-screens-and-bug-fixes plan, Minor M3 (`.ga/runs/2026-11-06-auth-screens-and-bug-fixes/reviews/`).
- Final security review of the open-findings-fixes plan, M3, which asks that this be marked Fixed for the HTTP guard
  only (`.ga/runs/2026-11-06-open-findings-fixes/reviews/final-security-reviewer.md`).

## Status

Fixed for the HTTP functions (`reports`, `webauthn`) only: `guard` calls `verifyIdToken(token, true)`. A missing token,
or an error whose code is in `REFUSED_SIGN_IN_CODES`, answers `401` "Sign in again to continue." and logs
`guard: sign-in refused` with the cause class and code. Any other failure of the check (an Auth outage, quota, the
network) answers `500` "Something went wrong. Try again." and logs `guard: sign-in check failed` with the same two
fields. Each guarded request makes one Auth lookup. The Auth emulator always checks revocation, so emulator tests can't
show that the second argument is missing; a code review has to.

Not covered: the `deleteMyAccount` callable and SQL Connect still accept a revoked token
([finding](callable-and-sql-connect-accept-revoked-id-tokens.md)).

## Sources

- `functions/src/http/guard.ts`
- `functions/src/account/delete-my-account.ts`
