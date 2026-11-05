---
type: Application
title: Splitify web app
description: The Next.js 16 app at the repository root, built as one static site for Firebase Hosting: the landing page, the signed-in app and the sign-in screens.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Splitify web app

## Role

The whole product. Everything people do happens here; the Android and iOS apps only open it.

## Stack

Next.js App Router built as a static export, React, Tailwind with shadcn/ui, Firebase (Auth, SQL Connect, Cloud
Functions, Hosting), react-query and zustand on the client. Versions are in `package.json`. There is no server: see
[architecture](../project/architecture.md).

## Entry points

- `app/layout.tsx`: the root layout. It loads Google AdSense (`app/adsense.tsx`), the theme provider and
  `components/providers.tsx` (Firebase auth state, react-query, the confirm dialog, the progress bar).
- `app/launch.tsx`: runs on every page for a signed-in person (Firebase Auth); it registers the one service worker ([service worker](../operations/service-worker.md)) and the device for push
  ([notifications](../features/notifications.md)) and sends the person from the landing page to `/groups`.
- `app/(platform)/layout.tsx`: wraps the signed-in app and mounts the [biometric lock](../features/biometric-lock.md).
- `app/(platform)/(app)/layout.tsx`: the top and bottom navigation bars.
- `app/manifest.webmanifest`: the PWA manifest.
- `app/not-found.hosting.tsx`: the 404 page; Hosting serves it as `404.html` for any path that is not a page.
- The dev server runs on `127.0.0.1:2140` (`scripts.dev:web`), started by `pnpm dev` ([run locally](../operations/run-locally.md)).

## The one static build

In `next dev` only, the config is a function of the phase: it drops the export and adds dev-only rewrites to the Functions emulator ([run locally](../operations/run-locally.md)).

`next.config.mjs` always builds a static export, for Firebase Hosting ([decision](../decisions/static-build-on-firebase-hosting.md)):
`output: "export"`, `trailingSlash`, unoptimised images, and `pageExtensions: ["hosting.tsx"]`, so only `*.hosting.tsx`
files are routes. `pnpm build` and `pnpm build:hosting` are the same build; there is no server build, no route handler,
no server action and no middleware. The `*.hosting.tsx` entries re-export the pages and layouts that sit beside them.
`firebase.json` rewrites `/api/reports/**` and `/api/webauthn/**` to the [Cloud Functions](functions.md), serves the
404 page for any other path that is not a page, and sets the security headers and the Content-Security-Policy
([data protection](../security/data-protection.md)).

- The landing page and navbar read the Firebase Auth state (`useAuth`) and show the signed-in or
  signed-out view, and the sign-in, sign-up and forgot-password screens are hosted routes ([sign in](../features/sign-in.md)).
- The signed-in screens are in this build too. `app/(platform)/(app)/layout.hosting.tsx` is their shell: `RequireAuth`
  around the navbars, the [verify-email banner](../security/auth.md) (`components/auth/verify-email-banner.tsx`) and the
  page; `(screens)/layout.hosting.tsx` mounts the Add Expense button, because only `layout.hosting.tsx` files
  count as layouts, never `layout.tsx`. The navbars read `useAuth` and show initials, since `AuthUser` has no photo.
  Screens read and write through [SQL Connect](../data/sql-connect.md) hooks, not server actions.
- A route with an id segment is built once, with the placeholder `_` (`generateStaticParams`), and `firebase.json` rewrites
  every real id to that page, most specific path first. The screen reads the real ids
  from the address with `useRouteIds` (`hooks/use-route-ids.ts`), never from the page's params. Such a route's
  `page.hosting.tsx` is a small server wrapper that renders the client page beside `generateStaticParams`: Next refuses
  `generateStaticParams` re-exported next to a `"use client"` default.
- `pnpm check:hosting` (`scripts/check-hosting-build.mjs`) reads one manifest per area from `scripts/hosting-pages/*.json`:
  the pages that must exist in `out/` and the requests that must answer 200 with given text.
- `components/providers.tsx` keys a `PersistQueryClientProvider` by the signed-in uid, because the saved cache is read only at mount ([offline](../features/offline.md)), and makes one `QueryClient` per mount (through `useState`): one made on every render left
  invalidation after a write reaching nobody.
- A signed-out person goes to `/sign-in/?next=<path>`, or home (`/`) after a sign-out they chose (`lib/auth-redirect.ts`).
- Known and harmless: on `/privacy` and `/delete-account` the biometric lock calls `/api/webauthn/devices` with no
  signed-in person, so `callFunction` throws before any request and the lock stays off.
- `scripts/emulator-firebase-config.mjs` writes `firebase.emulators.json`: `firebase.json` with the Auth, SQL Connect and
  Functions emulators' addresses added to the CSP's `connect-src`, so the app served by the Hosting emulator may call
  them. It is generated, so the two cannot drift; `pnpm check:hosting` regenerates it. Use it with `--config` for local
  checks, and never deploy with it ([run locally](../operations/run-locally.md)).

## Screens and routes

<!-- GA-GENERATED:screens app -->

