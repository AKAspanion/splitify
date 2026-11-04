# Spec: public pages on Firebase Hosting

Date: 2026-11-05 · Branch: `feat/firebase-hosting`

## Why

The developer wants the site built and up on Firebase Hosting before the screens move onto SQL Connect: a static,
client-rendered build with no server rendering. Only the landing page, `/privacy` and `/delete-account` can be built
that way today; everything else still needs a server, and the database it needs is gone. Decision:
[public pages on Firebase Hosting first](../../knowledge/decisions/public-pages-on-firebase-hosting-first.md).

## Scope

In: a hosting build target, the "coming back soon" page, the `firebase.json` hosting block, the build in CI, the
hosting deploy in `deploy.yml`, and the README's domain steps.

Out: moving any signed-in screen (spec 2), a Content-Security-Policy header (it needs Clerk's, OneSignal's and
AdSense's hosts, and Clerk goes in spec 2; it comes with the full static build), and anything on Vercel, which keeps
building `main` until the app moves.

## The hosting build

- `yarn build:hosting` sets `NEXT_BUILD_TARGET=hosting` and runs `next build`, never `yarn build`, whose `postbuild`
  runs `prisma db push`.
- With `NEXT_BUILD_TARGET=hosting`, `next.config.mjs` sets `output: "export"`, `trailingSlash: true`,
  `images.unoptimized: true`, and `pageExtensions: ["hosting.tsx"]`, so only files named `page.hosting.tsx` and
  `layout.hosting.tsx` are routes. Without it the config is what it is today, and those files are ignored, since
  Next only treats `page.tsx` as a page.
- The hosting entries re-export the real files, so there's one copy of each page:
  - `app/layout.hosting.tsx` → `app/layout.tsx`
  - `app/(landing)/layout.hosting.tsx` and `app/(landing)/page.hosting.tsx` → the landing layout and page
  - `app/(platform)/layout.hosting.tsx`, `app/(platform)/privacy/page.hosting.tsx` and
    `app/(platform)/delete-account/page.hosting.tsx` → the platform layout and the two pages
  - `app/coming-soon/page.hosting.tsx`: the one page of its own (below).
- No route handler, server action or `proxy.ts` is part of this build; if the build still trips on one, the plan
  finds the smallest way round it and records it as a ruling.
- Output goes to `out/`, which git ignores.

## The "coming back soon" page

- Route `/coming-soon/`, built from the app's own components (the `Header` the public pages use, a `Button`).
- Title "Splitify is coming back soon", body "We're moving Splitify to a faster home. Signing in will be back
  shortly. Your privacy policy and account deletion pages are still here.", and links to `/`, `/privacy` and
  `/delete-account`.
- It renders in light and dark mode like the other public pages, and at phone width.

## Firebase Hosting

`firebase.json` gains a `hosting` block:

- `public: "out"`, `cleanUrls: true`, `trailingSlash: true`.
- One rewrite: `**` → `/coming-soon/index.html`. Hosting serves an existing file first, so `/`, `/privacy/`,
  `/delete-account/`, `/_next/**`, `/images/**`, the OneSignal workers and `/.well-known/assetlinks.json` are served as
  they are, and any other path (`/groups`, `/sign-in`) gets the coming-soon page.
- Headers, as flash-cards' except the CSP: `Cache-Control: no-cache` on everything,
  `Cache-Control: public, max-age=31536000, immutable` on `/_next/static/**`, and `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`,
  `Cross-Origin-Opener-Policy: same-origin-allow-popups` on everything.
- `/.well-known/assetlinks.json` is served as `application/json`.

## CI and deploy

- `ci.yml` gains a step "Hosting build" after the tests: `yarn build:hosting`, which fails the pull request when a
  public page stops exporting.
- `deploy.yml`'s deploy job gains, before the functions deploy: install the root dependencies with `--ignore-scripts`,
  `yarn build:hosting`, then deploy hosting with `FirebaseExtended/action-hosting-deploy` pinned to the SHA
  flash-cards uses (`500ac625ca2dd40cbd15f7659af953801858032a # v0.11.0`), `channelId: live`,
  `firebaseToolsVersion: 15.34.2`, the `FIREBASE_SERVICE_ACCOUNT` secret and the `FIREBASE_PROJECT_ID` variable.
- The build uses no Clerk at all: the developer no longer has a Clerk account, so in the hosting build
  `@clerk/nextjs` resolves to a stub (`lib/clerk-hosting.tsx`) that reports no signed-in user and needs no key. It
  reads `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`, `NEXT_PUBLIC_ONE_SIGNAL_APP_ID` and `NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID`
  from repository Variables, all optional and public by design.
- Vercel Analytics stays out of the hosting build: `app/analytics.tsx` renders nothing when
  `NEXT_BUILD_TARGET` is `hosting`, since `/_vercel/insights` doesn't exist on Firebase Hosting.
- `github-deploy@` needs Firebase Hosting Admin, which it already has.

## README

The "One-time setup" gains:

- the four repository Variables above;
- the custom domain: Firebase console → Hosting → **Add custom domain** → `splitify.spanion.in`, then the DNS
  records it shows at the `spanion.in` DNS provider, replacing any old record for `splitify`; the certificate can
  take a few hours;
- once the domain answers, the **Authorized domains** list in Firebase Authentication gains `splitify.spanion.in`.

## Testing

- `yarn build:hosting` writes `out/index.html`, `out/privacy/index.html`, `out/delete-account/index.html` and
  `out/coming-soon/index.html`, and no other page (no `out/groups/`, no `out/sign-in/`).
- With the Hosting emulator serving `out/` (`npx --yes firebase-tools@15.34.2 emulators:exec --only hosting`):
  `/` answers 200 with the landing page; `/privacy` and `/delete-account` answer 200 with their pages; `/groups/abc`
  and `/sign-in` answer 200 with the coming-soon page; `/.well-known/assetlinks.json` answers 200 as
  `application/json`; every response carries the headers above, and `/_next/static/` files the immutable cache header.
- The normal build is unaffected: `yarn tsc --noEmit` and `yarn lint` pass, and no `page.tsx` changed.

## Done when

- The checks above pass locally, and PR CI's "Hosting build" passes.
- After merge, the deploy publishes the site to `https://splitify-416321.web.app`, and to `splitify.spanion.in`
  once the developer has added the domain.
