---
type: Finding
title: The action page offers only "Try again" for errors a retry can't fix
description: On /auth/action/, a failure such as a turned-off account lands in a state whose only action is Try again, with no link back to sign in.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# The action page offers only "Try again" for errors a retry can't fix

## Finding

On `/auth/action/`, `auth/user-disabled` (worded "This account is turned off.") and any unmapped code land in the
`failed` state of the reset form and of the verify result. That state's only action is "Try again", so for an error a
retry can't fix the person has no way back to sign in.

## Evidence

- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-reviewer.md`, Minor 8: "`auth/user-disabled` ... and any
  unmapped code land in `failed`, whose only action is 'Try again'. For a turned-off account that is a dead end with no
  way back (no 'Back to sign in')." Suggested a "Back to sign in" link, or "Try again" only for
  `auth/network-request-failed` and `auth/too-many-requests`.
- `app/(platform)/(auth)/auth/action/reset-password-form.tsx:204` and `verify-email-result.tsx:153` render the
  "Try again" button. Still true at d7ad71f.
- Ledger: "Final review: minor (deferred): Try again is the only action for errors a retry can't fix".

## Status

Open.

## Sources

- `app/(platform)/(auth)/auth/action/reset-password-form.tsx`
- `app/(platform)/(auth)/auth/action/verify-email-result.tsx`
- `lib/auth/auth-errors.ts`
