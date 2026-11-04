---
type: Decision
title: Serve a static build from Firebase Hosting, with Cloud Functions for the server routes
description: The Next.js app is built with output export and served from Firebase Hosting with no server rendering; the few routes that need a server run as Cloud Functions under /api on the same domain.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:05:46Z
---

# Serve a static build from Firebase Hosting, with Cloud Functions for the server routes

## Context

Server rendering was very slow in early testing, and the developer wants as little of it as possible. Two ways
were offered: a static build on Firebase Hosting, with Cloud Functions for what needs a server, or Firebase App
Hosting running Next.js with mostly client-side pages. App Hosting keeps the route handlers but starts each request
on Cloud Run, which is slow from cold. The developer chose the static build.

## Decision

- The app is a static Next.js build (`output: "export"`) served from Firebase Hosting. There is no server
  rendering, no server actions and no `proxy.ts`; pages render in the browser and check the Firebase Auth user there.
- What needs a server becomes a Cloud Function, served by a Hosting rewrite under `/api/` on the same domain: the
  push notifications, the report downloads, UploadThing and the WebAuthn routes.
- Hosting moves off Vercel, so Vercel Analytics and Speed Insights go with it.

## Consequences

- Pages load from Firebase's CDN as files, and the service worker can cache them for offline use.
- Routes with an id in the path (`/groups/:id` and the like) are served by one prebuilt page per route that reads
  the id in the browser.
- The Android and iOS wrappers open the new Firebase Hosting address.

## Sources

- `next.config.mjs`
- `proxy.ts`
- `app/analytics.tsx`
