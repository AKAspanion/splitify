---
type: Finding
title: After email sign-up the page stayed on an empty sign-up form
description: In the dev server, a sign-up created the account and signed the person in, yet the screen stayed on an empty sign-up form; not checked on main, so it is unconfirmed that this branch caused it.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# After email sign-up the page stayed on an empty sign-up form

## Finding

During the walk-through in the dev server, an email sign-up created the account and signed the person in, but the page
stayed on an empty sign-up form rather than going on to `next` or `/groups` ([sign in](../features/sign-in.md)). It
was seen before and after the fix wave. It has not been checked on `main`, so it is unconfirmed whether `main` has it
or this branch introduced it; the branch doesn't change the sign-up form's own redirect logic beyond a privacy link.

## Evidence

- Ledger: "Final review: minor (deferred): after email sign-up the page stayed on an empty sign-up form though the
  account was created and signed in (seen in the dev server, before and after the fix wave; not checked on main)".
- No review file raised it; it comes from the controller's walk-through.

## Status

Open. Unconfirmed on `main`.

## Sources

- `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
