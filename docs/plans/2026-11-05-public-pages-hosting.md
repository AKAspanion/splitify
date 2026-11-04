# Public Pages on Firebase Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:implement-with-subagents by default, or ga:implement. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the landing page, `/privacy` and `/delete-account` as a static client-rendered export and deploy it to Firebase Hosting from CI, with a "coming back soon" page for every other route.

**Architecture:** A `NEXT_BUILD_TARGET=hosting` build switches `next.config.mjs` to `output: "export"` and to the page extension `hosting.tsx`, so only `*.hosting.tsx` entries, which re-export the real pages and layouts, are built. Firebase Hosting serves `out/`, rewriting every path it has no file for to the coming-soon page. CI builds it on every pull request, and `deploy.yml` deploys it on push to `main`.

**Tech Stack:** Next.js 16 App Router (static export), React 19, Tailwind with shadcn/ui, Clerk 7's client provider (kept in the root layout), yarn 1, Firebase Hosting through `npx --yes firebase-tools@15.34.2` and `FirebaseExtended/action-hosting-deploy`, GitHub Actions (`ci.yml`, `deploy.yml`, already in the repository).

**Spec:** [docs/specs/2026-11-05-public-pages-hosting.md](../specs/2026-11-05-public-pages-hosting.md)

## Global Constraints

- The hosting build is `yarn build:hosting`: `NEXT_BUILD_TARGET=hosting next build`. Never `yarn build` and never a plain `yarn install` (their `postbuild`/`postinstall` run `prisma db push`); installs use `--ignore-scripts`.
- Without `NEXT_BUILD_TARGET=hosting`, `next.config.mjs` and every existing `page.tsx` and `layout.tsx` behave exactly as before.
- The Firebase CLI is `npx --yes firebase-tools@15.34.2`; actions are pinned to commit SHAs with a version comment.
- Only public values are read at build time: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (required), `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`, `NEXT_PUBLIC_ONE_SIGNAL_APP_ID`, `NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID` (optional), from repository Variables in CI. No `.env` is read or printed.
- Nothing is deployed and no GitHub or Firebase setting is changed while building this plan.

## Checkpoints

None: the policy's `run.checkpoints` is `none`, and the spec asks for none. The run stops only at the end, before pushing.

---

### Task 1: The hosting build, the coming-soon page and the Hosting config

**Files:**
- Modify: `next.config.mjs`
- Modify: `package.json`
- Modify: `app/analytics.tsx`
- Create: `app/layout.hosting.tsx`
- Create: `app/(landing)/layout.hosting.tsx`
- Create: `app/(landing)/page.hosting.tsx`
- Create: `app/(platform)/layout.hosting.tsx`
- Create: `app/(platform)/privacy/page.hosting.tsx`
- Create: `app/(platform)/delete-account/page.hosting.tsx`
- Create: `app/coming-soon/page.hosting.tsx`
- Modify: `firebase.json`
- Test: `scripts/check-hosting-build.mjs`

**Interfaces:**
- Consumes: existing `app/layout.tsx`, `app/(landing)/layout.tsx`, `app/(landing)/page.tsx`, `app/(platform)/layout.tsx`, `app/(platform)/privacy/page.tsx`, `app/(platform)/delete-account/page.tsx`, `components/container/header`, `components/ui/button`.
- Produces (used by Task 2):
  - `package.json` script `"build:hosting": "NEXT_BUILD_TARGET=hosting next build"` and `"check:hosting": "node scripts/check-hosting-build.mjs"`.
  - `out/` holding the exported site.
  - `firebase.json` `hosting` block:

```json
{
  "public": "out",
  "cleanUrls": true,
  "trailingSlash": true,
  "rewrites": [{ "source": "**", "destination": "/coming-soon/index.html" }],
  "headers": [
    { "source": "**", "headers": [
      { "key": "Cache-Control", "value": "no-cache" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      { "key": "Cross-Origin-Opener-Policy", "value": "same-origin-allow-popups" } ] },
    { "source": "/_next/static/**", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/.well-known/assetlinks.json", "headers": [{ "key": "Content-Type", "value": "application/json" }] }
  ]
}
```

