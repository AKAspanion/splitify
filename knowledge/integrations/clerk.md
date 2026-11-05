---
type: Integration
title: Clerk (removed)
description: Clerk, the old sign-in provider, and its webhook are removed; Firebase Auth replaced them.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Clerk (removed)

The Clerk account no longer exists and nothing in the app uses it: no `@clerk/nextjs`, no middleware, no `ClerkProvider`,
no sign-in pages of Clerk's and no `/api/webhook/clerk` route. [Firebase Auth](../decisions/firebase-auth.md) signs people
in ([auth](../security/auth.md), [sign in](../features/sign-in.md)), `UpsertMe` writes the `User` row from the signed
token, and a function merges a contact into a verified new account ([contact identity](../domain/contact-identity.md)).

Leftovers: `next.config.mjs` still allows Clerk's image hosts in `images.remotePatterns`, for profile pictures stored by
earlier sign-ins, and `User.fromClerk`-style history may remain in old data; `.env.sample` still lists the `CLERK_*` keys
until the developer removes them ([environment](../operations/environment.md)).

The finding about the unverified webhook is [fixed](../findings/clerk-webhook-unverified.md) by the webhook's removal.

## History

- 2026-11-05: was Clerk for sessions, route protection and the user webhook; now removed, because spec 2c removed the server and its middleware. See [decision](../decisions/firebase-auth.md).

## Sources

- `next.config.mjs`
- `lib/firebase/auth.ts`
- `dataconnect/app/me.gql`
- `.env.sample`
