---
type: Feature
title: Sign in, sign up and forgot password
description: The three Firebase Auth screens on the hosted site, their plain-language errors, the safe redirect after sign-in, and a reset answer that never reveals who has an account.
generated:
  by: agent:after-finish
  at: 2026-11-05T12:00:00Z
verified: human:ankitp@geekyants.com
---

# Sign in, sign up and forgot password

## What it does

On the hosted site a person signs in with email and password or with Google, signs up the same ways, or asks for a
password reset. The screens are `app/(platform)/(auth)/sign-in`, `sign-up` and `forgot-password` (each a
`page.hosting.tsx` with a client form), built on [Firebase Auth](../decisions/firebase-auth.md) through
`lib/firebase/auth.ts`. The landing page and navbar show the signed-in or signed-out view from the same auth state
([web app](../apps/splitify.md)).

## Rules

- After sign-in or sign-up the person goes to `next` from the query string, only when `safeNextPath`
  (`lib/auth/next-path.ts`) accepts it: one leading `/`, and no `//`, `/\`, scheme or control character; anything
  else goes to `/groups`. This stops an open redirect through the link.
- Errors are the app's own words, never Firebase's message: `authErrorMessage` (`lib/auth/auth-errors.ts`) maps the
  codes, and a wrong password and an unknown email give the same "don't match" text, so the form doesn't say which
  emails have accounts. An unknown code reads "Something went wrong. Try again."
- Forgot password shows the same "sent" answer when Firebase says `auth/user-not-found`, for the same reason; other
  failures (network, too many attempts) show their error.
- After email sign-up the person can use the app at once; the screen tells them to check their inbox to verify
  ([decision](../decisions/firebase-auth.md)).
- Google sign-in being blocked (popup blocked, unsupported environment) says to use email and password instead.
- Someone already signed in who opens a form is sent on to `next`; a sign-in in flight finishes writing the person's
  row (`UpsertMe`) first.

## Open edges

- If `UpsertMe` fails after Firebase sign-in succeeds, the form shows the error, but the signed-in state still
  redirects to `next`.

## Offline

The sign-in, sign-up and forgot-password screens say "You're offline. Connect to sign in." and disable their buttons (`components/offline/offline-sign-in-note.tsx`). Sign-out deletes the saved offline cache.

## History

- 2026-11-05: had nothing about offline; now the screens are disabled offline and sign-out deletes the cache, because the offline feature was built. See [offline](offline.md).

## Sources

- `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- `app/(platform)/(auth)/forgot-password/forgot-password-form.tsx`
- `lib/auth/auth-errors.ts`
- `lib/auth/next-path.ts`
- `lib/firebase/auth.ts`
- `components/offline/offline-sign-in-note.tsx`
