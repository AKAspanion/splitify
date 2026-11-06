---
type: Integration
title: Google AdSense
description: The AdSense script is loaded only on the privacy and delete-account pages, only for signed-out visitors, in production when a publisher id is set, and never in a document that started on the one-time-code page.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Google AdSense

## What it is used for

`app/adsense.tsx` loads Google's `adsbygoogle.js` with the publisher id, only when `NODE_ENV` is `production` and
an id is given (`NEXT_PUBLIC_GOOGLE_ADSENSE_ID`). Only the privacy page (`app/(platform)/privacy/page.tsx`) and the
delete-account page (`app/(platform)/delete-account/page.tsx`) mount it, not the root layout and no other layout. It
renders the script only while Firebase Auth reports the visitor as signed out, so a signed-in person never loads it
([decision](../decisions/adsense-on-privacy-and-delete-account-pages.md)).

Those pages leave for the app and the sign-in screens by full page loads, not client navigation: the `Header` back arrow
is a plain anchor (`fullPageLoad`), `HomeRedirect` (`app/(platform)/(auth)/home-redirect.tsx`) uses
`window.location.replace`, and the sign-in and sign-up "Privacy policy" links are plain anchors so the privacy page opens
in a fresh document. A client navigation would keep the already-loaded ad script running in the app's document, beside
the sign-in tokens. [One case stays open](../findings/privacy-page-keeps-ad-script-after-sign-in.md).

It also loads nothing in a document whose first page was `/auth/action` (`adsAllowedOn` in `lib/ads/ads-allowed.ts`,
read once per document): that document keeps the reset or verify link's one-time code in its navigation entry, and a
signed-out person can reach the privacy page from it by client navigation (`/auth/action/` → sign-in → Privacy
policy) ([data protection](../security/data-protection.md)).

The privacy policy says so: it has an Advertising section and lists the processors in use (Firebase Auth, SQL Connect on
Cloud SQL, Cloud Functions, Firebase Hosting, FCM and Google AdSense).

## Configuration

`NEXT_PUBLIC_GOOGLE_ADSENSE_ID` ([environment](../operations/environment.md)).

## Failure modes

With no id, nothing is loaded.

## History

- 2026-11-06: the script was mounted by the landing page and the privacy page; now by the privacy and delete-account pages, with every exit a full page load, because the landing page was removed and the developer confirmed which pages carry ads. See [the decision](../decisions/adsense-on-privacy-and-delete-account-pages.md).
- 2026-11-06: the script loaded on every page; now only for signed-out visitors, with the public pages leaving for the app by full page loads, because of [the earlier decision](../decisions/adsense-on-public-pages-only.md) and the final review's finding that client navigation kept the script running.
- 2026-11-05: loaded on every page in production; now not in a document that started on `/auth/action`, because that URL carries a one-time code. See [sign in](../features/sign-in.md).

## Sources

- `app/adsense.tsx`
- `lib/ads/ads-allowed.ts`
- `app/(platform)/privacy/page.tsx`
- `app/(platform)/delete-account/page.tsx`
- `app/(platform)/(auth)/home-redirect.tsx`
- `components/container/header.tsx`
