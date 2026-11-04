---
type: Security
title: Authentication
description: Clerk signs people in, and its middleware requires a session on every route except a short public list; a WebAuthn check can add a browser-side lock.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Authentication

## How users sign in

- Through Clerk's hosted components on `app/(platform)/(clerk)/sign-in/[[...sign-in]]/page.tsx` and
  `app/(platform)/(clerk)/sign-up/[[...sign-up]]/page.tsx`. Clerk's keys and redirect URLs are the `CLERK_*` keys in
  `.env.sample` ([environment](../operations/environment.md)).
- `proxy.ts` (what Next 16 calls middleware) runs Clerk's `clerkMiddleware` on every page and API route. Its public
  routes (`isPublicRoute`, reachable signed out) are `/`, `/privacy`, `/sign-in(.*)`, `/sign-up(.*)`,
  `/api/webhook/clerk`, `/api/uploadthing`, `/api/test(.*)` and `/api/health-check(.*)`. The sign-in and sign-up pages
  must be listed: `authMiddleware` let them through by itself, `clerkMiddleware` doesn't, and without them `/sign-in`
  redirects to itself.
- Signed out, a page redirects to sign-in (`auth.protect()`), and an API route answers `401` with
  `{ message: "Unauthorized" }`. The `401` is kept on purpose: `auth.protect()` alone answers API calls `404`.
- Behind the proxy, every route handler and server action checks `(await auth()).userId` itself and returns
  `Unauthorized` without one. That is the only check: there is no membership or ownership check (see
  [roles](roles.md)).
- A person's Clerk user id is their `User.id` ([users](../data/user.md)).

## Tokens and sessions

- The session is Clerk's; the app stores no tokens of its own.
- The WebAuthn flow keeps its challenge in an iron-session cookie named `challenge`, sealed with a password written in
  the route files: [hard-coded session password](../findings/hardcoded-session-password.md).
- The [biometric lock](../features/biometric-lock.md) is browser-side only: the server never asks whether it passed.

## Firebase Auth (on the hosted site; the server app still uses Clerk)

[Firebase Auth](../decisions/firebase-auth.md) replaces Clerk, with Google and email and password
(`lib/firebase/auth.ts`, client setup in `lib/firebase/app.ts`). `UpsertMe` (`dataconnect/app/me.gql`) writes a
person's `User` row, taking id, email and name from the signed token, never from the request. The merge of a contact
into a new account is gated on a verified email ([contact identity](../domain/contact-identity.md)).

- The browser's auth state is `AuthProvider` (`components/auth/auth-provider.tsx`) read through `useAuth`
  (`hooks/use-auth.ts`), with a status of loading, signed in or signed out.
- `RequireAuth` (`components/auth/require-auth.tsx`) shows a spinner while loading and sends a signed-out person to
  `/sign-in/?next=<path>`. It is type-checked only: no hosted page uses it yet.
- The redirect target is checked by `safeNextPath`, and the screens are described in [sign in](../features/sign-in.md).
- Signing out also removes this device's push token ([notifications](../features/notifications.md)).
- Until the signed-in routes move to the hosting build, `proxy.ts` and Clerk still guard every route of the server app.

## History

- 2026-11-05: the Firebase Auth section said built but unused; now says the hosted sign-in screens, the auth state and the guard use it, because spec 2a added them.
- 2026-11-04: described the Firebase Auth pieces now built, because they exist in the code although no screen uses them yet.
- 2026-11-04: was `authMiddleware` in `middleware.ts`, with `/api/webhook/clerk` and `/api/health-check` also in `ignoredRoutes`; now `clerkMiddleware` in `proxy.ts`, with those two simply public, because Clerk 7 removed `authMiddleware` and Next 16 renamed middleware to proxy. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `proxy.ts`
- `app/(platform)/(clerk)/sign-in/[[...sign-in]]/page.tsx`
- `app/(platform)/(clerk)/sign-up/[[...sign-up]]/page.tsx`
- `app/api/webauthn/generate-registration-options/route.ts`
- `app/api/webauthn/verify-authentication/route.ts`
- `components/biometric/biometric.tsx`
- `.env.sample`
- `lib/firebase/auth.ts`
- `lib/firebase/app.ts`
- `dataconnect/app/me.gql`
- `components/auth/auth-provider.tsx`
- `components/auth/require-auth.tsx`
- `hooks/use-auth.ts`
- `lib/auth/next-path.ts`
