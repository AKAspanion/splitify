---
type: Finding
title: "Fixed: the Android splash shrank into a card when the app opened"
description: On Android 17 the TWA splash shrank into a dimmed card while the browser window scaled in, because androidbrowserhelper turned the window animation off only after finish(); LauncherActivity now turns it off before.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T11:00:58Z
---

# Fixed: the Android splash shrank into a card when the app opened

## Finding

Opening the Android app, the splash (the logo on `backgroundColor`) showed, then shrank into a dimmed, rounded card
while the browser's window scaled in over it: the "jittery splash". Seen on a Galaxy S25 FE on Android 17 (API 37)
with Chrome 156, launching from the app drawer and with `am start`.

The splash hands over by starting the browser and finishing `LauncherActivity`. androidbrowserhelper 2.7.4
(`PwaWrapperSplashScreenStrategy.onSplashImageTransferred`) calls `overridePendingTransition(0, 0)` to stop the window
animation, but only after the launch callback has already called `finish()`, and Android 17 ignores it there.
`overrideActivityTransition(OVERRIDE_TRANSITION_CLOSE, 0, 0)` set in `onCreate` didn't help either: the animation is
the browser's open transition, not this activity's close.

## Evidence

Screen recordings of cold launches, before and after, read frame by frame: before, three frames of a shrinking grey
card between the splash and the browser; after, the splash holds still and cuts straight to the browser, on two cold
launches. Reopening the running app from its icon brings the task back with no splash, as before.

## Status

Fixed. `LauncherActivity.finish()` calls `overridePendingTransition(0, 0)` before `super.finish()`.

Not checked: the verified-TWA path, where Chrome takes the splash image over and fades it out. A debug build is
signed with a key `assetlinks.json` doesn't list, so Chrome opens it as a Custom Tab without the splash hand-off.
Check it on a release build.

## Sources

- `packages/android/source/app/src/main/java/in/spanion/splitify/twa/LauncherActivity.java`
- `packages/android/source/app/build.gradle`
