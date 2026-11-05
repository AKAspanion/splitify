# Spec: the last server pieces to Cloud Functions, and a static-only build (spec 2c, with spec 3)

Date: 2026-11-05 · Branch: `feat/server-to-functions`, stacked on spec 2b's

## Why

After 2b every screen reads and writes through SQL Connect in the browser. What still needs a server is the report
downloads, the WebAuthn biometric lock, and deleting an account; everything else on the server (server actions,
`/api/app`, `actions/get-*`, Prisma, Clerk, `proxy.ts`, the Clerk webhook, UploadThing, the OneSignal server code)
has no caller left. This part moves the three into Cloud Functions, removes the rest, and makes the static export the
only build, which is what spec 3 (the static build on Firebase Hosting) still had to do; spec 3 is folded in here.

Settled facts: [static build](../../knowledge/decisions/static-build-on-firebase-hosting.md) (server routes as Cloud
Functions under `/api/` on the same domain), [anonymise deleted accounts](../../knowledge/decisions/anonymise-deleted-accounts.md),
[Firebase Auth](../../knowledge/decisions/firebase-auth.md), [FCM](../../knowledge/decisions/firebase-cloud-messaging.md),
[Cloud Logging](../../knowledge/decisions/cloud-logging.md), [SQL Connect](../../knowledge/decisions/sql-connect-database.md).

## Scope

In: the reports function, the WebAuthn functions, the account-deletion callable, the Hosting rewrites to them, the
three screens that call them, removing the server code and its packages, the static-only build, and a
Content-Security-Policy header.

Out: offline support (spec 4).

## Calling a function from the browser

- Every function the browser calls checks the Firebase ID token from `Authorization: Bearer <token>` with the admin
  SDK before reading the body, and answers `401 {"message": "Sign in again to continue."}` without one or with a bad
  one. `lib/functions/call.ts` `callFunction(path, init)` adds the token (`getIdToken()`) and maps errors through
  `toUserMessage`.
- Every request body is at most 64 KB (`413 {"message": "That request is too large."}` past it), and JSON only.
- Hosting rewrites `/api/reports/**` to the `reports` function and `/api/webauthn/**` to the `webauthn` function,
  before every page rewrite, so they share the site's origin and its cookies.

## Reports

- `reports` (2nd gen, `onRequest`, `asia-south1`) answers `POST /api/reports/expenses` with
  `{ groupId: string, format: "excel" | "csv" | "text" }`. It checks the caller is a member of the group (an admin
  query by key); a non-member gets `404 {"message": "Not found"}`, as a missing group does.
- It reads the group's expenses with their payments and splits through the admin connector and builds the file the
  old `/api/generate/*/expense` routes built (`lib/excel.ts`'s workbook, the CSV and the text summary, moved into
  `functions/src/reports/`), with the same names and content types.
- The group page's "Download report" button comes back, calling it through `callFunction`.

## WebAuthn

- `webauthn` (2nd gen, `onRequest`, `asia-south1`) answers what the six `/api/webauthn/*` routes answered, at the same
  paths, with SimpleWebAuthn and iron-session as today; `SESSION_PASSWORD`, `AUTHN_RP_ID` and `AUTHN_EXPECTED_ORIGIN`
  become function secrets and params (`defineSecret`, `defineString`), the RP id `splitify.spanion.in`.
- The user is the Firebase token's `uid`, never one from the body; devices are read and written through the admin
  connector's `GetDevices` and `SaveDevices`, keeping the counter update.
- `components/biometric/biometric.tsx` and the `/webauthn/register` and `/webauthn/test` pages call it through
  `callFunction`, and join the hosting build.

## Deleting an account

- `deleteMyAccount` (callable, `asia-south1`) anonymises the caller's `User` row as
  `decisions/anonymise-deleted-accounts` says (the rules `lib/account/anonymise.ts` applies, moved to
  `functions/src/account/anonymise.ts` and run through admin mutations in one transaction), deletes their push
  tokens, then deletes their Firebase Auth user. If deleting the Firebase user fails, the anonymisation stands and the
  function answers an error, so a retry finishes the job.
