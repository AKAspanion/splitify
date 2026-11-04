---
type: Feature
title: Biometric lock
description: A person can register a passkey device; the signed-in app then asks for it once per browser session before showing anything.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Biometric lock

## What it does

- On the biometric page a person registers this device's passkey, sees their devices, or removes them all.
- Once a person has a device, the `Biometric` component opens a dialog on every signed-in screen until they pass a
  WebAuthn check. It records the pass in `sessionStorage` (`verified`), so it asks again in a new browser session.
  People with no devices are never asked.

## Screens and routes

- Register: `app/(platform)/(app)/webauthn/register/page.tsx` (`authn-register.tsx`, `authn-devices.tsx`, `authn-actions.tsx`).
- The lock: `components/biometric/biometric.tsx`, mounted in `app/(platform)/layout.tsx`; it skips the paths in its
  `publicRoutes` list.
- Routes: the [WebAuthn API](../api/webauthn.md).

## Rules

- The lock runs in the browser and hides the screen; it does not stop requests. The server still trusts the Clerk
  session alone ([auth](../security/auth.md)).
- `app/(platform)/(app)/webauthn/test/page.tsx` is a test page left in the app ([debt](../risks/debt.md)).

## Sources

- `components/biometric/biometric.tsx`
- `app/(platform)/layout.tsx`
- `app/(platform)/(app)/webauthn/register/page.tsx`
- `app/(platform)/(app)/webauthn/register/authn-register.tsx`
- `app/(platform)/(app)/webauthn/register/authn-devices.tsx`
- `app/(platform)/(app)/webauthn/register/authn-actions.tsx`
- `app/(platform)/(app)/webauthn/test/page.tsx`
