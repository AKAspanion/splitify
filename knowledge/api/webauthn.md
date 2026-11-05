---
type: API Contract
title: WebAuthn API
description: The webauthn Cloud Function: six routes that register a person's passkey devices and check one, used by the biometric lock.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# WebAuthn API

One Cloud Function, `webauthn` (`functions/src/webauthn/index.ts`, region `asia-south1`), answers the same six paths the
route handlers did; Hosting rewrites `/api/webauthn/**` to it ([Cloud Functions](../apps/functions.md)). The browser calls
it through `callFunction`.

## Routes

- `GET /api/webauthn/generate-registration-options` and `POST /api/webauthn/verify-registration`: register a device.
- `GET /api/webauthn/generate-authentication-options` and `POST /api/webauthn/verify-authentication`: check a
  registered device; the response is `{ data: { verified } }`.
- `GET /api/webauthn/devices`: the caller's registered devices.
- `POST /api/webauthn/devices/remove`: removes all of the caller's devices.

## Rules

- Every route runs the guard first and acts only on the caller's own devices, by the uid in the verified ID token: `401`
  without one ([auth](../security/auth.md)). An unknown path is `404`, a wrong method `405`, anything unexpected `500`.
- A failed verification, or a verification with no challenge in progress, answers `400`: it is the caller's error, not the
  server's.
- The challenge between the two steps is kept in an iron-session cookie named `__session`, because Hosting forwards only
  that cookie to a function. It is sealed with the `SESSION_PASSWORD` secret (at least 32 characters, else `500`) and
  lives ten minutes. The responses are `Cache-Control: private`. That the cookie survives the Hosting rewrite in
  production is untested until the first deploy.
- The relying-party id and expected origin are the params `AUTHN_RP_ID` and `AUTHN_EXPECTED_ORIGIN`, defaulting to
  `splitify.spanion.in` and its origin; an empty value falls back to the default.
- All of a user's devices are stored as one JSON value in `AuthnDevice.devices`, read and written through the `admin`
  connector, in the shape SimpleWebAuthn 9 called `AuthenticatorDevice` (`credentialID` and `credentialPublicKey` as bytes),
  converted to and from SimpleWebAuthn's credential, so passkeys registered before the upgrade still verify.
- Registration sends the UTF-8 bytes of the Firebase uid as the WebAuthn user id, as SimpleWebAuthn 9 did with a string.
- After a successful check the new signature counter is saved
  ([fixed](../findings/webauthn-counter-not-saved.md)). Two concurrent verifications can still overwrite each other's
  device list.

## History

- 2026-11-05: was six Next.js route handlers behind Clerk, sealing the challenge in a cookie named `challenge` with a hard-coded password and never saving the counter; now one function behind the guard, with the `__session` cookie, a secret, a saved counter and `400` for a failed verification, because spec 2c removed the server. See [static build decision](../decisions/static-build-on-firebase-hosting.md).

## Sources

- `functions/src/webauthn/index.ts`
- `functions/src/webauthn/session.ts`
- `functions/src/webauthn/webauthn.test.ts`
- `functions/src/http/guard.ts`
- `lib/functions/call.ts`
