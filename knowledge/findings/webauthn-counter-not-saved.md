---
type: Finding
title: Fixed: the WebAuthn counter wasn't saved
description: After a successful check the authenticator's new signature counter was set on an in-memory copy and never written back; the webauthn function now saves it.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Fixed: the WebAuthn counter wasn't saved

## Finding

As found, before the server was removed:

`POST /api/webauthn/verify-authentication` sets `dbAuthenticator.counter = authenticationInfo.newCounter` on the
object it parsed from `AuthnDevice.data`, but never saves it. Every later check compares against the counter stored
at registration.

## Evidence

- app/api/webauthn/verify-authentication/route.ts: the counter is assigned; no `db` call follows.
- lib/auth/service/devices.ts has no function that updates one device.

## Status

Fixed. `verifyAuthentication` writes the new counter back to `AuthnDevice.devices`, and a test with a software authenticator covers it ([WebAuthn API](../api/webauthn.md)). A read-modify-write race between two concurrent verifications remains, as before.

## History

- 2026-11-05: was Open, naming the route and `lib/auth/service/devices.ts`; now Fixed, because the webauthn function saves the counter.

## Sources

- `functions/src/webauthn/index.ts`
- `functions/src/webauthn/webauthn.test.ts`
