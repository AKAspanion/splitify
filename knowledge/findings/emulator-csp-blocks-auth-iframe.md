---
type: Finding
title: "Fixed: The Hosting emulator's CSP may have blocked Google sign-in locally"
description: firebase.emulators.json's Content-Security-Policy frame-src had neither 'self' nor the Auth emulator's origin, so Google sign-in through the Hosting emulator may have been blocked; the generator now keeps the first and adds the second.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-05T12:24:26Z
---

# Fixed: The Hosting emulator's CSP may have blocked Google sign-in locally

## Finding

Google sign-in is a redirect that Firebase finishes in an auth iframe on the auth domain
([sign-in](../features/sign-in.md)). Production's `frame-src` in `firebase.json` allows `'self'` for it
([data protection](../security/data-protection.md)). `firebase.emulators.json`, the config the Hosting emulator
serves, has neither `'self'` nor the Auth emulator's origin in its `frame-src`, so a Google sign-in through the
Hosting emulator may have its iframe blocked. `next dev` sends no such headers, so local development there is
unaffected. Nobody has tried it.

## Evidence

The final fix wave's re-review, `.ga/runs/2026-11-05-google-sign-in-redirect/reviews/final-r1-reviewer.md`, out of
scope: "firebase.emulators.json frame-src has neither `'self'` nor the emulator's auth origin; local Google sign-in on
the emulator is unchecked." Deferred in the run's ledger as a Minor
(`docs/plans/2026-11-05-google-sign-in-redirect.record.md`).

## Status

Fixed: `scripts/emulator-firebase-config.mjs` copies `firebase.json`'s CSP, whose `frame-src` has `'self'`, and adds the
Auth emulator's origin to `frame-src` when it generates `firebase.emulators.json`.

## Sources

- `scripts/emulator-firebase-config.mjs`
- `firebase.emulators.json`
- `firebase.json`
