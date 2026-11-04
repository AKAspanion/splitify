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

- Node and yarn 1 (`packageManager` in `package.json`).
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

## Sources

- `package.json`
- `docker-compose.yml`
- `.env.sample`
- `app/api/health-check/route.ts`
