---
type: Application
title: iOS app
description: A Swift WebView wrapper that opens the deployed web app, with Firebase push messaging.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# iOS app

## Role

Puts the web app on iOS. It holds no product logic: a WebView opens the deployed site.

## Stack

A Swift app. The first URL it opens is `rootUrl` in `packages/ios/src/Splitify/Settings.swift`. Push messages use
Firebase Messaging (`packages/ios/src/Splitify/PushNotifications.swift`), configured by
`packages/ios/src/Splitify/GoogleService-Info.plist` (see
[committed Firebase config](../findings/committed-firebase-config.md)).

## Entry points

- `packages/ios/src/Splitify/AppDelegate.swift`
- `packages/ios/src/Splitify/SceneDelegate.swift`
- `packages/ios/src/Splitify/ViewController.swift` and `packages/ios/src/Splitify/WebView.swift`

## Screens and routes

Every screen is the web app's; see [the web app](splitify.md).

## Depends on

The deployed web app, and Firebase for push.

## Sources

- `packages/ios/src/Splitify/Settings.swift`
- `packages/ios/src/Splitify/PushNotifications.swift`
- `packages/ios/src/Splitify/AppDelegate.swift`
- `packages/ios/src/Splitify/SceneDelegate.swift`
- `packages/ios/src/Splitify/ViewController.swift`
- `packages/ios/src/Splitify/WebView.swift`
- `packages/ios/src/Splitify/GoogleService-Info.plist`
- `packages/ios/Readme.html`