`scripts/check-hosting-build.mjs` is the task's test: given `out/`, it asserts which pages exist and which don't, then serves `out/` with the Hosting emulator (`npx --yes firebase-tools@15.34.2 emulators:exec --only hosting --project demo-splitify`) and asserts each response below, exiting non-zero on the first failure with a line naming it.

**Spec:**
- The hosting build: "`yarn build:hosting` sets `NEXT_BUILD_TARGET=hosting` and runs `next build`, never `yarn build`, whose `postbuild`"
- The hosting build: "`layout.hosting.tsx` are routes. Without it the config is what it is today, and those files are ignored, since"
- The hosting build: "No route handler, server action or `proxy.ts` is part of this build; if the build still trips on one, the plan"
- The coming-soon page: "Route `/coming-soon/`, built from the app's own components (the `Header` the public pages use, a `Button`)."
- Firebase Hosting: "One rewrite: `**` → `/coming-soon/index.html`. Hosting serves an existing file first, so `/`, `/privacy/`,"
- CI and deploy: "Vercel Analytics stays out of the hosting build: `app/analytics.tsx` renders nothing when"

**Tags:** `screen`, `security`

**Knowledge:** `apps/splitify`: the hosting build target, its `*.hosting.tsx` entries and the coming-soon page. `operations/run-locally`: `yarn build:hosting` and `yarn check:hosting`.

**Acceptance:**
- Given `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` set to a test-format key (`pk_test_` plus base64 of `example.clerk.accounts.dev$`), when `yarn build:hosting` runs, then it exits 0 and writes `out/index.html`, `out/privacy/index.html`, `out/delete-account/index.html` and `out/coming-soon/index.html`.
- Given that build, then `out/` holds no `groups/`, `sign-in/`, `sign-up/`, `profile/`, `api/` or `logs/` directory.
- Given the Hosting emulator serving `out/`, when `/`, `/privacy` and `/delete-account` are requested, then each answers 200 with its page's heading.
- Given the same, when `/groups/abc` and `/sign-in` are requested, then each answers 200 with "Splitify is coming back soon".
- Given the same, when `/.well-known/assetlinks.json` is requested, then it answers 200 with `Content-Type: application/json`.
- Given any response, then it carries `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, the `Permissions-Policy` and `Cross-Origin-Opener-Policy` above; a file under `/_next/static/` carries `Cache-Control: public, max-age=31536000, immutable`, and `/` carries `Cache-Control: no-cache`.
- Given the coming-soon page, then it shows the title "Splitify is coming back soon", the body "We're moving Splitify to a faster home. Signing in will be back shortly. Your privacy policy and account deletion pages are still here.", and links to `/`, `/privacy` and `/delete-account`, in light and dark mode and at a 390-pixel width without horizontal scroll.
- Given `NEXT_BUILD_TARGET` is `hosting`, then `app/analytics.tsx` renders nothing; otherwise it behaves as before.
- Given `NEXT_BUILD_TARGET` is unset, then `next.config.mjs` returns the same config as before (no `output`, no `pageExtensions`), `yarn tsc --noEmit` passes, and no existing `page.tsx` or `layout.tsx` changed.

- [ ] **Step 1: Write the failing check** `scripts/check-hosting-build.mjs` for each Acceptance case

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn check:hosting`
Expected: FAIL, naming the missing `out/index.html`

- [ ] **Step 3: Write the hosting build, the entries, the coming-soon page and the Hosting config** to the Interfaces, until the check passes

- [ ] **Step 4: Run it to verify it passes**

