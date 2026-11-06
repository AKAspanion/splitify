---
type: Finding
title: "Fixed: the action page offered only Try again for errors a retry can't fix"
description: On /auth/action/, a failure such as a turned-off account landed in a state whose only action was Try again; the failed and saved states now also offer Go home.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# Fixed: the action page offered only Try again for errors a retry can't fix

## Finding

On `/auth/action/`, `auth/user-disabled` (worded "This account is turned off.") and any unmapped code landed in the
`failed` state of the reset form and of the verify result. That state's only action was "Try again", so for an error a
retry can't fix the person had no way back.

## Evidence

- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-reviewer.md`, Minor 8: "`auth/user-disabled` ... and any
  unmapped code land in `failed`, whose only action is 'Try again'. For a turned-off account that is a dead end with no
  way back (no 'Back to sign in')."
- Ledger: "Final review: minor (deferred): Try again is the only action for errors a retry can't fix".

## Status

Fixed. The reset form's failed and saved states and the verify result's failed state each render a "Go home" link to
`/` beside their other action (`GoHomeLink` in `reset-password-form.tsx`), and `/` redirects by sign-in state
([sign in](../features/sign-in.md)).

## History

- 2026-11-06: was open; now fixed, because the auth-screens-and-bug-fixes plan added Go home to those states.

## Sources

- `app/(platform)/(auth)/auth/action/reset-password-form.tsx`
- `app/(platform)/(auth)/auth/action/verify-email-result.tsx`
- `lib/auth/auth-errors.ts`
