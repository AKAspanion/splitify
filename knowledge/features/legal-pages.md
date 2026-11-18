---
type: Feature
title: Legal pages
description: The public Privacy Policy, Terms of Service and delete-account pages, why they are public, where each is linked from, and what the terms deliberately leave out.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-18T10:00:00Z
---

# Legal pages

## What it does

Three pages are open to anyone, signed in or not: the Privacy Policy (`/privacy`), the Terms of Service (`/terms`) and
the delete-account page (`/delete-account`). Each is a `page.tsx` under `app/(platform)/`, outside the signed-in
`(app)` group, with a `page.hosting.tsx` so it is built into the static site ([web app](../apps/splitify.md)). All
three are listed in `scripts/hosting-pages/public.json` and are `STATIC_PAGES` of the service worker
(`lib/offline/sw-routing.js`, [service worker](../operations/service-worker.md)).

## Why they are public

The Play listing needs a privacy policy URL that Google can reach without signing in
([decision](../decisions/keep-splitify-spanion-domain.md)), and the terms and the delete-account page are the pages a
person needs before they have an account or after they have lost access to it.

## Where each is linked from

- The sign-in and sign-up footers show "Privacy policy · Terms of service", plain anchors (`/privacy/`, `/terms/`)
  ([sign in](sign-in.md)).
- The privacy page links `/terms/`; the delete-account page links `/privacy/` and `/terms/`; the terms page links
  `/privacy/` and `/delete-account/`.
- All these links are plain anchors, full page loads, so the ad script on the privacy and delete-account pages never
  carries into another document ([decision](../decisions/adsense-on-privacy-and-delete-account-pages.md)).

## Rules

- Privacy and delete-account load ads for signed-out visitors; the terms page loads none (same decision).
- The terms' effective date is `17 November 2026`; the page says that changing the terms changes that date.
- The terms deliberately name no governing law and no operator legal name, because neither is recorded. Both are
  open: [which law and which operator](../questions/terms-governing-law-and-operator.md).

## History

- 2026-11-18: had the privacy and delete-account pages only; now the Terms of Service page `/terms` too, linked beside the privacy policy, because the developer asked for one. See [the AdSense decision](../decisions/adsense-on-privacy-and-delete-account-pages.md).

## Sources

- `app/(platform)/terms/page.tsx`
- `app/(platform)/terms/page.test.tsx`
- `app/(platform)/privacy/page.tsx`
- `app/(platform)/privacy/page.test.tsx`
- `app/(platform)/delete-account/page.tsx`
- `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- `scripts/hosting-pages/public.json`
- `lib/offline/sw-routing.js`
