---
type: Finding
title: WebAuthn counter isn't saved
description: After a successful check the authenticator's new signature counter is set on an in-memory copy and never written back, so cloned authenticators aren't detected.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# WebAuthn counter isn't saved

## Finding

`POST /api/webauthn/verify-authentication` sets `dbAuthenticator.counter = authenticationInfo.newCounter` on the
object it parsed from `AuthnDevice.data`, but never saves it. Every later check compares against the counter stored
at registration.

## Evidence

- `app/api/webauthn/verify-authentication/route.ts`: the counter is assigned; no `db` call follows.
- `lib/auth/service/devices.ts` has no function that updates one device.

## Status

Open.

## Sources

- `app/api/webauthn/verify-authentication/route.ts`
- `lib/auth/service/devices.ts`
