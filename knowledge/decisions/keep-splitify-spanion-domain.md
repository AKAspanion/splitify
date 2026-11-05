---
type: Decision
title: Keep splitify.spanion.in as the apps' domain
description: The Android TWA and the iOS wrapper keep opening splitify.spanion.in; when its DNS record went missing, the record was restored at the spanion.in DNS provider rather than the apps moving to a new host.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T15:17:32Z
verified: human:ankitp@geekyants.com
---

# Keep splitify.spanion.in as the apps' domain

## Context

On 2026-11-04 the name `splitify.spanion.in` didn't resolve: the `spanion.in` zone answered for the apex, but held no
record for the `splitify` subdomain. Google Play couldn't reach the privacy policy at that host and refused to send
the Android update for review, and both store apps, which only open that host, loaded nothing.

Moving the apps to another host was the alternative. That host is named in many places that are hard to change
together: the TWA's `hostName` and its asset statements, the site's `public/.well-known/assetlinks.json`, the iOS app's
associated domains and allowed origins, and the WebAuthn relying-party id, so a move would also break every passkey
already registered.

## Decision

- Keep `splitify.spanion.in`. The developer restores its DNS record, pointing at wherever the web app is deployed, at
  the `spanion.in` DNS provider, and adds the domain to that deployment.
- The Play listing's privacy policy URL stays on this host, at its `/privacy` page.

## Consequences

- No app, asset link or passkey changes because of the outage.
- The DNS record lives outside this repository; nothing here notices if it goes missing again.

## History

- 2026-11-05: wrote the paths of files that spec 2c removed (app/api/webauthn/verify-registration/route.ts, proxy.ts) as plain text, so verify no longer expects them; the decision itself is unchanged.

## Sources

- `packages/android/source/app/build.gradle`
- `packages/android/source/app/src/main/res/values/strings.xml`
- `public/.well-known/assetlinks.json`
- `packages/ios/src/Splitify/Settings.swift`
- `packages/ios/src/Splitify/Entitlements/Entitlements.plist`
- app/api/webauthn/verify-registration/route.ts
- proxy.ts
