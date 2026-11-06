---
type: Application
title: iOS app
description: A Swift WebView wrapper that opens the deployed web app, with Firebase push messaging.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# iOS app

## Role

Puts the web app on iOS. It holds no product logic: a WebView opens the deployed site.

## Stack

A Swift app. The first URL it opens is `rootUrl` in `packages/ios/src/Splitify/Settings.swift`. Push messages use
Firebase Messaging (`packages/ios/src/Splitify/PushNotifications.swift`), configured by
`packages/ios/src/Splitify/GoogleService-Info.plist`, which is gitignored: copy
`GoogleService-Info.sample.plist` and fill it from the Firebase console ([decision](../decisions/untrack-ios-firebase-config.md)).

The WebView stays on the app's own site. `allowedOrigins` (`splitify.spanion.in`) and `authOrigins`
(`accounts.google.com`) in `Settings.swift` are the same two hosts `Info.plist` lists as `WKAppBoundDomains`, so WebKit
itself refuses other top-level loads. `hostMatches` (`WebView.swift`) accepts a host that equals an origin, or, for the
app's own origin, ends in `.<origin>`, never one that merely contains it (`splitify.spanion.in.evil.example`).
`Info.plist` has no App Transport Security exception, so every load is HTTPS, and a link the app opens goes through
`URLRequest`. A link from outside is kept only when it is on the app's own site (`isAppUrl` in `SceneDelegate.swift`);
any other opens the app at `rootUrl`. What the WebView still lets through is a
[finding](../findings/ios-webview-allows-other-navigations.md).

## Entry points

- `packages/ios/src/Splitify/AppDelegate.swift`
- `packages/ios/src/Splitify/SceneDelegate.swift`
- `packages/ios/src/Splitify/ViewController.swift` and `packages/ios/src/Splitify/WebView.swift`

## Screens and routes

Every screen is the web app's; see [the web app](splitify.md).

## Depends on

The deployed web app, and Firebase for push.

## History

- 2026-11-06: said nothing about which hosts the WebView accepts; now it names the app-bound hosts, the exact or subdomain match and the gitignored Firebase config, because the repository-modernization run fixed a `authOrigins` typo, matched hosts exactly and untracked the config.

## Sources

- `packages/ios/src/Splitify/Settings.swift`
- `packages/ios/src/Splitify/PushNotifications.swift`
- `packages/ios/src/Splitify/AppDelegate.swift`
- `packages/ios/src/Splitify/SceneDelegate.swift`
- `packages/ios/src/Splitify/ViewController.swift`
- `packages/ios/src/Splitify/WebView.swift`
- `packages/ios/src/Splitify/GoogleService-Info.sample.plist`
- `packages/ios/src/Splitify/Info.plist`
- `packages/ios/Readme.html`
