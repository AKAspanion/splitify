---
type: Feature
title: Privacy policy and deletion page
description: Public /privacy and /delete-account pages that Google Play's listing points at, plus the asset links file for the Android app.
status: draft
work_item: tmp-play-store-update
generated:
  by: agent:after-finish
  at: 2026-11-04T16:00:00Z
---

# Privacy policy and deletion page

- `/privacy` (`app/(platform)/privacy/page.tsx`) is the privacy policy. It names the processors the app uses: Clerk,
  Vercel, OneSignal, UploadThing and Google AdSense. It states no retention period for server logs, because none is set
  in the code.
- `/delete-account` (`app/(platform)/delete-account/page.tsx`) explains [account deletion](account-deletion.md) to
  people outside the app. It is the deletion URL in Play's Data safety form.
- Both are public routes in `proxy.ts` ([auth](../security/auth.md)).
- `public/.well-known/assetlinks.json` lists the upload key and Play's app signing key, so the Android app verifies
  both for a Play-signed install ([Android release](../operations/android-release.md)).

## Sources

- `app/(platform)/privacy/page.tsx`
- `app/(platform)/delete-account/page.tsx`
- `proxy.ts`
- `public/.well-known/assetlinks.json`
- `docs/specs/2026-11-04-play-store-update.md`
