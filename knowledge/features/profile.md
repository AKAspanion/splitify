---
type: Feature
title: Profile
description: The profile screen of the hosted site: who is signed in, notifications, the biometric lock, feedback, theme, sign out and a link to delete the account.
generated:
  by: agent:after-finish
  at: 2026-11-05T13:00:00Z
verified: human:ankitp@geekyants.com
---

# Profile

## What it does

`/profile` shows the signed-in person's name and email (from `useMe`, falling back to the Firebase Auth user while it
loads), the dark-mode toggle, a link to [feedback](feedback.md), the push-notification control
([notifications](notifications.md)), the [biometric lock](biometric-lock.md) entry, a Sign out button and a Delete
account button.

## Rules

- Profile shows the [verify-email banner](../decisions/verify-banner-placement.md) while the email is unverified,
  always, with Resend only.
- Sign out signs out first, then leaves for `/sign-in/` by a full page load (`leaveForSignIn`,
  `lib/auth-redirect.ts`): `/` still saw the person as signed in and showed `/groups/` first, and a fresh document drops
  every signed-in screen's state ([decision](../decisions/remove-landing-page.md), [auth](../security/auth.md)).
- Delete account opens `DeleteAccountDialog` (`delete-account-dialog.tsx`): "Delete your account?" with "Your shared
  expenses stay, shown as Deleted user. This can't be undone." and a field asking to type `DELETE` exactly, with no
  trimming or case-folding. The dialog's Delete account button stays disabled until the field equals it, Enter submits
  only when it does, and Cancel, Escape and the close control can't delete; the field starts empty each time the dialog
  opens. Confirming (`delete-account-action.tsx`) calls the `deleteMyAccount` callable ([Cloud Functions](../apps/functions.md)),
  signs out locally and leaves for `/sign-in/` by a full page load. A ref makes a second confirm while a delete is in flight
  do nothing, so the dialog's exit animation can't call the function twice; it is released on failure, including when
  the sign-out for sign-in-again fails ([finding](../findings/delete-account-allows-second-submit-while-closing.md)). The function anonymises the person's row, deletes the groups only they were in, and
  deletes their Auth user ([decision](../decisions/anonymise-deleted-accounts.md)). The function first needs a
  sign-in in the last 5 minutes (`RECENT_SIGN_IN_SECONDS = 300`) and revokes the person's refresh tokens. When the
  sign-in is too old, the screen shows the message, signs the person out and sends them to `/sign-in/?next=/profile/`
  to come back and finish (`delete-account-failure.ts`); any other failure shows a message and the person stays signed
  in, and trying again finishes the job. `/delete-account` remains the public page that describes
  deletion.
- It is a client page over `lib/data/profile.ts` (`useMe`, the `GetMe` query), guarded like the other signed-in screens.

## Offline

Delete account is online-only ([decision](../decisions/offline-first-scope.md)).

## History

- 2026-11-06: a second Enter or click during the delete dialog's exit animation could call `deleteMyAccount` twice; now a ref ignores it, because the review found the unguarded second submit. See [the fixed finding](../findings/delete-account-allows-second-submit-while-closing.md).
- 2026-11-06: signing out landed on `/` and Delete account asked a plain confirm and went home; now both leave for `/sign-in/` by a full page load and Delete account opens a dialog asking to type `DELETE`, because `/` flashed the groups for someone just signed out and the developer wanted a stronger confirmation. See [the landing decision](../decisions/remove-landing-page.md).
- 2026-11-06: deleting needed no recent sign-in; now it needs one from the last 5 minutes and a stale one signs the person out to sign in again, because the security review found a left-open session could delete the account.
- 2026-11-05: had nothing about offline; now deleting the account is disabled offline, because the offline feature was built. See [offline](offline.md).
- 2026-11-05: Delete account linked to a page that explained how to ask for deletion; now it deletes the account itself through `deleteMyAccount`, because spec 2c built the function.

## Sources

- `app/(platform)/profile/page.tsx`
- `app/(platform)/profile/page.hosting.tsx`
- `app/(platform)/profile/delete-account-action.tsx`
- `app/(platform)/profile/delete-account-failure.ts`
- `app/(platform)/profile/delete-account-dialog.tsx`
- `components/auth/verify-email-banner.tsx`
- `functions/src/account/delete-my-account.ts`
- `lib/data/profile.ts`
- `lib/auth-redirect.ts`
