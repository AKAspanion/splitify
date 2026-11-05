---
type: Application
title: Splitify web app
description: The Next.js 16 App Router app at the repository root: the landing page, the signed-in app, the admin logs page and the API.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Splitify web app

## Role

The whole product. Everything people do happens here; the Android and iOS apps only open it.

## Stack

Next.js App Router, React, Tailwind with shadcn/ui, Clerk for auth, Prisma over MySQL, react-query and zustand on
the client. Versions are in `package.json`.

## Entry points

- `app/layout.tsx`: the root layout. It loads the OneSignal web SDK script (the server actions still send through OneSignal), Google AdSense
  (`app/adsense.tsx`), Vercel analytics (`app/analytics.tsx`), the theme provider and `components/providers.tsx`
  (Clerk, react-query, the confirm dialog, the progress bar).
- `app/launch.tsx`: runs on every page for a signed-in person (Firebase Auth); it registers the device for push
  ([notifications](../features/notifications.md)) and sends the person from the landing page to `/groups`.
- `app/(platform)/layout.tsx`: wraps the signed-in app and mounts the [biometric lock](../features/biometric-lock.md).
- `app/(platform)/(app)/layout.tsx`: the top and bottom navigation bars.
- `proxy.ts`: Clerk's `clerkMiddleware`; see [auth](../security/auth.md).
- `app/manifest.webmanifest`: the PWA manifest.
- The dev server's port is Next's default; `scripts.dev` in `package.json` passes none.

## The hosting build

`NEXT_BUILD_TARGET=hosting` (`yarn build:hosting`) makes `next.config.mjs` build a static export of only the public
pages, for Firebase Hosting ([decision](../decisions/public-pages-on-firebase-hosting-first.md)): `output: "export"`,
`trailingSlash`, unoptimised images, and `pageExtensions: ["hosting.tsx"]`, so only `*.hosting.tsx` files are routes
and no route handler, server action, `proxy.ts` or `page.tsx` is part of it. The entries re-export the landing,
`/privacy` and `/delete-account` pages and their layouts, so those pages are not copied; `app/coming-soon/page.hosting.tsx`
is the page Hosting serves for every other route.

- Clerk is stubbed in this build: `@clerk/nextjs` resolves to `lib/clerk-hosting.tsx` (a signed-out stand-in), because
  the Clerk account is gone and Clerk's Next package imports a server action that a static export refuses
  ([Clerk](../integrations/clerk.md)). The rest of the app still uses Clerk.
- The landing page and navbar are the exception: they read the Firebase Auth state (`useAuth`) and show the signed-in or
  signed-out view, and the sign-in, sign-up and forgot-password screens are hosted routes ([sign in](../features/sign-in.md)).
- `app/analytics.tsx` renders nothing in this build, since `/_vercel/insights` doesn't exist on Hosting.
- The signed-in screens are in this build too. `app/(platform)/(app)/layout.hosting.tsx` is their shell: `RequireAuth`
  around the navbars, the [verify-email banner](../security/auth.md) (`components/auth/verify-email-banner.tsx`) and the
  page; `(screens)/layout.hosting.tsx` mounts the Add Expense button, because the hosting build reads only
  `layout.hosting.tsx` files, never `layout.tsx`. The navbars read `useAuth` and show initials, since `AuthUser` has no photo.
  Screens read and write through [SQL Connect](../data/sql-connect.md) hooks, not server actions.
- A route with an id segment is built once, with the placeholder `_` (`generateStaticParams`), and `firebase.json` rewrites
  every real id to that page, most specific path first, before the coming-soon catch-all. The screen reads the real ids
  from the address with `useRouteIds` (`hooks/use-route-ids.ts`), never from the page's params. Such a route's
  `page.hosting.tsx` is a small server wrapper that renders the client page beside `generateStaticParams`: Next refuses
  `generateStaticParams` re-exported next to a `"use client"` default.
- `yarn check:hosting` (`scripts/check-hosting-build.mjs`) reads one manifest per area from `scripts/hosting-pages/*.json`:
  the pages that must exist in `out/` and the requests that must answer 200 with given text.
- `components/providers.tsx` makes one `QueryClient` per mount (through `useState`): one made on every render left
  invalidation after a write reaching nobody.
- A signed-out person goes to `/sign-in/?next=<path>`, or home (`/`) after a sign-out they chose (`lib/auth-redirect.ts`).
- Known and harmless: on `/privacy` and `/delete-account` the biometric lock fetches `/api/webauthn/devices`, which
  Hosting answers with the coming-soon page; the failed parse is caught silently.

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
- `/sign-in/*`: `app/(platform)/(clerk)/sign-in/[[...sign-in]]/page.tsx`
- `/sign-up/*`: `app/(platform)/(clerk)/sign-up/[[...sign-up]]/page.tsx`
- `/webauthn/register`: `app/(platform)/(app)/webauthn/register/page.tsx`
- `/webauthn/test`: `app/(platform)/(app)/webauthn/test/page.tsx`

<!-- GA-GENERATED:END -->

The API's routes are in [app API](../api/app.md), [server actions](../api/server-actions.md),
[reports](../api/generate.md), [push notifications](../api/push-notification.md) and
[WebAuthn](../api/webauthn.md).

## Depends on

[Clerk](../integrations/clerk.md), [OneSignal](../integrations/onesignal.md),
[UploadThing](../integrations/uploadthing.md), [Vercel analytics](../integrations/vercel-analytics.md),
[Google AdSense](../integrations/google-adsense.md), and MySQL ([run locally](../operations/run-locally.md)).

## History

- 2026-11-05: the hosting build had only the public pages and sign-in; now it holds the signed-in screens, their shell and the id routes, because spec 2b moved the screens onto SQL Connect. See [decision](../decisions/static-build-on-firebase-hosting.md).
- 2026-11-05: the hosting build's landing page always showed the signed-out view; now it follows Firebase Auth and has the sign-in screens, because spec 2a moved sign-in to Firebase. See [decision](../decisions/firebase-auth.md).
- 2026-11-05: added the hosting build target and its Clerk stub, because the public pages go to Firebase Hosting before the app moves. See [decision](../decisions/public-pages-on-firebase-hosting-first.md).
- 2026-11-04: was Next.js 14 with Clerk's `authMiddleware` in `middleware.ts`; now Next.js 16 with `clerkMiddleware` in `proxy.ts`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `package.json`
- `next.config.mjs`
- `lib/clerk-hosting.tsx`
- `app/coming-soon/page.hosting.tsx`
- `app/(landing)/page.hosting.tsx`
- `app/layout.tsx`
- `app/launch.tsx`
- `app/(landing)/_components/navbar.tsx`
- `components/auth/auth-provider.tsx`
- `app/adsense.tsx`
- `app/analytics.tsx`
- `components/providers.tsx`
- `app/(platform)/layout.tsx`
- `app/(platform)/(app)/layout.tsx`
- `app/manifest.webmanifest`
- `proxy.ts`
- `app/(platform)/(app)/(screens)/layout.hosting.tsx`
- `scripts/hosting-pages/public.json`
- `app/(platform)/(app)/layout.hosting.tsx`
- `components/auth/verify-email-banner.tsx`
- `hooks/use-route-ids.ts`
- `lib/auth-redirect.ts`
- `scripts/check-hosting-build.mjs`