Run: `yarn build:hosting && yarn check:hosting`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs package.json app/analytics.tsx app/layout.hosting.tsx "app/(landing)/layout.hosting.tsx" "app/(landing)/page.hosting.tsx" "app/(platform)/layout.hosting.tsx" "app/(platform)/privacy/page.hosting.tsx" "app/(platform)/delete-account/page.hosting.tsx" app/coming-soon/page.hosting.tsx firebase.json scripts/check-hosting-build.mjs
git commit -m "Add a hosting build that exports the public pages and a coming-soon page, and the Firebase Hosting config that serves them."
```

---

### Task 2: Build in CI, deploy from deploy.yml, and the domain steps

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: `yarn build:hosting`, `yarn check:hosting`, `out/` and the `firebase.json` `hosting` block from Task 1; existing `ci.yml` and `deploy.yml` (their configuration check, key file and functions deploy).
- Produces: the hosting deploy on every push to `main`.

Repository Variables the build reads:

| Variable | Required | Read by |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes | the root layout's `ClerkProvider` |
| `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` | no | `app/layout.tsx` |
| `NEXT_PUBLIC_ONE_SIGNAL_APP_ID` | no | `app/launch.tsx` |
| `NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID` | no | `app/launch.tsx` |

Pinned action: `FirebaseExtended/action-hosting-deploy@500ac625ca2dd40cbd15f7659af953801858032a # v0.11.0`.

**Spec:**
- CI and deploy: "public page stops exporting."
- CI and deploy: "`deploy.yml`'s deploy job gains, before the functions deploy: install the root dependencies with `--ignore-scripts`,"
- CI and deploy: "repository Variables; all four are public by design. The configuration check fails naming"
- README: "the custom domain: Firebase console → Hosting → **Add custom domain** → `splitify.spanion.in`, then the DNS"

**Tags:** `security`

**Knowledge:** `operations/ci-cd`: CI builds and checks the hosting target, and the deploy publishes it to Firebase Hosting before the functions. `operations/deploy-setup`: the four repository Variables and the custom domain steps.

**Acceptance:**
- Given `ci.yml`, then after `yarn test:rules` it has a step "Hosting build" running `yarn build:hosting` and then `yarn check:hosting`, with the four Variables in its `env` from `vars.*`.
- Given a pull request where the Variable `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset, then the "Hosting build" step falls back to the test-format key from Task 1, so pull requests from forks and before setup still build.
- Given `deploy.yml`, then the configuration check fails with `::error::Missing repository settings:` naming `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` when it's empty, alongside the settings it already checks, and with no fallback key.
- Given a push to `main`, then the deploy job installs the root dependencies with `yarn install --frozen-lockfile --ignore-scripts`, runs `yarn build:hosting`, deploys hosting with the pinned action (`channelId: live`, `firebaseToolsVersion: 15.34.2`, `projectId: ${{ vars.FIREBASE_PROJECT_ID }}`, `firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}`), and only then deploys functions as before; the key file cleanup still runs `always()`.
- Given `README.md`, then the "One-time setup" lists the four Variables and which is required, the custom domain steps (Hosting → Add custom domain → `splitify.spanion.in`, the DNS records at the `spanion.in` provider replacing any old `splitify` record, the certificate taking a few hours), and adding `splitify.spanion.in` to Firebase Authentication's Authorized domains.
- Given both workflows, when `npx --yes @action-validator/cli` checks each by absolute path, then it reports no error, and every `uses:` is pinned to a SHA.

- [ ] **Step 1: Write the checks** for each Acceptance case: the validator by absolute path, and `grep` checks for the step names, the Variables, the fallback key only in `ci.yml`, and the action's SHA

- [ ] **Step 2: Run them to verify they fail**

Run: `grep -n "build:hosting" .github/workflows/ci.yml .github/workflows/deploy.yml`
Expected: FAIL, no match

- [ ] **Step 3: Write the workflow steps and the README sections** to the Interfaces, until the checks pass

- [ ] **Step 4: Run them to verify they pass**

Run: `npx --yes @action-validator/cli "$PWD/.github/workflows/deploy.yml"`
Expected: PASS, and the same for `ci.yml`

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/deploy.yml README.md
git commit -m "Build the hosting target on every pull request and deploy it to Firebase Hosting on every push to main."
```
