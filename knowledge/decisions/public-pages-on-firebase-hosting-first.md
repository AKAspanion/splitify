---
type: Decision
title: Serve the public pages from Firebase Hosting before the app moves
description: Until the signed-in app runs on SQL Connect, a hosting-only static build serves the landing page, /privacy and /delete-account from Firebase Hosting on splitify.spanion.in, and every other route shows a "coming back soon" page.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T18:38:07Z
verified: human:ankitp@geekyants.com
---

# Serve the public pages from Firebase Hosting before the app moves

## Context

The [static build](static-build-on-firebase-hosting.md) needs every page to run in the browser, which only becomes
true once the screens move onto SQL Connect and Firebase Auth. Meanwhile the old MySQL database is gone, so the
signed-in app doesn't work anywhere, and the Play listing needs `/privacy` and the account-deletion page on
`splitify.spanion.in` ([keep the domain](keep-splitify-spanion-domain.md)). The developer chose to get the site up on
Firebase Hosting first, as a static client-rendered build of the home page and the public pages, over deploying the
current server-rendered app through Firebase's framework support.

## Decision

- A second build target, the hosting build, exports only the landing page, `/privacy` and `/delete-account` as
  static files, with no server rendering, and a "coming back soon" page that Firebase Hosting serves for every other
  route.
- The normal Next.js build is unchanged, so the code keeps building as it does today until the app moves.
- The deploy workflow builds and deploys the hosting build on every push to `main`.

## Consequences

- `splitify.spanion.in` serves the public pages from Firebase's CDN once the domain points at Firebase Hosting.
- Signing in isn't possible on the deployed site until the app moves; the "coming back soon" page says so.
- The hosting-only build target is removed when the whole app builds statically.

## Sources

- `next.config.mjs`
- `firebase.json`
- `.github/workflows/deploy.yml`
