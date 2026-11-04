---
type: Runbook
title: Run locally
description: Start MySQL with Docker, fill in .env, install with yarn (which pushes the schema), and run the Next.js dev server.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Run locally

## Prerequisites

- Node 24 (`.nvmrc`) and yarn 1 (`packageManager` in `package.json`).
- Docker, for the MySQL container in `docker-compose.yml` (its host port and database name are set there).
- Clerk, OneSignal and UploadThing projects for their keys ([environment](environment.md)).

## Steps

1. Start the database: `yarn db` (`scripts.db`, which runs `docker compose up --build`).
2. Copy `.env.sample` to `.env` and fill it in; point `DATABASE_URL` at the container.
3. `yarn install`. Its `postinstall` runs `prisma generate` and `prisma db push`, so it applies the schema to
   whatever `DATABASE_URL` points at ([debt](../risks/debt.md)).
4. `yarn dev` (`scripts.dev`). The port is Next's default; nothing in the repository sets another.
5. For Clerk's webhook to reach a local server, `yarn ngrok` (`scripts.ngrok`) opens a tunnel; point Clerk's webhook
   at its URL plus `/api/webhook/clerk`.
6. `yarn studio` opens Prisma Studio on the database.
7. `GET /api/health-check` answers `{ message: "Server is up" }` without a session.

## Testing the SQL Connect rules

- `yarn test:rules` (`scripts.test:rules`) starts the Auth and SQL Connect emulators on the demo project
  `demo-splitify` and runs the rule tests with `vitest.rules.config.mts`; plain `yarn test` skips them. The
  emulator's Postgres falls back to another port when its default is taken.
- The Firebase CLI runs pinned through `npx --yes firebase-tools@15.34.2` in the scripts, so no global install is needed.
- `functions/` builds with `yarn --cwd functions build`, using its own `typescript` and `tsconfig.json` (node16 resolution, test files excluded; the rules Vitest config runs those tests).
- `yarn dataconnect:generate` writes the SDKs to `dataconnect/generated/` ([SQL Connect schema](../data/sql-connect.md)).

## Building the public pages

`yarn build:hosting` writes the static public pages to `out/` and needs no database, Clerk key or `.env`
([the hosting build](../apps/splitify.md)). `yarn check:hosting` (`scripts/check-hosting-build.mjs`) then serves
`out/` on the Hosting emulator (port in `firebase.json`, project `demo-splitify`) and checks which pages and headers it
answers with.

## History

- 2026-11-05: added the hosting build and its check, because the public pages are served from Firebase Hosting.
- 2026-11-04: added the rule tests and SDK generation, because the SQL Connect schema and its rules were built.
- 2026-11-04: Node 24 from `.nvmrc`, the CLI pinned through `npx` and the functions build added, because CI and deploy need the same versions ([CI and deploy](ci-cd.md)).

## Sources

- `package.json`
- `vitest.rules.config.mts`
- `dataconnect/test-utils/emulator.ts`
- `docker-compose.yml`
- `.nvmrc`
- `functions/tsconfig.json`
- `.env.sample`
- `scripts/check-hosting-build.mjs`
- `next.config.mjs`
- `firebase.json`
- `app/api/health-check/route.ts`
