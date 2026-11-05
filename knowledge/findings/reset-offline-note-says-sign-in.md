---
type: Finding
title: The reset page's offline note says "Connect to sign in."
description: The /auth/action/ reset form reuses the sign-in screens' offline note, so a person setting a new password offline is told to connect to sign in.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# The reset page's offline note says "Connect to sign in."

## Finding

The reset form on `/auth/action/` shows `OfflineSignInNote`, whose text is "You're offline. Connect to sign in."
The person is saving a new password, not signing in, so the note names the wrong action. The button is disabled
offline as intended.

## Evidence

- `.ga/runs/2026-11-05-password-reset-flow/reviews/final-reviewer.md`, Minor 5: "the person is setting a password, not
  signing in. The plan's Global Constraints asked for `OfflineSignInNote` by name, so this is a plan wording gap, not an
  implementation slip." Suggested a `message` prop or a sibling note such as "Connect to save your password."
- `components/offline/offline-sign-in-note.tsx:5` holds the text; `app/(platform)/(auth)/auth/action/reset-password-form.tsx:265`
  renders it. Still true at d7ad71f.
- Ledger: "Final review: minor (deferred): the reset page's offline note says Connect to sign in".

## Status

Open.

## Sources

- `components/offline/offline-sign-in-note.tsx`
- `app/(platform)/(auth)/auth/action/reset-password-form.tsx`
