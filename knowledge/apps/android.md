---
type: Application
title: Android app
description: A Trusted Web Activity, in.spanion.splitify.twa, that opens the deployed web app at /groups.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Android app

## Role

Puts the web app on Android. It holds no product logic: it opens the deployed site full-screen.

## Stack

An Android Trusted Web Activity project (Gradle). Its application id, host name and launch path are set in the
`twaManifest` block of `packages/android/source/app/build.gradle`.

## Versions

Targets API 36 (`compileSdk` and `targetSdk` in `build.gradle`), on Android Gradle Plugin `8.13.0` and Gradle `8.13`.
`minSdk` is 24 because androidbrowserhelper 2.7.4 requires it. The release is version `1.1.0` (code `10`). The manifest
declares no `AD_ID` permission. Build output is ignored by git. How to build and release: [Android release](../operations/android-release.md).
The asset links that verify the app are in [the privacy policy feature](../features/privacy-policy.md).

## Entry points

- `packages/android/source/app/src/main/java/in/spanion/splitify/twa/LauncherActivity.java`
- `packages/android/source/app/src/main/AndroidManifest.xml`
- `packages/android/source/app/src/main/res/raw/web_app_manifest.json`: the web manifest it was generated from.

## Screens and routes

Every screen is the web app's; see [the web app](splitify.md).

## Depends on

The deployed web app, at the host in `build.gradle`.

## History

- 2026-11-04: targeted an older API level with build output committed; now API 36, version 1.1.0 (10), and build output ignored, because Play requires a current target API level.

## Sources

- `packages/android/source/app/build.gradle`
- `packages/android/source/app/src/main/AndroidManifest.xml`
- `packages/android/source/app/src/main/java/in/spanion/splitify/twa/LauncherActivity.java`
- `packages/android/source/app/src/main/res/raw/web_app_manifest.json`
- `packages/android/Readme.html`
