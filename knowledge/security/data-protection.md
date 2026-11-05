---
type: Security
title: Data protection
description: What Splitify stores that is personal or sensitive, where it lives, and what protects it.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Data protection

## Sensitive data

- **Personal details:** `User.email`, `User.name`, `User.firstName`, `User.lastName` and profile images, from the sign-in
  provider or typed in for contacts. Group members' details are returned by the group queries and the reports.
- **Spending:** every expense, payment and split, per person and group.
- **Device keys:** each user's WebAuthn public keys and counters, in `AuthnDevice.devices`, read and written only by
  the `webauthn` function through the `admin` connector, which no signed-in person can call
  ([SQL Connect schema](../data/sql-connect.md)).
- **Push tokens** in `PushToken`, owned by whoever is signed in on the device.
- **Logs:** Cloud Functions write to Cloud Logging, with an error's class and never its message, a token or a body
  ([decision](../decisions/cloud-logging.md), [logging](../operations/logging.md)).
- **Feedback** text in `Feedback`.

## Protections

- Data is reachable only with a Firebase ID token ([auth](auth.md)), and SQL Connect's rules limit each operation to the
  caller's own groups and friends ([roles](roles.md)). The functions refuse a call without a valid token.
- Secrets are Firebase secrets and params, never in the code: `SESSION_PASSWORD` is a function secret
  ([Cloud Functions](../apps/functions.md)). The old hard-coded session password is
  [fixed](../findings/hardcoded-session-password.md); [the committed Firebase config](../findings/committed-firebase-config.md)
  is a separate finding.
- Hosting sends the security headers in `firebase.json`: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy` and a Content-Security-Policy that limits scripts, connections and frames to
  the hosts the pages load (Google, Firebase and AdSense hosts, and the one Cloud Functions host). Provisional: its
  `script-src` and `style-src` allow `'unsafe-inline'`, because Next's static export inlines its hydration scripts and
  styles; the developer accepts it or asks for script hashes later, and production may load more AdSense hosts, so
  watch for CSP violations after the first deploy.
- `.claude/settings.json` stops Claude reading `.env` files.

## History

- 2026-11-05: was Clerk sessions, `AuthnDevice.data` and the `Log` table over MySQL; now ID-token checks, `AuthnDevice.devices` through the admin connector, Cloud Logging and the Hosting security headers, because spec 2c removed the server. See [decision](../decisions/static-build-on-firebase-hosting.md).

## Sources

- `firebase.json`
- `functions/src/webauthn/index.ts`
- `functions/src/http/guard.ts`
- `dataconnect/schema/schema.gql`
- `.claude/settings.json`
