---
type: Finding
title: The HTTP guard accepts an ID token revoked by an account deletion
description: guard calls verifyIdToken without checkRevoked, so an ID token issued before an account was deleted still passes on reports and webauthn for up to an hour.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# The HTTP guard accepts an ID token revoked by an account deletion

## Finding

`guard` in `functions/src/http/guard.ts` calls `verifyIdToken(token)` without `checkRevoked`. `deleteMyAccount`
revokes the person's refresh tokens and deletes their Auth user, but an ID token already issued stays valid until it
expires, up to an hour, so a copy of it still gets through `reports` and `webauthn` in that time. What it can reach
is bounded: the person's row is anonymised and their groups are gone, so there is little left to read.

## Evidence

- Security review of the auth-screens-and-bug-fixes plan, Minor M3 (`.ga/runs/2026-11-06-auth-screens-and-bug-fixes/reviews/`).
- `functions/src/http/guard.ts` calls `getAuth(adminApp()).verifyIdToken(token)` with one argument.

## Status

Open. Passing `true` as the second argument makes each call ask Auth about revocation, at the cost of one more lookup
per request.

## Sources

- `functions/src/http/guard.ts`
- `functions/src/account/delete-my-account.ts`
