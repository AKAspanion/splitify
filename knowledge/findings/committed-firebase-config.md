---
type: Finding
title: Firebase config for iOS is committed
description: packages/ios/src/Splitify/GoogleService-Info.plist, which holds the iOS app's Firebase API key and project ids, is tracked in git.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Firebase config for iOS is committed

## Finding

The iOS wrapper's Firebase configuration file is committed. Firebase client keys are meant to ship inside the app, so
this is lower risk than a server secret, but the key should be restricted to the app in Google Cloud.

## Evidence

- `packages/ios/src/Splitify/GoogleService-Info.plist` contains an `API_KEY` entry. The value is not repeated here.

## Status

Open.

## Sources

- `packages/ios/src/Splitify/GoogleService-Info.plist`
