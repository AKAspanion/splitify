---
type: Finding
title: The biometric lock isn't exempt on /auth/action/
description: A signed-in person with a registered passkey who opens a reset or verify link gets the uncloseable lock dialog over the page.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# The biometric lock isn't exempt on /auth/action/

## Finding

`Biometric` skips its lock only for the paths in `publicRoutes`, and `/auth/action` isn't one. A signed-in person with
a passkey registered who opens a verify or reset link gets the non-closable "Authentication Required" dialog over the
page. It isn't a bypass (the page shows none of the app's data), but it blocks the page until they pass the check. The
sign-up and forgot-password screens behave the same today. Whether these pages belong behind the lock is a decision for
the developer ([biometric lock](../features/biometric-lock.md)).

## Evidence

- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-reviewer.md`, "Declined to judge": "`components/biometric/biometric.tsx:17`
  leaves `/auth/action` out of `publicRoutes`. So a signed-in person with a passkey registered ... gets the non-closable
  'Authentication Required' dialog over the page ... `/forgot-password/` and `/sign-up/` behave the same today."
- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-security-reviewer.md`, Important 1's lock-dialog path: "The lock
  dialog covers `/auth/action/` for a signed-in person with a passkey ... It isn't a lock bypass."
- `components/biometric/biometric.tsx:18` (`publicRoutes`) at d7ad71f.
- Ledger: "Final review: minor (deferred): the biometric lock isn't exempt on /auth/action".

## Status

Open. Not ruled on: the lock's reach over the auth pages is the developer's call.

## Sources

- `components/biometric/biometric.tsx`
