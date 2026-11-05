---
type: Finding
title: Fixed: the session password was hard-coded
description: The iron-session password that sealed the WebAuthn challenge cookie was a literal in four route files, so it was in git history; the webauthn function reads it from the SESSION_PASSWORD secret.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Fixed: the session password was hard-coded

## Finding

As found, before the server was removed:

Each WebAuthn route opens the `challenge` cookie with `getIronSession`, passing a password written as a literal
rather than read from the environment. Anyone with the repository can unseal or forge that cookie. The value is not
repeated here.

## Evidence

- app/api/webauthn/generate-registration-options/route.ts, line 69
- app/api/webauthn/generate-authentication-options/route.ts, line 43
- app/api/webauthn/verify-registration/route.ts, line 35
- app/api/webauthn/verify-authentication/route.ts, line 30

## Status

Fixed in the code: the function reads `SESSION_PASSWORD`, a Firebase secret, and refuses a missing or short one with a 500 ([Cloud Functions](../apps/functions.md)). The old literal is still in git history, so the secret must be a new value, never the old one.

## History

- 2026-11-05: was Open, naming four route files; now Fixed, because the webauthn function takes the password from a secret.

## Sources

- `functions/src/webauthn/session.ts`
- `functions/src/webauthn/index.ts`
