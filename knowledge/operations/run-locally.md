---
type: Runbook
title: Run locally
description: Install with yarn, fill in .env, run the Next.js dev server against the Firebase emulators, and check the static build on the Hosting emulator.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Run locally

## Prerequisites

- Node 24 (`.nvmrc`) and yarn 1 (`packageManager` in `package.json`).
- Java, for the Firebase emulators (CI uses Temurin 21). No database, Clerk, OneSignal or UploadThing project is needed:
  the database is SQL Connect and its emulator ([environment](environment.md)).

## Steps

1. Copy `.env.sample` to `.env` and fill in the `NEXT_PUBLIC_FIREBASE_*` keys; `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`
   points the browser at the emulators. `.env.sample` still lists removed keys, which can be ignored.
2. `yarn install`. Its `postinstall` runs `yarn dataconnect:generate`, which writes the SQL Connect SDKs.
3. `yarn dev` (`scripts.dev`). The port is Next's default; nothing in the repository sets another. Only `*.hosting.tsx` files
   are routes.
4. To run the whole site as it is served, build it and start the emulators with the generated config: see
   "Checking the static build" below. `yarn ngrok` (`scripts.ngrok`) is left over from the Clerk webhook and needs nothing
   now.

## Testing the SQL Connect rules

- `yarn test:rules` (`scripts.test:rules`) starts the Auth and SQL Connect emulators on the demo project
  `demo-splitify` and runs the rule tests with `vitest.rules.config.mts` (the `dataconnect/` and `functions/src` tests, `lib/firebase/` and `lib/data/**/*.rules.test.ts`); plain `yarn test` skips them. The
  emulator's Postgres falls back to another port when its default is taken.
- The Firebase CLI runs pinned through `npx --yes firebase-tools@15.34.2` in the scripts, so no global install is needed.
- `functions/` builds with `yarn --cwd functions build`, using its own `typescript` and `tsconfig.json` (node16 resolution, test files excluded; the rules Vitest config runs those tests).
- `yarn dataconnect:generate` writes the SDKs to `dataconnect/generated/` ([SQL Connect schema](../data/sql-connect.md)).

## Checking the static build

`yarn build` (the same as `yarn build:hosting`) writes the whole static site to `out/` and needs no database or `.env`
([the web app](../apps/splitify.md)). It does need the generated SQL Connect SDK and the `functions/` dependencies,
because `next build` typechecks the whole project. `yarn check:hosting` (`scripts/check-hosting-build.mjs`) then serves
`out/` on the Hosting emulator (port in `firebase.json`, project `demo-splitify`) and checks which pages and headers it
answers with: each area's pages and requests are in a manifest under `scripts/hosting-pages/*.json`, and the id routes
answer through the rewrites in `firebase.json`.

The Hosting CSP blocks calls to the emulators, so local checks use `firebase.emulators.json`, which
`scripts/emulator-firebase-config.mjs` generates from `firebase.json` with the Auth, SQL Connect and Functions emulators'
addresses added to `connect-src` (`yarn check:hosting` regenerates it, and the README gives the command to start the
emulators with it). Never deploy with it. The functions run on the emulators too: `reports` and `webauthn` through the
Hosting rewrites, and `deleteMyAccount` through the callable.

## History

- 2026-11-05: the build wrote only the static site; now `postbuild` also writes the service worker's file list into `out/`, and the worker works only in that build, not `next dev`, because of offline support. See [service worker](service-worker.md).
- 2026-11-05: needed MySQL in Docker, Clerk, OneSignal and UploadThing keys, a Prisma schema push and a health-check route; now only Node, Java and the Firebase emulators, and the build is the one static site checked with `firebase.emulators.json`, because spec 2c removed the server. See [decision](../decisions/static-build-on-firebase-hosting.md).
- 2026-11-05: the hosting check read one list of pages; now one manifest per area and the id-route rewrites, because spec 2b added the signed-in screens.
- 2026-11-05: the rules config skipped `lib/data/`; now it includes the `*.rules.test.ts` files there, because the expense writes' emulator test lives beside the code.
- 2026-11-05: added the hosting build and its check, because the public pages are served from Firebase Hosting.
- 2026-11-04: added the rule tests and SDK generation, because the SQL Connect schema and its rules were built.
- 2026-11-04: Node 24 from `.nvmrc`, the CLI pinned through `npx` and the functions build added, because CI and deploy need the same versions ([CI and deploy](ci-cd.md)).

## Sources

- `package.json`
- `vitest.rules.config.mts`
- `dataconnect/test-utils/emulator.ts`
- `.nvmrc`
- `functions/tsconfig.json`
- `.env.sample`
- `scripts/emulator-firebase-config.mjs`
- `scripts/check-hosting-build.mjs`
- `next.config.mjs`
- `firebase.json`
