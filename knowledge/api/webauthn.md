---
type: API Contract
title: WebAuthn API
description: Routes that register a person's passkey devices and check one, used by the biometric lock.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# WebAuthn API

## Routes

<!-- GA-GENERATED:routes app/api/webauthn -->

- `GET /api/webauthn/devices`: `app/api/webauthn/devices/route.ts`
- `POST /api/webauthn/devices/remove`: `app/api/webauthn/devices/remove/route.ts`
- `GET /api/webauthn/generate-authentication-options`: `app/api/webauthn/generate-authentication-options/route.ts`
- `GET /api/webauthn/generate-registration-options`: `app/api/webauthn/generate-registration-options/route.ts`
- `POST /api/webauthn/verify-authentication`: `app/api/webauthn/verify-authentication/route.ts`
- `POST /api/webauthn/verify-registration`: `app/api/webauthn/verify-registration/route.ts`

<!-- GA-GENERATED:END -->

- `GET /api/webauthn/generate-registration-options` and `POST /api/webauthn/verify-registration`: register a
  device. Verified devices are appended by `DevicesService.pushDevice` (`lib/auth/service/devices.ts`).
- `GET /api/webauthn/generate-authentication-options` and `POST /api/webauthn/verify-authentication`: check a
  registered device; the response is `{ data: { verified } }`.
- `GET /api/webauthn/devices`: the caller's registered devices.
- `POST /api/webauthn/devices/remove`: removes all of the caller's devices.

## Rules

- Every route needs a Clerk session and acts only on the caller's own devices (`(await auth()).userId`).
- The challenge between the two steps is kept in an iron-session cookie named `challenge`; see
  [auth](../security/auth.md) and [hard-coded session password](../findings/hardcoded-session-password.md).
- The relying-party id and expected origin come from `AUTHN_RP_ID` and `AUTHN_EXPECTED_ORIGIN`, with fallbacks in
  each route file.
- All of a user's devices are stored as one JSON blob in `AuthnDevice.data`, in the shape SimpleWebAuthn 9 called
  `AuthenticatorDevice` (`credentialID` and `credentialPublicKey` as bytes). `lib/auth/service/devices.ts` converts
  each to and from SimpleWebAuthn's `WebAuthnCredential` (`id` as base64url), so passkeys registered before the
  upgrade still verify, and no data migration was needed.
- Registration sends the UTF-8 bytes of the Clerk id as the WebAuthn user id, as SimpleWebAuthn 9 did with a string.
- After a successful check the new signature counter is not saved: see
  [WebAuthn counter not saved](../findings/webauthn-counter-not-saved.md).

## Sources

- `app/api/webauthn/generate-registration-options/route.ts`
- `app/api/webauthn/verify-registration/route.ts`
- `app/api/webauthn/generate-authentication-options/route.ts`
- `app/api/webauthn/verify-authentication/route.ts`
- `app/api/webauthn/devices/route.ts`
- `app/api/webauthn/devices/remove/route.ts`
- `lib/auth/service/devices.ts`
