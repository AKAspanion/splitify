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

## Email links: reset and verify

- Firebase's reset and verify emails open the app's own page `/auth/action/`
  (`app/(platform)/(auth)/auth/action/`); `parseActionLink` (`lib/auth/action-link.ts`) reads the link. The page reads
  it once per page load and cleans the address bar. It keeps the link, the verify call and the password save at module
  scope, so a remount (the query provider's key flip when auth restores, see
  [the remount finding](../findings/query-provider-remounts-pages-at-auth-restore.md)) never spends the one-time code
  twice. Never link to `/auth/action/` with a code from inside the app: the code would reach scripts and the cache
  ([data protection](../security/data-protection.md)).
- Reset: the page shows the person's email and asks for a new password of at least 8 characters ("Use at least 8
  characters."). Success reads "Your password is changed. Sign in with your new password." A spent, expired or
  deleted-account code reads "This link has expired or was already used." with "Ask for a new link". After a lost
  reply, a retry that finds the code spent says "Your password may already be changed…". Provisional: that copy awaits
  the developer.
- Verify: "Your email is verified." with Continue. The banner clears without a reload, because `onUserChanged`
  (`lib/firebase/auth.ts`) is built on `onIdTokenChanged`. `verifyEmailWithCode` resolves when the code applied but the
  reload after it failed, because the code is spent.
- `recoverEmail`, `verifyAndChangeEmail` and `revertSecondFactorAddition` go on to Firebase's own `/__/auth/action`;
  `continueUrl` is never read.
- The sign-in and sign-up screens end with a plain "Privacy policy" link to `/privacy/`, with no consent line.
  Provisional: the developer may want consent wording on sign-up.
- Open edges: [offline note wording](../findings/reset-offline-note-says-sign-in.md),
  [no way back from errors a retry can't fix](../findings/action-page-failures-have-no-way-back.md),
  [no back link in the header](../findings/action-page-header-has-no-back-link.md),
  [the biometric lock over the page](../findings/biometric-lock-covers-action-page.md),
  [expired after a lost reply and a remount](../findings/reset-remount-after-lost-reply-says-expired.md),
  [the banner and auth restore](../findings/reload-email-verified-skips-auth-restore.md) and
  [an empty form after sign-up](../findings/sign-up-stays-on-empty-form.md).

## Offline

The sign-in, sign-up and forgot-password screens say "You're offline. Connect to sign in." and disable their buttons (`components/offline/offline-sign-in-note.tsx`). Sign-out deletes the saved offline cache.

## History

- 2026-11-05: a reset email's link opened Firebase's own `/__/auth/action` page and the screens had no privacy link; now the emails open the app's `/auth/action/` page, which resets the password and verifies the email, and the sign-in and sign-up screens link to the privacy page, because the developer wanted the reset flow finished in the app.
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
- `lib/auth/action-link.ts`
- `app/(platform)/(auth)/auth/action/action-handler.tsx`
- `app/(platform)/(auth)/auth/action/reset-password-form.tsx`
- `app/(platform)/(auth)/auth/action/verify-email-result.tsx`
- `app/(platform)/(auth)/auth/action/code-call.ts`
- `lib/firebase/auth.ts`
- `lib/firebase/app.ts`
- `components/offline/offline-sign-in-note.tsx`
