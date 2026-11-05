---
type: Application
title: Android app
description: A Trusted Web Activity, in.spanion.splitify.twa, that opens the deployed web app at /groups.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Android app

## Role

Puts the web app on Android. It holds no product logic: it opens the deployed site full-screen.

## Stack

An Android Trusted Web Activity project (Gradle). Its application id, host name and launch path are set in the
`twaManifest` block of `packages/android/source/app/build.gradle`.

## Entry points

- `packages/android/source/app/src/main/java/in/spanion/splitify/twa/LauncherActivity.java`
- `packages/android/source/app/src/main/AndroidManifest.xml`
- `packages/android/source/app/src/main/res/raw/web_app_manifest.json`: the web manifest it was generated from.

## Screens and routes

Every screen is the web app's; see [the web app](splitify.md).

## Depends on

The deployed web app, at the host in `build.gradle`.

## Sources

- `packages/android/source/app/build.gradle`
- `packages/android/source/app/src/main/AndroidManifest.xml`
- `packages/android/source/app/src/main/java/in/spanion/splitify/twa/LauncherActivity.java`
- `packages/android/source/app/src/main/res/raw/web_app_manifest.json`
- `packages/android/Readme.html`
