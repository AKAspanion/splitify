---
type: Integration
title: Clerk
description: Clerk handles sign-up, sign-in and sessions; its webhook keeps the User table in step with Clerk.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Clerk

The Clerk account no longer exists, and Clerk is to be removed from the app when
[Firebase Auth replaces it](../decisions/firebase-auth.md) (planned in spec 2). The code below describes what the
running app still contains, not a working service.

The static hosting build doesn't use Clerk at all: there `@clerk/nextjs` resolves to the signed-out stub
`lib/clerk-hosting.tsx`, so that build needs no Clerk key ([the hosting build](../apps/splitify.md)).

## What it is used for

- Sessions and route protection: `clerkMiddleware` in `proxy.ts`, `auth()` in every action and route, and
  `ClerkProvider` in `components/providers.tsx` (dark theme from `@clerk/themes` when the site is dark).
- Sign-in and sign-up pages under `app/(platform)/(clerk)/`, public in `proxy.ts` ([auth](../security/auth.md)).
- The profile page embeds `<UserProfile routing="hash" />` (`app/(platform)/profile/page.tsx`): `/profile` isn't a
  catch-all route, and Clerk 7's default path routing would need one. Clerk 4 routed it by hash anyway.
- Sign-in by email needs "Email verification code" turned on for sign-in in the Clerk instance's email settings;
  without it, an account with no password can only sign in with Google.
- User records: Clerk calls `POST /api/webhook/clerk` on `user.created` and `user.updated`, which writes the `User`
  row ([contact identity](../domain/contact-identity.md)). `GET /api/webhook/clerk` only answers a greeting.
- Profile images are served from Clerk's image hosts, allowed in `images.remotePatterns` in `next.config.mjs`.

## Configuration

The `NEXT_PUBLIC_CLERK_*` and `CLERK_SECRET_KEY` keys in `.env.sample`. The webhook's URL is set in Clerk's
dashboard; `scripts.ngrok` in `package.json` exposes a local server for it.

## Failure modes

- The webhook returns `400` with the error message when it can't process an event.
- The webhook doesn't verify signatures: [Clerk webhook isn't verified](../findings/clerk-webhook-unverified.md).
- A missed webhook leaves a signed-in person with no `User` row, and their writes fail.

## History

- 2026-11-05: the account is gone and the hosting build stubs Clerk, because the public pages go to Firebase Hosting first and Clerk leaves with spec 2.
- 2026-11-04: route protection was `authMiddleware` in `middleware.ts`; now `clerkMiddleware` in `proxy.ts`, because Clerk 7 removed `authMiddleware`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `app/(platform)/profile/page.tsx`
- `proxy.ts`
- `components/providers.tsx`
- `app/api/webhook/clerk/route.ts`
- `next.config.mjs`
- `.env.sample`
- `package.json`
- `lib/clerk-hosting.tsx`
