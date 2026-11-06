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

## Splash screen

androidbrowserhelper's `LauncherActivity` draws the splash (`packages/android/source/app/src/main/res/drawable-xxhdpi/splash.png` and its other densities, on `backgroundColor`), starts
the browser and finishes. Our subclass turns the window animation off in `finish()`, before `super.finish()`: the
library does it after, which Android 17 ignores, and the splash shrank into a card
([finding](../findings/android-splash-shrank-on-hand-over.md)). The web app's loading state then shows the same logo
in the same place ([decision](../decisions/logo-as-loading-state.md)).

## Build

The Gradle wrapper stays below Gradle 9.6 while the app is on AGP 8
([finding](../findings/gradle-9-8-broke-android-build.md)). Gradle needs a JDK 17 or later; Android Studio's bundled
JBR works.

## Debug build on a local dev server

A debug build opens a local server when given `-PtwaDevUrl` (the `debug` build type in `app/build.gradle`); release
builds ignore it. From `packages/android/source`, with a phone on `adb`:

1. `pnpm dev` at the repository root, then `adb reverse tcp:<port> tcp:<port>` for the web port and the three
   emulator ports the browser calls (`lib/firebase/emulators.ts`).
2. `./gradlew installDebug -PtwaDevUrl=http://localhost:2140`.

The debug key isn't in `public/.well-known/assetlinks.json`, so Chrome opens it as a Custom Tab with an address bar
and without its splash hand-off; launch timing and the native splash are as in release. A phone on wireless debugging
that `adb devices` doesn't list was found with `dns-sd -B _adb-tls-connect._tcp` and joined with `adb connect`.

## Depends on

The deployed web app, at the host in `build.gradle`.

## History

- 2026-11-06: the splash shrank into a card on hand-over, the wrapper was on Gradle 9.8.2 (which failed to build) and
  a debug build only opened the deployed site; now the hand-over has no window animation, the wrapper is on Gradle
  9.5.1, and `-PtwaDevUrl` points a debug build at a local server, because the splash looked jittery on Android 17.

## Sources

- `packages/android/source/app/src/main/res/drawable-xxhdpi/splash.png`
- `packages/android/source/app/build.gradle`
- `packages/android/source/app/src/main/AndroidManifest.xml`
- `packages/android/source/app/src/main/java/in/spanion/splitify/twa/LauncherActivity.java`
- `packages/android/source/app/src/main/res/raw/web_app_manifest.json`
- `packages/android/Readme.html`
- `packages/android/source/build.gradle`
- `packages/android/source/gradle/wrapper/gradle-wrapper.properties`
- `public/.well-known/assetlinks.json`
- `lib/firebase/emulators.ts`
