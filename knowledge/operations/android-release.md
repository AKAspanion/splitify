---
type: Runbook
title: Android release
description: How to build, sign and upload a new Android bundle, and the Play Console steps that go with it.
status: draft
work_item: tmp-play-store-update
generated:
  by: agent:after-finish
  at: 2026-11-04T16:00:00Z
---

# Android release

1. Raise `versionCode` and `versionName` in `packages/android/source/app/build.gradle`.
2. Build the bundle from `packages/android/source` with `./gradlew bundleRelease`, with `ANDROID_HOME` set to the SDK.
3. Sign it with `jarsigner` and the upload key, which is kept outside the repository. Signing is the developer's step:
   the key and its password never enter the repository or a command an agent runs.
4. Upload the signed bundle in Play Console by hand.
5. Play Console's App content checklist (privacy policy URL, health apps, advertising ID, ads, financial features and
   Data safety with the deletion URL) is listed in the spec's "Done outside the repository" section:
   `docs/specs/2026-11-04-play-store-update.md`. Deploy the web changes first, so `/privacy`, `/delete-account` and
   the asset links are live ([privacy policy](../features/privacy-policy.md)).

The app targets the current API level Play requires; [the Android app](../apps/android.md) names the versions.

## Sources

- `packages/android/source/app/build.gradle`
- `packages/android/source/build.gradle`
- `docs/specs/2026-11-04-play-store-update.md`
