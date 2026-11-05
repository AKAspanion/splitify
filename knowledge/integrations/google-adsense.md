---
type: Integration
title: Google AdSense
description: The AdSense script is loaded on every page in production when a publisher id is set.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Google AdSense

## What it is used for

`app/adsense.tsx` loads Google's `adsbygoogle.js` with the publisher id, only when `NODE_ENV` is `production` and
an id is given; the root layout passes `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`.

## Configuration

`NEXT_PUBLIC_GOOGLE_ADSENSE_ID` ([environment](../operations/environment.md)).

## Failure modes

With no id, nothing is loaded.

## Sources

- `app/adsense.tsx`
- `app/layout.tsx`
