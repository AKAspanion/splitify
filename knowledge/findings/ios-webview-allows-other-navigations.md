---
type: Finding
title: The iOS WebView allows any script-started navigation and force-casts a private key
description: WebView.swift lets a navigation of type other through and reads a private WebKit key with as! Int, which would crash the app if WebKit stopped answering it.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# The iOS WebView allows any script-started navigation and force-casts a private key

## Finding

The navigation policy in `packages/ios/src/Splitify/WebView.swift` lets a navigation of type `.other` through and reads
a private WebKit key with `as! Int`. With `limitsNavigationsToAppBoundDomains` on, WebKit itself refuses top-level loads
outside the app-bound list ([iOS app](../apps/ios.md)), so the branch mostly admits subframes. The force cast crashes
the app if WebKit ever stops answering that key. It predates the repository-modernization branch and was graded Minor.

## Evidence

The repository-modernization run's final security review, item 5. Its suggested fix: read the key with `as? Int` and compare it to 0, and limit the branch to subframes
(`targetFrame?.isMainFrame == false`).

## Status

Open.

## Sources

- `packages/ios/src/Splitify/WebView.swift`
