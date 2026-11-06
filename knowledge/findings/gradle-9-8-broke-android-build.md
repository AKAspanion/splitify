---
type: Finding
title: "Fixed: the Gradle 9.8.2 wrapper bump broke the Android build"
description: Dependabot's bump of the Android wrapper to Gradle 9.8.2 broke the build, since AGP 8.13 couldn't run on it; it was pinned back to Gradle 9.5.1, with Dependabot ignoring Gradle 9.6 and later.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T11:00:58Z
---

# Fixed: the Gradle 9.8.2 wrapper bump broke the Android build

## Finding

Dependabot's "Bump gradle-wrapper from 8.13 to 9.8.2" (commit `2b8fefc`) left `main`'s Android app unbuildable: AGP
`com.android.tools.build:gradle:8.13.0` relies on `org.gradle.api.problems.internal.InternalProblems`, a Gradle internal
API removed in Gradle 9.6, and every Gradle task failed while applying the plugin.

## Status

Fixed. `gradle-wrapper.properties` is on `gradle-9.5.1-bin.zip`, the newest Gradle that AGP 8.13 runs on, and
`.github/dependabot.yml` ignores `gradle-wrapper` `>= 9.6`. Lift the ignore when the app moves to AGP 9.

## Sources

- `packages/android/source/gradle/wrapper/gradle-wrapper.properties`
- `packages/android/source/build.gradle`
- `.github/dependabot.yml`
