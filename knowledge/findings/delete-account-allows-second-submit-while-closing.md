---
type: Finding
title: Delete account has no guard against a second submit while the dialog closes
description: handleDelete in the profile's delete-account action closes the dialog and sets deleting in the same step, so a second Enter or click during the dialog's exit animation can call deleteMyAccount twice.
generated:
  by: agent:knowledge-job
  at: 2026-11-06T18:00:00Z
---

# Delete account has no guard against a second submit while the dialog closes

## Finding

`handleDelete` (`app/(platform)/profile/delete-account-action.tsx`) calls `setConfirming(false)` and
`setDeleting(true)` and then starts `deleteMyAccount`. It never checks `deleting` first, and the dialog stays mounted
for its exit animation, so a second Enter or click on its Delete account button in that moment calls the function a
second time. The function is built to be retried (it finishes a half-done deletion), so the second call is harmless
in effect, but it can show a second error toast.

## Evidence

Final review of the auth-screens-and-bug-fixes plan, Minor 4 (`.ga/runs/2026-11-06-auth-screens-and-bug-fixes/`), deferred.

## Status

Open.

## Sources

- `app/(platform)/profile/delete-account-action.tsx`
- `app/(platform)/profile/delete-account-dialog.tsx`
