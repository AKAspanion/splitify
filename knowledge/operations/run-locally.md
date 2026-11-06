---
type: Runbook
title: Run locally
description: Install with pnpm, start the web app and every emulator with pnpm dev on the demo project, run the rule tests, and check the static build on the Hosting emulator.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Run locally

## Prerequisites

- Node 24 (`.nvmrc`) and pnpm 11 (`packageManager` in `package.json`, pinned with its sha512). The root app and `functions/`
  are two separate pnpm packages, each with its own lockfile, so a functions deploy ships `functions/` as it always did.
- Java, for the Firebase emulators (CI uses Temurin 21). No database, Clerk, OneSignal or UploadThing project is needed:
  the database is SQL Connect and its emulator ([environment](environment.md)).
- No `.env` is needed to develop: `pnpm dev` sets what the browser needs itself.

## Steps

1. `pnpm install`. Its `postinstall` runs `pnpm dataconnect:generate`, which writes the SQL Connect SDKs; `pnpm functions:install` installs `functions/`.
2. `pnpm dev` (`scripts.dev`, `scripts/dev.mjs`). It builds the functions, starts their `tsc` watcher, starts the emulators
   as the demo project `demo-splitify` (Auth, SQL Connect, Functions and what they need; no Hosting emulator) and `next dev`
   on `127.0.0.1:2140`. Data persists in `.emulator-data/` (imported at start, exported at exit); the Emulator UI is on 2149.
   Ctrl+C stops every child and waits for the emulator export before exiting; a second Ctrl+C forces it. Only `*.hosting.tsx` files are routes.
3. The functions' secret `SESSION_PASSWORD` comes from `functions/.secret.local`, which the script generates once and git
   ignores; `functions/.env.demo-splitify` sets the passkey params for the demo project only.
4. In `next dev` there is no Hosting in front and a static export refuses rewrites, so `next.config.mjs` (a function of
   the phase) drops the export and rewrites `/api/reports/**` and `/api/webauthn/**` to the Functions emulator, built from
   `firebase.json`'s hosting rewrites by `scripts/dev-env.mjs`. Production builds are unchanged.
5. To run the whole site as it is served, see "Checking the static build" below. `pnpm ngrok` (`scripts.ngrok`) forwards
   `127.0.0.1:2140` on the reserved domain in `NGROK_DOMAIN`, and refuses to start without it.

If the Functions emulator fails with "Cannot determine backend specification. Timeout after 10000" the functions are
not loaded: the CLI gave the discovery step 10 seconds and the machine was busy. Starting with
`FUNCTIONS_DISCOVERY_TIMEOUT=60` (seconds) loaded them. It was seen once, on 2026-11-06, and not tracked further.

Local work runs on `demo-splitify`, so nothing local can reach production ([decision](../decisions/local-development-on-the-demo-project.md));
every local port is in the 2140 series ([decision](../decisions/local-ports-2140-series.md)).

## Emulator ports

The dev emulator ports are in the `emulators` block of `firebase.json`. `lib/firebase/emulators.ts` mirrors the three the
browser calls (Auth, SQL Connect, Functions), because the bundle can't read `firebase.json`; `lib/firebase/emulators.test.ts`
holds the copy equal to it. The Firebase CLI is `firebase-tools`, an exact devDependency, and the scripts run the local `firebase` bin.

## Testing the SQL Connect rules

- `pnpm test:rules` (`scripts.test:rules`) generates the gitignored `firebase.rules-test.json` (`scripts/rules-test-firebase-config.mjs`),
  then runs `firebase emulators:exec` for Auth and SQL Connect on their own ports, 2152 to 2156, so it can run while `pnpm dev`
  runs, and runs the rule tests with `vitest.rules.config.mts` (the `dataconnect/` and `functions/src` tests, `lib/firebase/` and `lib/data/**/*.rules.test.ts`); plain `pnpm test` skips them.
- The rule-test helpers (`dataconnect/test-utils/emulator-ports.ts`, which `vitest.rules.config.mts` aliases for
  `@/lib/firebase/emulators`) read the emulator hosts from the env and refuse to run without it, so a stray run can't empty the dev database.
- `functions/` builds with `pnpm functions:build`, using its own `typescript` and `tsconfig.json` (node16 resolution, test files excluded; the rules Vitest config runs those tests).
- `pnpm dataconnect:generate` writes the SDKs to `dataconnect/generated/` ([SQL Connect schema](../data/sql-connect.md)).
- The SQL Connect triggers do not run in the local Functions emulator: [finding](../findings/sql-connect-triggers-not-run-locally.md).

## End-to-end tests

