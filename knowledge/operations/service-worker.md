---
type: Runbook
title: The service worker
description: One worker, public/sw.js, caches the app shell for offline use and also handles push; how it is built, how it routes requests, how it updates, and what it cannot be tested with.
status: draft
generated:
  by: ga-plugin/after-finish
  at: 2026-11-05T00:00:00Z
---

# The service worker

## What it is

One worker, `public/sw.js`, replaced the old firebase-messaging-sw.js. It caches the app shell and also imports the
Firebase Messaging worker code, so push and offline share one registration ([decision](../decisions/firebase-cloud-messaging.md)).
The import is in a try/catch: if it fails, the offline cache still works. Both `registerAppWorker()` in
`lib/push/register.ts` (called by `app/launch.tsx`) and the push registration register the same worker file with the same config query.

## How the cache is built

`scripts/build-sw.mjs` runs after `next build` (`postbuild`) and lists the files in `out/` into a precache called
`splitify-shell-<version>`, where the version is the first 16 hex characters of a sha256 over the files. The list
reaches the worker as `__SPLITIFY_SW_MANIFEST__` (`out/sw-manifest.js`); `appVersion()` in `lib/offline/version.ts`
reads the same global, so the saved data cache is discarded when the app version changes ([decision](../decisions/offline-first-scope.md)).

## How requests are answered

- Static files: cache first.
- Pages: network first. If the network says nothing for 3 seconds (`NAVIGATION_TIMEOUT_MS = 3000`), the cached page
  answers; failing that, the placeholder page of the id route.
- `/api` and cross-origin requests are never cached.
- `/auth/action` and anything under it is bypassed (never cached), like Firebase's reserved paths, because its URL
  carries a one-time code ([data protection](../security/data-protection.md)). `public/sw-routing.js`, which `next dev`
  serves, mirrors `lib/offline/sw-routing.js`, and a test holds the two equal.
- The routing choices are in `lib/offline/sw-routing.js`, a classic UMD script copied to `out/`, because
  `importScripts` cannot load an ES module. Pages are precached by their path and under their file URL, because
  Hosting redirects `index.html` URLs.

## Updates

A new worker waits. `components/offline/update-toast.tsx` shows "A new version of Splitify is ready." with Reload,
which posts `SKIP_WAITING` and reloads once the new worker controls the page.

## Testing and limits

- The worker only works in the exported build, not in `next dev`. Check it with `pnpm build` and the Hosting emulator ([run locally](run-locally.md)).
- `scripts/hosting-pages/pwa.json` lists the three files the Hosting check expects (/sw.js, /sw-manifest.js and /sw-routing.js).
- `lib/offline/sw-navigation.test.ts` runs `public/sw.js` in a Node `vm` context with fake `self`, `caches` and `fetch`, because a worker's `self` can't be imported; this is the pattern for testing the worker's timing.
- Provisional, for the developer to confirm: the manifest global's name, the classic script, and caching pages by path and file URL.

## History

- 2026-11-05: `/auth/action` was cached like any page; now it is bypassed, because its URL carries a one-time code. See [sign in](../features/sign-in.md).

## Sources

- `public/sw.js`
- `public/sw-routing.js`
- `lib/offline/sw-routing.js`
- `lib/offline/sw-navigation.test.ts`
- `lib/offline/version.ts`
- `scripts/build-sw.mjs`
- `scripts/hosting-pages/pwa.json`
- `lib/push/register.ts`
- `app/launch.tsx`
- `app/layout.tsx`
- `components/offline/update-toast.tsx`
