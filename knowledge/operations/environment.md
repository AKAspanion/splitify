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

- **Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`,
  `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, and where to land after them. `.env.sample` still names the after-sign-in pair,
  `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`, which Clerk 7 no longer reads: it
  reads the fallback-redirect pair, so the sample is out of date until the Clerk keys go with Clerk
  ([Firebase Auth](../decisions/firebase-auth.md)).
- **Firebase:** `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
  `NEXT_PUBLIC_FIREBASE_APP_ID`, read by `lib/firebase/app.ts`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, the public Web Push key `lib/push/register.ts` reads (missing from `.env.sample` until the developer adds it), and `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`, which points
  the browser at the Auth and SQL Connect emulators ([run locally](run-locally.md)). The hosted sign-in screens and the push
  registration use them; the server app's pages still sign in through Clerk.
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
- The OneSignal keys: `lib/onesignal.ts` (the browser no longer reads them).
- `NEXT_PUBLIC_HOST_URL`: `utils/validate.ts` (`getUrlWithHost`).
- `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`: `app/layout.tsx`.
- `ENABLE_DB_LOGGING`, `ENABLE_CONSOLE_LOGGING`: `lib/logger.ts`; `ENABLE_PRISMA_QUERY_LOGGING`: `lib/db.ts`.
- The Clerk and UploadThing keys are read by their SDKs, not by the app's code.

## History

- 2026-11-05: the OneSignal keys were also read by `app/launch.tsx`; now only `lib/onesignal.ts` reads them, and `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is read by `lib/push/register.ts`, because push moved to FCM.
- 2026-11-04: added the Firebase keys, because the browser-side sign-in and SQL Connect client were built. The Clerk after-sign-in line now says what `.env.sample` holds, because the claim that it held the fallback pair didn't match the file.
- 2026-11-04: Clerk's after-sign-in keys were `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `_AFTER_SIGN_UP_URL`; now the `_FALLBACK_REDIRECT_URL` pair, because Clerk 7 dropped the old names. See [upgrade](../decisions/upgrade-all-dependencies.md).
- 2026-11-04: `DATABASE_URL` was read in `prisma/schema.prisma` and UploadThing used `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`; now `prisma.config.ts` and `lib/db.ts` read it, and UploadThing uses `UPLOADTHING_TOKEN`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `.env.sample`
- `lib/firebase/app.ts`
- `prisma.config.ts`
- `lib/db.ts`
- `prisma/schema.prisma`
- `lib/onesignal.ts`
- `lib/push/register.ts`
- `utils/validate.ts`
- `app/layout.tsx`
- `lib/logger.ts`
- `lib/db.ts`
- `app/api/webauthn/verify-authentication/route.ts`
