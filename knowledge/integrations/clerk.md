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

## What it is used for

- Sessions and route protection: `authMiddleware` in `middleware.ts`, `auth()` in every action and route, and
  `ClerkProvider` in `components/providers.tsx` (dark theme from `@clerk/themes` when the site is dark).
- Sign-in and sign-up pages under `app/(platform)/(clerk)/`.
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

## Sources

- `middleware.ts`
- `components/providers.tsx`
- `app/api/webhook/clerk/route.ts`
- `next.config.mjs`
- `.env.sample`
- `package.json`
