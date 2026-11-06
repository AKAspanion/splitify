---
type: Runbook
title: Environment
description: Every environment variable the app reads, listed in .env.sample, and where each is read.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Environment

## Variables

The browser build reads `NEXT_PUBLIC_*` keys, copied from `.env.sample` into `.env`; everything else is a Firebase param
or secret on the functions, never a file in the repository. The groups:

- **Firebase (browser):** `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, read by `lib/firebase/app.ts`
  (the auth domain is `splitify.spanion.in` in production, so Google's redirect runs on the site's own host;
  `.env.sample` still holds the old value until the developer changes it, since agents may not edit `.env` files);
  `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, the public Web Push key `lib/push/register.ts` reads (missing from `.env.sample`
  until the developer adds it); and `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`, which points the browser at `127.0.0.1` on the Auth, SQL
  Connect and Functions emulator ports in `firebase.json` ([run locally](run-locally.md)); `pnpm dev` sets it, so local development needs no `.env`.
- **Functions:** the secret `SESSION_PASSWORD` (at least 32 characters; set with `firebase functions:secrets:set`) and the
  params `AUTHN_RP_ID` and `AUTHN_EXPECTED_ORIGIN`, which must match the host the app is served from and default to the
  production host ([Cloud Functions](../apps/functions.md), [deploy setup](deploy-setup.md)).
- **Site:** `NEXT_PUBLIC_HOST_URL`, read in `utils/validate.ts` (`getUrlWithHost`), and `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`,
  read in `app/adsense.tsx`.

There is no database URL, no Clerk, OneSignal or UploadThing key and no logging switch: the database is SQL Connect, and
those services and lib/logger.ts are removed ([Clerk](../integrations/clerk.md), [OneSignal](../integrations/onesignal.md),
[UploadThing](../integrations/uploadthing.md), [Cloud Logging](../decisions/cloud-logging.md)).

`.env.sample` still lists the removed keys until the developer edits it (agents may not edit it): the Clerk keys,
`DATABASE_URL`, `UPLOADTHING_*`, the OneSignal keys, the three logging switches, and `NEXT_PUBLIC_HOST_URL` if unused.
`AUTHN_RP_ID` and `AUTHN_EXPECTED_ORIGIN` are function params now, not `.env` keys.

## History

- 2026-11-06: `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` was read in `app/layout.tsx`; now in `app/adsense.tsx`, because the layout no longer passes it. See [AdSense](../integrations/google-adsense.md).
- 2026-11-05: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` carried no stated value; now it is `splitify.spanion.in` in production, because Google sign-in became a redirect on the site's own host. See [sign-in](../features/sign-in.md).
- 2026-11-05: `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` was set by hand in `.env`; now `pnpm dev` sets it with demo Firebase keys and the ports come from `firebase.json`, because local development moved onto the emulators.
- 2026-11-05: listed the Clerk, MySQL, OneSignal, UploadThing and logging keys and their readers; now only the Firebase, function and site keys, because spec 2c removed the server. See [decision](../decisions/static-build-on-firebase-hosting.md).

- 2026-11-05: the OneSignal keys were also read by `app/launch.tsx`; now only `lib/onesignal.ts` reads them, and `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is read by `lib/push/register.ts`, because push moved to FCM.
- 2026-11-04: added the Firebase keys, because the browser-side sign-in and SQL Connect client were built. The Clerk after-sign-in line now says what `.env.sample` holds, because the claim that it held the fallback pair didn't match the file.
- 2026-11-04: Clerk's after-sign-in keys were `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `_AFTER_SIGN_UP_URL`; now the `_FALLBACK_REDIRECT_URL` pair, because Clerk 7 dropped the old names. See [upgrade](../decisions/upgrade-all-dependencies.md).
- 2026-11-04: `DATABASE_URL` was read in `prisma/schema.prisma` and UploadThing used `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`; now `prisma.config.ts` and `lib/db.ts` read it, and UploadThing uses `UPLOADTHING_TOKEN`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `.env.sample`
- `lib/firebase/emulators.ts`
- `scripts/dev-env.mjs`
- `lib/firebase/app.ts`
- `lib/push/register.ts`
- `utils/validate.ts`
- `app/adsense.tsx`
- `app/layout.tsx`
- `functions/src/webauthn/index.ts`
