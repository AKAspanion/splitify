---
type: Finding
title: "Fixed: Clerk webhook wasn't verified"
description: POST /api/webhook/clerk trusted any request body, so anyone could create users or overwrite a user's email, name and images; it now checks Clerk's signature.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Fixed: Clerk webhook wasn't verified

## Finding

The webhook route is public (a public route in `proxy.ts`) and reads the body as a
`WebhookEvent` without checking Clerk's signature (the `svix-*` headers). Any request shaped like a `user.created` or
`user.updated` event is written to `User`.

## Evidence

- `app/api/webhook/clerk/route.ts`: `request.json()` is used directly; nothing verifies a signature. On
  `user.updated` it upserts by `data.id`, so a forged event can rewrite any user's `email`, `name` and images, and
  set `fromClerk`.

## Status

Fixed: the route calls `verifyWebhook` and answers `400` on a bad signature.

## Sources

- `app/api/webhook/clerk/route.ts`
- `proxy.ts`
