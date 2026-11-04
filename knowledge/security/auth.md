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
- `middleware.ts` runs Clerk's `authMiddleware` on every page and API route. Its `publicRoutes` (reachable signed
  out) are `/`, `/privacy`, `/api/webhook/clerk`, `/api/uploadthing`, `/api/test(.*)` and `/api/health-check(.*)`;
  `/api/webhook/clerk` and `/api/health-check` are also in `ignoredRoutes`, so the middleware doesn't run on them.
- Behind the middleware, every route handler and server action checks `auth().userId` itself and returns
  `Unauthorized` without one. That is the only check: there is no membership or ownership check (see
  [roles](roles.md)).
- A person's Clerk user id is their `User.id` ([users](../data/user.md)).

## Tokens and sessions

- The session is Clerk's; the app stores no tokens of its own.
- The WebAuthn flow keeps its challenge in an iron-session cookie named `challenge`, sealed with a password written in
  the route files: [hard-coded session password](../findings/hardcoded-session-password.md).
- The [biometric lock](../features/biometric-lock.md) is browser-side only: the server never asks whether it passed.

## Sources

- `middleware.ts`
- `app/(platform)/(clerk)/sign-in/[[...sign-in]]/page.tsx`
- `app/(platform)/(clerk)/sign-up/[[...sign-up]]/page.tsx`
- `app/api/webauthn/generate-registration-options/route.ts`
- `app/api/webauthn/verify-authentication/route.ts`
- `components/biometric/biometric.tsx`
- `.env.sample`
