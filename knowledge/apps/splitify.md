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

- `app/layout.tsx`: the root layout. It loads the OneSignal web SDK script, Google AdSense
  (`app/adsense.tsx`), Vercel analytics (`app/analytics.tsx`), the theme provider and `components/providers.tsx`
  (Clerk, react-query, the confirm dialog, the progress bar).
- `app/launch.tsx`: runs on every page for a signed-in person; it starts OneSignal and logs the person in to it by
  their user id.
- `app/(platform)/layout.tsx`: wraps the signed-in app and mounts the [biometric lock](../features/biometric-lock.md).
- `app/(platform)/(app)/layout.tsx`: the top and bottom navigation bars.
- `proxy.ts`: Clerk's `clerkMiddleware`; see [auth](../security/auth.md).
- `app/manifest.webmanifest`: the PWA manifest.
- The dev server's port is Next's default; `scripts.dev` in `package.json` passes none.

## Screens and routes

<!-- GA-GENERATED:screens app -->

- `/`: `app/(landing)/page.tsx`
- `/activity`: `app/(platform)/(app)/(screens)/activity/page.tsx`
- `/activity/:id`: `app/(platform)/(app)/(screens)/activity/[id]/page.tsx`
- `/dashboard`: `app/(platform)/(app)/(screens)/dashboard/page.tsx`
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
- `/logs`: `app/(admin)/logs/page.tsx`
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

- 2026-11-04: was Next.js 14 with Clerk's `authMiddleware` in `middleware.ts`; now Next.js 16 with `clerkMiddleware` in `proxy.ts`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `package.json`
- `app/layout.tsx`
- `app/launch.tsx`
- `app/adsense.tsx`
- `app/analytics.tsx`
- `components/providers.tsx`
- `app/(platform)/layout.tsx`
- `app/(platform)/(app)/layout.tsx`
- `app/manifest.webmanifest`
- `proxy.ts`
