---
type: Decision
title: Load AdSense only on the public pages
description: The AdSense script runs on the landing and privacy pages only; the signed-in screens and the sign-in screens load no ad script.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T12:45:35Z
verified: human:ankitp@geekyants.com
stated: "The AdSense script runs on the signed-in screens. Load ads only on the public pages (landing, privacy)? — Public pages only (Recommended)"
stated_via: qa
---

# Load AdSense only on the public pages

## Context

`app/layout.tsx` rendered `app/adsense.tsx` on every page, so `adsbygoogle.js` ran at the app's own origin beside the
Firebase Auth tokens in IndexedDB and the saved query cache, which holds people's spending. `firebase.json`'s
`script-src` allows `'unsafe-inline'` and the ad hosts, so a compromised ad script would have had full access to
both. The 2026-11-05 security audit raised it as a Medium finding ([Google AdSense](../integrations/google-adsense.md)).

## Decision

The ad script loads only on the public pages, the landing page and the privacy page. Every other page loads no ad
script.

## Consequences

- No ads on the signed-in app.
- The site-wide CSP still lists the ad hosts, because Hosting headers apply to every path. Only the script itself is
  limited to the public pages.

## Sources

- `app/layout.tsx`
- `app/adsense.tsx`
- `app/launch.tsx`
- `app/(landing)/_components/navbar.tsx`
- `firebase.json`
