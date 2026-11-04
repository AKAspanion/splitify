---
type: Decision
title: Keep the iOS Firebase config out of git
description: packages/ios/src/Splitify/GoogleService-Info.plist is untracked and gitignored; a sample with placeholder values is committed beside it, and each developer drops in the real file from the Firebase console.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T11:30:54Z
---

# Keep the iOS Firebase config out of git

## Context

The iOS wrapper's `GoogleService-Info.plist`, which holds its Firebase API key and project ids, was committed
([finding](../findings/committed-firebase-config.md)). Firebase client config is designed to ship inside the app,
so keeping it and restricting the key was offered; the developer chose to untrack it, so the project's rule that
credentials live outside git holds for the mobile apps too.

## Decision

- Remove `packages/ios/src/Splitify/GoogleService-Info.plist` from git and add it to `.gitignore`.
- Commit `packages/ios/src/Splitify/GoogleService-Info.sample.plist` with the same keys and placeholder values.
- A developer building the iOS app downloads the real file from the Firebase console into that path.

## Consequences

- The key stays in git history. Restricting it to the iOS bundle id in Google Cloud, or rotating it, is the only
  way to make the old copy useless; that is done in the Google Cloud console, not in this repository.

## Sources

- `.gitignore`
- `packages/ios/src/Splitify/GoogleService-Info.plist`
