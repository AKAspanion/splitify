---
type: Runbook
title: Environment
description: Every environment variable the app reads, listed in .env.sample, and where each is read.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Environment

## Variables

The full list is `.env.sample`; copy it to `.env` and fill it in. The groups:

- **Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` and the four `NEXT_PUBLIC_CLERK_*_URL` keys.
- **Database:** `DATABASE_URL`, a MySQL URL.
- **WebAuthn:** `AUTHN_RP_ID` and `AUTHN_EXPECTED_ORIGIN`, which must match the host the app is served from.
- **OneSignal:** `NEXT_PUBLIC_ONE_SIGNAL_APP_ID`, `NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID`, `ONE_SIGNAL_REST_API_KEY`.
- **UploadThing:** `UPLOADTHING_TOKEN`, which uploadthing 7 reads in place of `UPLOADTHING_SECRET` and
  `UPLOADTHING_APP_ID`.
- **Site:** `NEXT_PUBLIC_HOST_URL` (the base for links in notifications), `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`.
- **Logging:** `ENABLE_DB_LOGGING`, `ENABLE_CONSOLE_LOGGING`, `ENABLE_PRISMA_QUERY_LOGGING`
  ([logging](logging.md)).

## Where each is read

- `DATABASE_URL`: `prisma.config.ts`, for the Prisma CLI, and `lib/db.ts`, which hands it to the MariaDB driver
  adapter. The adapter reads a `mysql://` URL, but not the query options only Prisma's old engine understood.
- `AUTHN_RP_ID`, `AUTHN_EXPECTED_ORIGIN`: the four `app/api/webauthn/*` option and verify routes, each with its own
  fallback.
- `NEXT_PUBLIC_ONE_SIGNAL_APP_ID`: `lib/onesignal.ts` and `app/launch.tsx`; `NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID`:
  `app/launch.tsx`; `ONE_SIGNAL_REST_API_KEY`: `lib/onesignal.ts`.
- `NEXT_PUBLIC_HOST_URL`: `utils/validate.ts` (`getUrlWithHost`).
- `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`: `app/layout.tsx`.
- `ENABLE_DB_LOGGING`, `ENABLE_CONSOLE_LOGGING`: `lib/logger.ts`; `ENABLE_PRISMA_QUERY_LOGGING`: `lib/db.ts`.
- The Clerk and UploadThing keys are read by their SDKs, not by the app's code.

## History

- 2026-11-04: `DATABASE_URL` was read in `prisma/schema.prisma` and UploadThing used `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`; now `prisma.config.ts` and `lib/db.ts` read it, and UploadThing uses `UPLOADTHING_TOKEN`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `.env.sample`
- `prisma.config.ts`
- `lib/db.ts`
- `prisma/schema.prisma`
- `lib/onesignal.ts`
- `app/launch.tsx`
- `utils/validate.ts`
- `app/layout.tsx`
- `lib/logger.ts`
- `lib/db.ts`
- `app/api/webauthn/verify-authentication/route.ts`
