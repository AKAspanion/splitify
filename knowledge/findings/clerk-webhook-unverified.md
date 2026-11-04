---
type: Finding
title: Clerk webhook isn't verified
description: POST /api/webhook/clerk trusts any request body, so anyone can create users or overwrite a user's email, name and images.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Clerk webhook isn't verified

## Finding

The webhook route is public (`publicRoutes` and `ignoredRoutes` in `middleware.ts`) and reads the body as a
`WebhookEvent` without checking Clerk's signature (the `svix-*` headers). Any request shaped like a `user.created` or
`user.updated` event is written to `User`.

## Evidence

- `app/api/webhook/clerk/route.ts`: `request.json()` is used directly; nothing verifies a signature. On
  `user.updated` it upserts by `data.id`, so a forged event can rewrite any user's `email`, `name` and images, and
  set `fromClerk`.

## Status

Open.

## Sources

- `app/api/webhook/clerk/route.ts`
- `middleware.ts`
