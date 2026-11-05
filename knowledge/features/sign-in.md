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
- Google sign-in is a redirect, not a popup: `signInWithGoogle` (`lib/firebase/auth.ts`) sets a marker in this tab's
  sessionStorage, `splitify:google-redirect`, then calls `signInWithRedirect`; the page leaves for Google and loads
  back. The marker is how a form, whose page is prerendered, knows on mount that a redirect is coming back.
- Both forms finish a returning redirect when they load: `finishGoogleReturn` (`lib/auth/google-return.ts`) calls
  `completeGoogleSignIn`, which reads the redirect result and runs `UpsertMe` before anything navigates. The form
  goes to `next` only after that; a failure shows its error in the form and never rejects past it.
- A Google sign-in whose `UpsertMe` fails signs the person out of Firebase Auth, so nobody stays signed in without a
  User row.
- A page the browser restores from its back/forward cache after the person left for Google (they pressed Back)
  clears the marker and frees the buttons (`whenRestoredAfterGoogle`).
- Without sessionStorage Firebase can't finish a redirect, so the person is told Google sign-in isn't available here
  (`auth/web-storage-unsupported`); a blocked or unauthorized domain says to use email and password instead.
- Google sign-in still needs `popupRedirectResolver: browserPopupRedirectResolver` in the browser's Auth
  (`authOptions` in `lib/firebase/app.ts`): Auth is built with `initializeAuth`, which, unlike `getAuth`, adds no
  resolver, and `signInWithRedirect` and `getRedirectResult` need one as `signInWithPopup` did.
- The auth domain is `splitify.spanion.in`, the site's own host, so the redirect's handler and Firebase's auth iframe
  run on the site's origin; it must be one of Firebase Auth's authorized domains, and the OAuth client needs its
  redirect URI ([deploy setup](../operations/deploy-setup.md)).
- Someone already signed in who opens a form is sent on to `next`; a sign-in in flight finishes writing the person's
  row (`UpsertMe`) first.

## Offline

The sign-in, sign-up and forgot-password screens say "You're offline. Connect to sign in." and disable their buttons (`components/offline/offline-sign-in-note.tsx`). Sign-out deletes the saved offline cache.

## History

- 2026-11-05: Google sign-in was a popup and a failed `UpsertMe` left the person signed in; now it is a redirect finished by the forms on load, `UpsertMe` runs before navigation, a failure signs the person out, and a bfcache restore frees the buttons, because popups fail in in-app browsers and on mobile Safari. The "Open edges" note about `UpsertMe` failing is gone.
- 2026-11-05: Google sign-in failed on the hosted site with "Something went wrong" (no popup resolver, and the domain wasn't authorized); now Auth gets the resolver, the domain is authorized, and popup failures have their own messages.
- 2026-11-05: had nothing about offline; now the screens are disabled offline and sign-out deletes the cache, because the offline feature was built. See [offline](offline.md).

## Sources

- `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- `app/(platform)/(auth)/forgot-password/forgot-password-form.tsx`
- `lib/auth/auth-errors.ts`
- `lib/auth/next-path.ts`
- `lib/auth/google-return.ts`
- `lib/firebase/auth.ts`
- `lib/firebase/app.ts`
- `components/offline/offline-sign-in-note.tsx`
