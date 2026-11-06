---
type: Finding
title: "Fixed: Firebase config for iOS was committed"
description: packages/ios/src/Splitify/GoogleService-Info.plist, which holds the iOS app's Firebase API key and project ids, was tracked in git; it is untracked now, but the key stays in history.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Fixed: Firebase config for iOS was committed

## Finding

The iOS wrapper's Firebase configuration file was committed. Firebase client keys are meant to ship inside the app,
so this was lower risk than a server secret, but the key should be restricted to the app in Google Cloud.

## Evidence

- `packages/ios/src/Splitify/GoogleService-Info.plist` contained an `API_KEY` entry. The value is not repeated here.

## Status

Fixed: the file is untracked and gitignored, with a sample beside it ([decision](../decisions/untrack-ios-firebase-config.md)).
The key stays in git history, so restrict it to the iOS bundle id in Google Cloud, or rotate it; that is done in the
console, not in this repository.

## Sources

- `.gitignore`
- `packages/ios/src/Splitify/GoogleService-Info.sample.plist`
