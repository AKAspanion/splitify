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

- **Personal details:** `User.email`, `User.name`, `User.firstName`, `User.lastName` and profile images, from Clerk or
  typed in for contacts. Group members' details are returned by the group and report routes.
- **Spending:** every expense, payment and split, per person and group.
- **Device keys:** each user's WebAuthn public keys and counters, as JSON in `AuthnDevice.data`.
- **Logs:** when `ENABLE_DB_LOGGING` is `YES`, `APILogger.info` stores the request outcome it is given in `Log.body`; the
  notification routes pass OneSignal's results ([logging](../operations/logging.md)).
- **Feedback** text in `Feedback`.

## Protections

- Data is reachable only with a Clerk session ([auth](auth.md)), but not limited to the caller's own groups:
  [roles](roles.md) lists what any signed-in person can read or change.
- Secrets are read from environment variables listed in `.env.sample`, whose secret values are empty. Two exceptions
  are in the code: [the hard-coded session password](../findings/hardcoded-session-password.md) and
  [the committed Firebase config](../findings/committed-firebase-config.md).
- `.claude/settings.json` stops Claude reading `.env` files.

## Sources

- `prisma/schema.prisma`
- `lib/logger.ts`
- `lib/auth/service/devices.ts`
- `.env.sample`
- `.claude/settings.json`
