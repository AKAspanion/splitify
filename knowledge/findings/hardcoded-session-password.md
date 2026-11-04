---
type: Finding
title: Session password is hard-coded
description: The iron-session password that seals the WebAuthn challenge cookie is written as a literal in four route files, so it is in git history.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Session password is hard-coded

## Finding

Each WebAuthn route opens the `challenge` cookie with `getIronSession`, passing a password written as a literal
rather than read from the environment. Anyone with the repository can unseal or forge that cookie. The value is not
repeated here.

## Evidence

- `app/api/webauthn/generate-registration-options/route.ts`, line 69
- `app/api/webauthn/generate-authentication-options/route.ts`, line 43
- `app/api/webauthn/verify-registration/route.ts`, line 35
- `app/api/webauthn/verify-authentication/route.ts`, line 30

## Status

Open. Fixing it means moving the value to an environment variable and rotating it.

## Sources

- `app/api/webauthn/generate-registration-options/route.ts`
- `app/api/webauthn/generate-authentication-options/route.ts`
- `app/api/webauthn/verify-registration/route.ts`
- `app/api/webauthn/verify-authentication/route.ts`
