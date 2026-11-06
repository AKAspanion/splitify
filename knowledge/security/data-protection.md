---
type: Security
title: Data protection
description: What Splitify stores that is personal or sensitive, where it lives, and what protects it.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Data protection

## Sensitive data

- **Personal details:** `User.email`, `User.name`, `User.firstName`, `User.lastName` and profile images, from the sign-in
  provider or typed in for contacts. Group members' details are returned by the group queries and the reports.
- **Spending:** every expense, payment and split, per person and group.
- **Device keys:** each user's WebAuthn public keys and counters, in `AuthnDevice.devices`, read and written only by
  the `webauthn` function through the `admin` connector, which no signed-in person can call
  ([SQL Connect schema](../data/sql-connect.md)).
- **Push tokens** in `PushToken`, owned by whoever is signed in on the device.
- **Logs:** Cloud Functions write to Cloud Logging, with an error's class and never its message, a token or a body
  ([decision](../decisions/cloud-logging.md), [logging](../operations/logging.md)).
- **Feedback** text in `Feedback`.

## Protections

- Data is reachable only with a Firebase ID token ([auth](auth.md)), and SQL Connect's rules limit each operation to the
  caller's own groups and friends ([roles](roles.md)). The functions refuse a call without a valid token.
- Secrets are Firebase secrets and params, never in the code: `SESSION_PASSWORD` is a function secret
  ([Cloud Functions](../apps/functions.md)). The old hard-coded session password is
  [fixed](../findings/hardcoded-session-password.md). The iOS Firebase config is untracked
  ([fixed](../findings/committed-firebase-config.md)); its key stays in git history, so it needs restricting to the iOS
  bundle id in Google Cloud.
- A back link a page is given in the URL goes through `backHref` and `safeNextPath` (`components/container/header.tsx`,
  `lib/auth/next-path.ts`), so a `javascript:` or off-site target falls back to the page's own default. On the ad pages
  (`/privacy`, `/delete-account`) the back arrow is a plain anchor (`fullPageLoad`), so leaving is a full page load
  and the ad script can't follow into the app ([AdSense](../integrations/google-adsense.md)).
- Hosting sends the security headers in `firebase.json`: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (`max-age=63072000; includeSubDomains`) and a
  Content-Security-Policy that limits scripts, connections and frames to
  the hosts the pages load (Google, Firebase and AdSense hosts, and the one Cloud Functions host). Provisional: its
  `script-src` and `style-src` allow `'unsafe-inline'`, because Next's static export inlines its hydration scripts and
  styles; the developer accepts it or asks for script hashes later, and production may load more AdSense hosts, so
  watch for CSP violations after the first deploy.
- `frame-src` allows `'self'` because Firebase's auth iframe runs on the site's own origin (the auth domain is
  `splitify.spanion.in`); Hosting sends no CSP or `X-Frame-Options` on `/__/auth/iframe`, so the site-wide `DENY` and
  `frame-ancestors 'none'` stay. `lib/security/csp.test.ts` pins the `frame-src` list.
- `.claude/settings.json` stops Claude reading `.env` files.
- Firebase's one-time reset and verify codes reach `/auth/action/` in the URL ([sign in](../features/sign-in.md)), so
  the code is kept out of three places: the service worker bypasses `/auth/action` and anything under it
  (`lib/offline/sw-routing.js`, mirrored in `public/sw-routing.js` and held equal by a test, see
  [service worker](../operations/service-worker.md)); AdSense never loads in a document whose first page was
  `/auth/action` (`app/adsense.tsx`; the rest of its rule is in [AdSense](../integrations/google-adsense.md)); and Hosting sends that page `Cache-Control: no-store`
  and `Referrer-Policy: strict-origin` (`firebase.json`). It is `strict-origin`, not `no-referrer`, so a
  referrer-restricted API key still accepts the page's Firebase calls while the path and the code never leave.

## History

- 2026-11-06: the ad pages' back arrow was a client link; now it is a full page load, because of the AdSense decision. See [decision](../decisions/adsense-on-privacy-and-delete-account-pages.md).
- 2026-11-06: described the AdSense exclusion for `/auth/action` as the only ad rule; now it points to the AdSense integration for the rest (public pages, signed-out only), because main's rule was merged in. See [decision](../decisions/adsense-on-public-pages-only.md).
- 2026-11-06: sent no HSTS header, trusted a back link as given and called the iOS config an open finding; now Hosting sends HSTS, back links are checked and the config is untracked, because the repository-modernization run fixed each.
- 2026-11-05: had nothing about one-time email codes; now the service worker, AdSense and Hosting's headers keep `/auth/action/` codes out of the cache, ad scripts and referrers, because reset and verify emails now link to that page.
- 2026-11-05: `frame-src` framed only Firebase's `firebaseapp.com` host and Google; now it also allows `'self'`, because Google sign-in became a redirect and Firebase's auth iframe runs on the site's own origin. See [sign-in](../features/sign-in.md).
- 2026-11-05: was Clerk sessions, `AuthnDevice.data` and the `Log` table over MySQL; now ID-token checks, `AuthnDevice.devices` through the admin connector, Cloud Logging and the Hosting security headers, because spec 2c removed the server. See [decision](../decisions/static-build-on-firebase-hosting.md).

## Sources

- `firebase.json`
- `lib/offline/sw-routing.js`
- `public/sw-routing.js`
- `lib/ads/ads-allowed.ts`
- `app/adsense.tsx`
- `lib/security/csp.test.ts`
- `functions/src/webauthn/index.ts`
- `functions/src/http/guard.ts`
- `dataconnect/schema/schema.gql`
- `components/container/header.tsx`
- `lib/auth/next-path.ts`
- `.claude/settings.json`
