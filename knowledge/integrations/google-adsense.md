---
type: Integration
title: Google AdSense
description: The AdSense script is loaded only on the public pages, only for signed-out visitors, in production when a publisher id is set, and never in a document that started on the one-time-code page.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Google AdSense

## What it is used for

`app/adsense.tsx` loads Google's `adsbygoogle.js` with the publisher id, only when `NODE_ENV` is `production` and
an id is given (`NEXT_PUBLIC_GOOGLE_ADSENSE_ID`). Only the public pages mount it: the landing layout
(`app/(landing)/layout.tsx`) and the privacy page (`app/(platform)/privacy/page.tsx`), not the root layout. It renders
the script only while Firebase Auth reports the visitor as signed out, so a signed-in person never loads it
([decision](../decisions/adsense-on-public-pages-only.md)).

The public pages leave for the signed-in app and the sign-in screens by full page loads, not client navigation: plain
anchors in the landing navbar, logo and call to action, and `window.location.replace` in `app/launch.tsx`. A client
navigation would keep the already-loaded ad script running in the app's document, beside the sign-in tokens.
[One case stays open](../findings/privacy-page-keeps-ad-script-after-sign-in.md).

It also loads nothing in a document whose first page was `/auth/action` (`adsAllowedOn` in `lib/ads/ads-allowed.ts`,
read once per document): that document keeps the reset or verify link's one-time code in its navigation entry, and a
signed-out person can reach the privacy page from it by client navigation (`/auth/action/` → sign-in → Privacy
policy) ([data protection](../security/data-protection.md)).

## Configuration

`NEXT_PUBLIC_GOOGLE_ADSENSE_ID` ([environment](../operations/environment.md)).

## Failure modes

With no id, nothing is loaded.

## History

- 2026-11-06: the script loaded on every page; now only for signed-out visitors, with the public pages leaving for the app by full page loads, because of [the decision](../decisions/adsense-on-public-pages-only.md) and the final review's finding that client navigation kept the script running.
- 2026-11-05: loaded on every page in production; now not in a document that started on `/auth/action`, because that URL carries a one-time code. See [sign in](../features/sign-in.md).

## Sources

- `app/adsense.tsx`
- `lib/ads/ads-allowed.ts`
- `app/(landing)/layout.tsx`
- `app/(landing)/page.tsx`
- `app/(platform)/privacy/page.tsx`
- `app/launch.tsx`
- `app/(landing)/_components/navbar.tsx`
