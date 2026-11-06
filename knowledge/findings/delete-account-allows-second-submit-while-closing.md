---
type: Finding
title: "Fixed: delete account had no guard against a second submit while the dialog closed"
description: handleDelete in the profile's delete-account action closed the dialog and set deleting in the same step, so a second Enter or click during the dialog's exit animation could call deleteMyAccount twice; a ref now ignores it.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# Fixed: delete account had no guard against a second submit while the dialog closed

## Finding

`handleDelete` (`app/(platform)/profile/delete-account-action.tsx`) called `setConfirming(false)` and
`setDeleting(true)` and then started `deleteMyAccount`. It never checked `deleting` first, and the dialog stays mounted
for its exit animation, so a second Enter or click on its Delete account button in that moment called the function a
second time. The function is built to be retried (it finishes a half-done deletion), so the second call was harmless
in effect, but it could show a second error toast.

## Evidence

Final review of the auth-screens-and-bug-fixes plan, Minor 4 (`.ga/runs/2026-11-06-auth-screens-and-bug-fixes/`), deferred.

## Status

Fixed: a ref makes a second confirm while a delete is in flight do nothing. The ref is released on failure, including
when the sign-out that sends the person to sign in again fails, so they can try again.

## Sources

- `app/(platform)/profile/delete-account-action.tsx`
- `app/(platform)/profile/delete-account-dialog.tsx`