- The profile's "Delete account" asks first ("Delete your account? Your shared expenses stay, shown as Deleted user.
  This can't be undone."), calls it, signs out and goes to `/`.

## Removing the server

- Removed: `actions/`, `app/api/`, `lib/db.ts`, `lib/safe-actions.ts`, `lib/logger.ts`, `lib/onesignal.ts`,
  `lib/notification/`, `lib/account/` (after the move), `prisma/`, `prisma.config.ts`, `proxy.ts`, the Clerk pages
  under `app/(platform)/(clerk)/`, `components/uploadthing/`, `hooks/use-action.ts` and the old data hooks in
  `hooks/` that call `/api/app`, `utils/api.ts`, and `lib/clerk-hosting.tsx`.
- Packages removed: `@clerk/nextjs`, `@clerk/themes`, `@prisma/adapter-mariadb`, `@prisma/client`, `prisma`,
  `mariadb`, `uploadthing`, `@uploadthing/react`, `iron-session` and `@simplewebauthn/server` (both move to
  `functions/`), `axios`, `exceljs` (moves to `functions/`), `@vercel/analytics`, `@vercel/speed-insights`.
- `types/shared.d.ts` stops importing Prisma: its expense, payment, split and user shapes are declared there, matching
  what `toLedgerExpenses` gives.
- `postinstall` and `postbuild` no longer touch Prisma; `postinstall` runs `yarn dataconnect:generate` only.
- `.env.sample` loses the Clerk, MySQL, UploadThing, OneSignal and logging keys.

## One build

- `next.config.mjs` always exports statically (`output: "export"`, `trailingSlash`, `images.unoptimized`); the
  `NEXT_BUILD_TARGET` switch and `pageExtensions: ["hosting.tsx"]` stay, since the `page.hosting.tsx` entries hold
  `generateStaticParams`, which a client page can't. `yarn build` runs the export; `build:hosting` becomes an alias
  of it.
- The coming-soon page and its catch-all rewrite are removed; any unknown path gets a 404 page,
  `app/not-found.hosting.tsx` ("We couldn't find that page." with a link to `/groups`).
- `app/analytics.tsx` is removed (Vercel's).

## Headers

- A `Content-Security-Policy` in `firebase.json`, in flash-cards' form: `default-src 'self'`; scripts from `'self'`,
  `https://apis.google.com`, `https://www.gstatic.com` and AdSense's hosts; connections to `'self'`,
  `https://*.googleapis.com`, `https://*.firebaseio.com`, `https://firebaseinstallations.googleapis.com`,
  `https://fcmregistrations.googleapis.com` and AdSense's; frames from `https://splitify-416321.firebaseapp.com` and
  `https://accounts.google.com`; `worker-src 'self'`; `object-src 'none'`; `frame-ancestors 'none'`;
  `upgrade-insecure-requests`. The plan checks the list against what the pages load in the browser, with no
  violation reported.

## Testing

- Functions: the token check (missing, bad, good), the 64 KB cap, a non-member's report answering 404, each report
  format's content type and first line, WebAuthn options and verification against the emulators with SimpleWebAuthn's
  test helpers, and `deleteMyAccount` anonymising, deleting tokens and the Auth user, and leaving the anonymisation
  when the Auth delete fails.
- `yarn tsc --noEmit`, `yarn lint`, `yarn test`, `yarn test:rules`, `yarn build` and `yarn check:hosting` pass, and
  `grep` finds no import of a removed package or file.
- Browser check against the emulators: download each report, register and use the biometric lock where the browser
  supports it, delete an account (the person's expenses show "Deleted user" to the others), an unknown path's 404, and
  no CSP violation on any page.

## Done when

- The checks above pass, and `yarn build` produces the whole site as static files.
