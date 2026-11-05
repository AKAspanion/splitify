---
type: Finding
title: Fixed: the Clerk webhook wasn't verified
description: POST /api/webhook/clerk trusted any request body, so anyone could create users or overwrite a user's email, name and images; the webhook and Clerk were removed.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Fixed: the Clerk webhook wasn't verified

## Finding

As found, before the server was removed:

The webhook route is public (a public route in proxy.ts) and reads the body as a
`WebhookEvent` without checking Clerk's signature (the `svix-*` headers). Any request shaped like a `user.created` or
`user.updated` event is written to `User`.

## Evidence

- app/api/webhook/clerk/route.ts: `request.json()` is used directly; nothing verifies a signature. On
  `user.updated` it upserts by `data.id`, so a forged event can rewrite any user's `email`, `name` and images, and
  set `fromClerk`.

## Status

Fixed. The webhook is removed with Clerk ([Clerk](../integrations/clerk.md)); a person's `User` row is written by `UpsertMe` from the signed token ([auth](../security/auth.md)).

## History

- 2026-11-05: was Open, naming the webhook route and `proxy.ts`; now Fixed, because the route and Clerk are removed.

## Sources

- `dataconnect/app/me.gql`
