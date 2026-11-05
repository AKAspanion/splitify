---
type: Finding
title: Offline gaps that were left open or not checked
description: A connection that is up but carries no data still shows a load error over saved data; the update toast, push through the merged worker and a clean test:rules run were not confirmed.
status: draft
generated:
  by: ga-plugin/after-finish
  at: 2026-11-05T00:00:00Z
---

# Offline gaps that were left open or not checked

## Finding

- **Dead connection:** when the connection is up but carries no data and `navigator.onLine` is still true, react-query
  runs the query, it fails, and a load error shows over the saved data.
- **Update toast:** "A new version of Splitify is ready." was not seen on a real update, only built and unit-tested.
- **Push through the merged worker:** `public/sw.js` now carries the push code; sending a push to it was not checked.
- **`yarn test:rules` flaked locally** because another project's emulator was on the same ports; it is not a defect of the code.

## Evidence

- `lib/offline/online-state.ts` decides offline from `navigator.onLine` only.
- `public/sw.js` imports the FCM worker inside a try/catch.

## Status

Open.

## Sources

- `lib/offline/online-state.ts`
- `public/sw.js`
- `components/offline/update-toast.tsx`
