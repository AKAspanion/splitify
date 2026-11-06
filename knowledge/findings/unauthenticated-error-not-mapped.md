---
type: Finding
title: toUserMessage doesn't match the functions/unauthenticated code, so a callable's sign-in error shows the generic text
description: toUserMessage compares the error code with unauthenticated, but a callable's code is functions/unauthenticated, so only a message it lists, such as deleteMyAccount's stale sign-in line, gets a readable answer.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# toUserMessage doesn't match the functions/unauthenticated code, so a callable's sign-in error shows the generic text

## Finding

`toUserMessage` in `lib/data/errors.ts` maps SQL Connect, Auth and function errors to readable messages
([conventions](../project/conventions.md)). It tests the code against `unauthenticated`, but the Firebase client
reports a callable's error as `functions/unauthenticated`, so the test never matches one. `deleteMyAccount`'s
stale-sign-in answer still reads well, because its text, "Sign in again to delete your account.", is in
`CHECK_MESSAGES` ([profile](../features/profile.md)). Any other callable that answers `unauthenticated` with a message
the list lacks shows "Something went wrong. Try again." instead of "Sign in again to continue."

## Evidence

Reported by the web fix wave of the repository-modernization run and deferred as Minor in the run's ledger; the code
is `lib/data/errors.ts`.

## Status

Open.

## Sources

- `lib/data/errors.ts`
- `app/(platform)/profile/delete-account-failure.ts`