`pnpm test:e2e` (`scripts.test:e2e`, `playwright.config.ts`, specs in `tests/e2e/`) starts `node scripts/dev.mjs`, or
reuses a running `pnpm dev` locally; CI always starts its own. It needs the `functions/` dependencies installed, Java,
and Chromium (`pnpm exec playwright install chromium`). The run writes its test users and groups into the local
`.emulator-data`: [finding](../findings/e2e-writes-into-local-emulator-data.md). CI runs it on every pull request
([CI and deploy](ci-cd.md), [decision](../decisions/e2e-playwright-main-flow.md)).

## Checking the static build

`pnpm build` (the same as `pnpm build:hosting`) writes the whole static site to `out/` and needs no database or `.env`
([the web app](../apps/splitify.md)). It does need the generated SQL Connect SDK and the `functions/` dependencies,
because `next build` typechecks the whole project. `pnpm check:hosting` (`scripts/check-hosting-build.mjs`) then serves
`out/` on the Hosting emulator (port in `firebase.json`, project `demo-splitify`) and checks which pages and headers it
answers with: each area's pages and requests are in a manifest under `scripts/hosting-pages/*.json`, and the id routes
answer through the rewrites in `firebase.json`. A manifest may also list `absentPages`, files `out/` must not hold
(`scripts/hosting-pages/webauthn.json` asserts the deleted WebAuthn test page is gone).

The Hosting CSP blocks calls to the emulators, so local checks use `firebase.emulators.json`, which
`scripts/emulator-firebase-config.mjs` generates from `firebase.json` with the Auth, SQL Connect and Functions emulators'
addresses added to `connect-src` (`pnpm check:hosting` regenerates it, and the README gives the command to start the
emulators with it). Never deploy with it. The functions run on the emulators too: `reports` and `webauthn` through the
Hosting rewrites, and `deleteMyAccount` through the callable.

## History

- 2026-11-06: said nothing about the Functions emulator timing out at start; now it names `FUNCTIONS_DISCOVERY_TIMEOUT=60`, because the emulator failed to load the functions on a busy machine.
- 2026-11-06: `pnpm ngrok` had a fixed domain, there was no e2e command and the hosting check only listed pages that must exist; now ngrok reads `NGROK_DOMAIN`, `pnpm test:e2e` runs Playwright on the emulators and a manifest can list absent pages, because the repository-modernization run changed each.
- 2026-11-05: the package manager was yarn 1, the dev server needed a `.env` and ran on Next's default port against hand-started emulators, and the CLI ran through `npx`; now pnpm 11, `pnpm dev` starts everything on `demo-splitify` in the 2140 series with the local `firebase-tools`, and the rule tests have their own ports, because local development moves onto the emulators. See [the demo project decision](../decisions/local-development-on-the-demo-project.md).
- 2026-11-05: the build wrote only the static site; now `postbuild` also writes the service worker's file list into `out/`, and the worker works only in that build, not `next dev`, because of offline support. See [service worker](service-worker.md).
- 2026-11-05: needed MySQL in Docker, Clerk, OneSignal and UploadThing keys, a Prisma schema push and a health-check route; now only Node, Java and the Firebase emulators, and the build is the one static site checked with `firebase.emulators.json`, because spec 2c removed the server. See [decision](../decisions/static-build-on-firebase-hosting.md).
- 2026-11-05: the hosting check read one list of pages; now one manifest per area and the id-route rewrites, because spec 2b added the signed-in screens.
- 2026-11-05: the rules config skipped `lib/data/`; now it includes the `*.rules.test.ts` files there, because the expense writes' emulator test lives beside the code.
- 2026-11-05: added the hosting build and its check, because the public pages are served from Firebase Hosting.
- 2026-11-04: added the rule tests and SDK generation, because the SQL Connect schema and its rules were built.
- 2026-11-04: Node 24 from `.nvmrc`, the CLI pinned through `npx` and the functions build added, because CI and deploy need the same versions ([CI and deploy](ci-cd.md)).

## Sources

- `package.json`
- `scripts/dev.mjs`
- `scripts/dev-env.mjs`
- `scripts/rules-test-firebase-config.mjs`
- `lib/firebase/emulators.ts`
- `lib/firebase/emulators.test.ts`
- `dataconnect/test-utils/emulator-ports.ts`
- `functions/.env.demo-splitify`
- `pnpm-lock.yaml`
- `functions/pnpm-lock.yaml`
- `vitest.rules.config.mts`
- `dataconnect/test-utils/emulator.ts`
- `.nvmrc`
- `functions/tsconfig.json`
- `.env.sample`
- `scripts/emulator-firebase-config.mjs`
- `scripts/check-hosting-build.mjs`
- `scripts/hosting-pages/webauthn.json`
- `playwright.config.ts`
- `next.config.mjs`
- `firebase.json`
