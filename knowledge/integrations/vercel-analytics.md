---
type: Integration
title: Vercel Analytics and Speed Insights (removed)
description: Vercel analytics is removed: the app is served by Firebase Hosting, which has no Vercel insights endpoint.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Vercel Analytics and Speed Insights (removed)

app/analytics.tsx and the root layout's mount of it are gone, with the `@vercel/*` packages. The site is served by
Firebase Hosting, where `/_vercel/insights` doesn't exist, so there is no page analytics or performance reporting in the
app now; adding it is a separate choice.

## History

- 2026-11-05: rendered in production builds except the hosting build; now removed, because the only build is the Firebase Hosting one. See [decision](../decisions/static-build-on-firebase-hosting.md).

## Sources

- `app/layout.tsx`