- `/`: `app/(landing)/page.tsx`
- `/activity`: `app/(platform)/(app)/(screens)/activity/page.tsx`
- `/activity/:id`: `app/(platform)/(app)/(screens)/activity/[id]/page.tsx`
- `/dashboard`: `app/(platform)/(app)/(screens)/dashboard/page.tsx`
- `/delete-account`: `app/(platform)/delete-account/page.tsx`
- `/expense/:id/edit`: `app/(platform)/(app)/(forms)/expense/[id]/edit/page.tsx`
- `/expense/add`: `app/(platform)/(app)/(forms)/expense/add/page.tsx`
- `/feedback/add`: `app/(platform)/(app)/(forms)/feedback/add/page.tsx`
- `/friends`: `app/(platform)/(app)/(screens)/friends/page.tsx`
- `/friends/:id`: `app/(platform)/(app)/(screens)/friends/[id]/page.tsx`
- `/friends/:id/edit/contact`: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/page.tsx`
- `/friends/add`: `app/(platform)/(app)/(forms)/friends/add/page.tsx`
- `/friends/add/contact`: `app/(platform)/(app)/(forms)/friends/add/contact/page.tsx`
- `/groups`: `app/(platform)/(app)/(screens)/groups/page.tsx`
- `/groups/:id`: `app/(platform)/(app)/(screens)/groups/[id]/page.tsx`
- `/groups/:id/activity`: `app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx`
- `/groups/:id/add-member`: `app/(platform)/(app)/(screens)/groups/[id]/add-member/page.tsx`
- `/groups/:id/edit`: `app/(platform)/(app)/(forms)/groups/[id]/edit/page.tsx`
- `/groups/:id/expense`: `app/(platform)/(app)/(screens)/groups/[id]/expense/page.tsx`
- `/groups/:id/expense/:expenseId`: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.tsx`
- `/groups/:id/settings`: `app/(platform)/(app)/(screens)/groups/[id]/settings/page.tsx`
- `/groups/:id/settle`: `app/(platform)/(app)/(forms)/groups/[id]/settle/page.tsx`
- `/groups/add`: `app/(platform)/(app)/(forms)/groups/add/page.tsx`
- `/privacy`: `app/(platform)/privacy/page.tsx`
- `/profile`: `app/(platform)/profile/page.tsx`
- `/webauthn/register`: `app/(platform)/(app)/webauthn/register/page.tsx`
- `/webauthn/test`: `app/(platform)/(app)/webauthn/test/page.tsx`

<!-- GA-GENERATED:END -->

The functions' routes are in [reports](../api/generate.md) and [WebAuthn](../api/webauthn.md); the other app APIs
(app routes, server actions, push-notification routes) are gone and say what replaced them.

## Depends on

[SQL Connect](../data/sql-connect.md), [Firebase Auth](../decisions/firebase-auth.md), [Cloud Functions](functions.md),
[Google AdSense](../integrations/google-adsense.md) and FCM for push
([decision](../decisions/firebase-cloud-messaging.md)).

## History

- 2026-11-05: `next.config.mjs` always built the static export; now in `next dev` only it drops the export and rewrites `/api/reports/**` and `/api/webauthn/**` to the Functions emulator, because the dev server has no Hosting in front. See [run locally](../operations/run-locally.md).
- 2026-11-05: had no offline support; now a saved cache, a service worker and queued writes, because spec 4 was built. See [offline](../features/offline.md).
- 2026-11-05: was a Next.js server with a separate hosting build target, a coming-soon page and a Clerk stub; now one static build with a 404 page, and `firebase.emulators.json` generated for local checks, because spec 2c removed the server, Clerk, OneSignal, UploadThing and Vercel analytics. See [decision](../decisions/static-build-on-firebase-hosting.md).
- 2026-11-05: the hosting build had only the public pages and sign-in; now it holds the signed-in screens, their shell and the id routes, because spec 2b moved the screens onto SQL Connect. See [decision](../decisions/static-build-on-firebase-hosting.md).
- 2026-11-05: the hosting build's landing page always showed the signed-out view; now it follows Firebase Auth and has the sign-in screens, because spec 2a moved sign-in to Firebase. See [decision](../decisions/firebase-auth.md).
- 2026-11-05: added the hosting build target and its Clerk stub, because the public pages go to Firebase Hosting before the app moves. See [decision](../decisions/public-pages-on-firebase-hosting-first.md).
- 2026-11-04: was Next.js 14 with Clerk's `authMiddleware` in `middleware.ts`; now Next.js 16 with `clerkMiddleware` in `proxy.ts`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `package.json`
- `next.config.mjs`
- `app/(landing)/page.hosting.tsx`
- `app/layout.tsx`
- `app/launch.tsx`
- `app/(landing)/_components/navbar.tsx`
- `components/auth/auth-provider.tsx`
- `app/adsense.tsx`
- `components/providers.tsx`
- `app/(platform)/layout.tsx`
- `app/(platform)/(app)/layout.tsx`
- `app/manifest.webmanifest`
- `app/(platform)/(app)/(screens)/layout.hosting.tsx`
- `scripts/hosting-pages/public.json`
- `scripts/emulator-firebase-config.mjs`
- `firebase.json`
- `app/not-found.hosting.tsx`
- `app/(platform)/(app)/layout.hosting.tsx`
- `components/auth/verify-email-banner.tsx`
- `hooks/use-route-ids.ts`
- `lib/auth-redirect.ts`
- `scripts/check-hosting-build.mjs`
- `components/providers.tsx`
- `public/sw.js`
- `lib/offline/persist.ts`
