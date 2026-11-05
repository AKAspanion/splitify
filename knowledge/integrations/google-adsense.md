---
type: Integration
title: Google AdSense
description: The AdSense script is loaded in production when a publisher id is set, except in a document that started on the one-time-code page.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Google AdSense

## What it is used for

`app/adsense.tsx` loads Google's `adsbygoogle.js` with the publisher id, only when `NODE_ENV` is `production` and
an id is given; the root layout passes `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`. It loads nothing in a document whose first page was
`/auth/action` (`adsAllowedFor` in `lib/ads/ads-allowed.ts`), so the ad script never reads a one-time reset or verify
code from the address bar ([data protection](../security/data-protection.md)).

## Configuration

`NEXT_PUBLIC_GOOGLE_ADSENSE_ID` ([environment](../operations/environment.md)).

## Failure modes

With no id, nothing is loaded.

## History

- 2026-11-05: loaded on every page in production; now not in a document that started on `/auth/action`, because that URL carries a one-time code. See [sign in](../features/sign-in.md).

## Sources

- `app/adsense.tsx`
- `lib/ads/ads-allowed.ts`
- `app/layout.tsx`
