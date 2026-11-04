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

## History

- 2026-11-04: was `authMiddleware` in `middleware.ts`, with `/api/webhook/clerk` and `/api/health-check` also in `ignoredRoutes`; now `clerkMiddleware` in `proxy.ts`, with those two simply public, because Clerk 7 removed `authMiddleware` and Next 16 renamed middleware to proxy. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `proxy.ts`
- `app/(platform)/(clerk)/sign-in/[[...sign-in]]/page.tsx`
- `app/(platform)/(clerk)/sign-up/[[...sign-up]]/page.tsx`
- `app/api/webauthn/generate-registration-options/route.ts`
- `app/api/webauthn/verify-authentication/route.ts`
- `components/biometric/biometric.tsx`
- `.env.sample`
