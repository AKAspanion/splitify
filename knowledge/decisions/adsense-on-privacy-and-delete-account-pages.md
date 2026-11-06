---
type: Decision
title: Load AdSense only on the privacy and delete-account pages
description: The AdSense script runs on /privacy and /delete-account only, for signed-out visitors, and every exit from those pages is a full page load; the landing page it used to run on is gone.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T18:00:00Z
status: draft
---

# Load AdSense only on the privacy and delete-account pages

## Context

[The earlier decision](adsense-on-public-pages-only.md) limited the ad script to the landing and privacy pages. The
landing page is removed ([decision](remove-landing-page.md)), so the public pages that remain are the privacy page
and the delete-account page. The developer confirmed on 2026-11-06 that those two carry the ads.

## Decision

- `app/adsense.tsx` is mounted by `app/(platform)/privacy/page.tsx` and `app/(platform)/delete-account/page.tsx` only;
  no layout mounts it.
- Every exit from those pages is a full page load, so the loaded script can't follow into the app beside the Auth
  tokens and saved data: the `Header` back arrow (`fullPageLoad`), `HomeRedirect` (`window.location.replace`), and the
  sign-in and sign-up "Privacy policy" links, which are plain anchors so the privacy page opens in a fresh document.
- The privacy policy has an Advertising section and lists the processors in use: Firebase Auth, SQL Connect on Cloud
  SQL, Cloud Functions, Firebase Hosting, FCM and Google AdSense.

## Consequences

- No ads on the signed-in app or the sign-in screens.
- The site-wide CSP still lists the ad hosts, because Hosting headers apply to every path.

## Sources

- `app/adsense.tsx`
- `app/(platform)/privacy/page.tsx`
- `app/(platform)/delete-account/page.tsx`
- `app/(platform)/(auth)/home-redirect.tsx`
- `components/container/header.tsx`
- `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- `firebase.json`
