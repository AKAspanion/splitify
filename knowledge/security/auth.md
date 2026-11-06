---
type: Security
title: Authentication
description: Firebase Auth signs people in; the browser guards the signed-in screens, SQL Connect rules and each Cloud Function's ID-token guard check every call; a WebAuthn check can add a lock.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Authentication

## How users sign in

[Firebase Auth](../decisions/firebase-auth.md), with Google and email and password (`lib/firebase/auth.ts`, client
setup in `lib/firebase/app.ts`); the screens are described in [sign in](../features/sign-in.md). Clerk, its middleware and
its webhook are gone: nothing runs on a server, so access is enforced by the services the browser calls, not by a
proxy ([Clerk](../integrations/clerk.md)).

- `UpsertMe` (`dataconnect/app/me.gql`) writes a person's `User` row, taking id, email and name from the signed token,
  never from the request. The merge of a contact into a new account is gated on a verified email
  ([contact identity](../domain/contact-identity.md)).
- A person's Firebase uid is their `User.id` ([users](../data/user.md)).
- The browser's auth state is `AuthProvider` (`components/auth/auth-provider.tsx`) read through `useAuth`
  (`hooks/use-auth.ts`), with a status of loading, signed in or signed out.
- `RequireAuth` (`components/auth/require-auth.tsx`) shows a spinner while loading and sends a signed-out person to
  `/sign-in/?next=<path>`, or home (`/`) after a sign-out they chose (`lib/auth-redirect.ts`). It wraps every signed-in
  screen (`app/(platform)/(app)/layout.hosting.tsx`, and the profile). It is a convenience: the data and the functions
  refuse a caller without a valid token themselves.
- While the person's email is unverified, `VerifyEmailBanner` (`components/auth/verify-email-banner.tsx`) shows above the
  screens, with Resend email (60-second wait) and "I've verified" (reloads the user). The wording is provisional; the
  decision names the banner but not its text.
- The redirect target is checked by `safeNextPath`.
- Signing out also removes this device's push token ([notifications](../features/notifications.md)).
- `signOut({ toSignIn: true })` (`lib/firebase/auth.ts`) is for a sign-out the app asks for so the person signs in
  again, as deleting an account with a stale sign-in does: the guard then sends them to `/sign-in/?next=<path>` rather
  than home.

## What checks a call

- **SQL Connect** operations carry `@auth` rules on the signed token ([SQL Connect schema](../data/sql-connect.md),
  [roles](roles.md)).
- **Cloud Functions over HTTP** (`reports`, `webauthn`) run the guard first (`functions/src/http/guard.ts`): it verifies
  the Firebase ID token from `Authorization: Bearer` with the admin SDK, then reads a JSON body of at most `65536`
  bytes, and answers `401`, `413`, `415` or `400` itself ([Cloud Functions](../apps/functions.md)). The browser sends
  the token through `callFunction` (`lib/functions/call.ts`), which throws before any request when nobody is signed in
  and turns a failure into a message a person can read.
- **The `deleteMyAccount` callable** takes its caller from Firebase's own check (`request.auth`), and refuses an ID
  token whose `auth_time` is more than 5 minutes old, so a left-open session can't delete the account
  ([profile](../features/profile.md)).

## Tokens and sessions

- The session is Firebase's; the app stores no tokens of its own.
- The WebAuthn flow keeps its challenge in an iron-session cookie named `__session`, sealed with the `SESSION_PASSWORD`
  secret ([WebAuthn API](../api/webauthn.md); the old hard-coded password is
  [fixed](../findings/hardcoded-session-password.md)).
- The [biometric lock](../features/biometric-lock.md) is browser-side: the lock screen decides whether the page shows;
  the functions only hold the person's registered devices.

## History

- 2026-11-06: the account deletion took any signed-in caller and a sign-out always went home; now deleting needs a sign-in from the last 5 minutes and `signOut({ toSignIn: true })` sends the person to sign in, because the security review found a left-open session could delete the account.
- 2026-11-05: was Clerk with `proxy.ts` guarding every route and each route handler checking `auth()`; now Firebase Auth with the guard on each Cloud Function and the rules in SQL Connect, because spec 2c removed the server and Clerk.
- 2026-11-05: the guard was unused; now it wraps the signed-in screens, with the verify-email banner and a home landing after sign-out, because spec 2b moved them to the hosting build.
- 2026-11-05: the Firebase Auth section said built but unused; now says the hosted sign-in screens, the auth state and the guard use it, because spec 2a added them.
- 2026-11-04: described the Firebase Auth pieces now built, because they exist in the code although no screen uses them yet.
- 2026-11-04: was `authMiddleware` in `middleware.ts`, with `/api/webhook/clerk` and `/api/health-check` also in `ignoredRoutes`; now `clerkMiddleware` in `proxy.ts`, with those two simply public, because Clerk 7 removed `authMiddleware` and Next 16 renamed middleware to proxy. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `lib/firebase/auth.ts`
- `lib/firebase/app.ts`
- `dataconnect/app/me.gql`
- `components/auth/auth-provider.tsx`
- `components/auth/require-auth.tsx`
- `hooks/use-auth.ts`
- `lib/auth/next-path.ts`
- `app/(platform)/(app)/layout.hosting.tsx`
- `components/auth/verify-email-banner.tsx`
- `lib/auth-redirect.ts`
- `functions/src/http/guard.ts`
- `lib/functions/call.ts`
- `functions/src/webauthn/session.ts`
- `functions/src/account/delete-my-account.ts`
- `components/biometric/biometric.tsx`
