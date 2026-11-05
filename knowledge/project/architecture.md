---
type: Architecture
title: Architecture
description: One static Next.js build on Firebase Hosting; the browser talks to SQL Connect and, for reports, passkeys and account deletion, to Cloud Functions.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Architecture

## Services

There is no application server. The Next.js app at the repository root (`next.config.mjs`) is built as one static
export (`output: "export"`) that Firebase Hosting serves, and the browser talks to Google services directly
([static build decision](../decisions/static-build-on-firebase-hosting.md)):

- **Pages** live in `app/`, in route groups: `app/(landing)` (public home page), `app/(platform)` (the signed-in
  app, plus the sign-in screens and `/privacy`). Only `*.hosting.tsx` files are routes. See
  [the web app](../apps/splitify.md).
- **Data** is [SQL Connect](../data/sql-connect.md) (Cloud SQL Postgres) and Firebase Auth. Screens read and write
  through the hooks in `lib/data/` (react-query over the generated SDK), and the SQL Connect schema and its auth
  rules are the access control. Zustand stores in `store/` hold the groups, expenses and activities a screen is
  showing.
- **Cloud Functions** do what the browser must not: the `reports` and `webauthn` HTTP functions, which Hosting
  rewrites `/api/reports/**` and `/api/webauthn/**` to; the `deleteMyAccount` callable; and the triggers that merge
  contacts, send pushes and cut billing. The browser calls the HTTP functions with `callFunction`
  (`lib/functions/call.ts`), which sends the Firebase ID token, and each checks it with the guard
  (`functions/src/http/guard.ts`). See [Cloud Functions](../apps/functions.md) and [auth](../security/auth.md).
  In `next dev` there is no Hosting, so `next.config.mjs` rewrites those two paths to the Functions emulator instead ([run locally](../operations/run-locally.md)).
- **Balances** are computed in memory on each render by the split engine in `lib/splitify/`, called from
  `app/(platform)/(app)/_utils/calculation.ts`. Nothing about balances is stored. See
  [split types](../domain/split-types.md) and [debt simplification](../domain/debt-simplification.md).
- **Auth** is Firebase Auth, checked in the browser by `RequireAuth` and on every function by the guard. See
  [auth](../security/auth.md).

## Jobs and queues

There are no queues. Each change writes its `Activity` row in the same SQL Connect mutation, and a Cloud Functions
trigger on that mutation sends the pushes through FCM ([notifications](../features/notifications.md),
[activity and notifications](../decisions/activity-and-notifications-in-actions.md)); a failed push never fails the
change. A Pub/Sub trigger runs the [budget kill switch](../decisions/budget-kill-switch.md).

## Data flow

1. A signed-in person submits a form; a `lib/data/` hook runs a SQL Connect mutation with their Firebase ID token.
2. SQL Connect checks the caller against the schema's auth rules, writes the change and its `Activity` row, and the
   hook invalidates the affected queries.
3. A function trigger on the mutation pushes to the group's members through FCM.
4. The screens re-render; balance screens recompute balances from the group's expenses, payments and splits.

User rows are created on first sign-in by the `UpsertMe` mutation, and offline contacts by the contact screens
([contact identity](../domain/contact-identity.md)).

## History

- 2026-11-05: the `/api/` rewrites existed only in Hosting; now `next dev` has its own dev-only rewrites to the Functions emulator, because local development runs on the emulators.
- 2026-11-05: pushes and activity were sent by `/api/push-notification` routes the browser called after each action; now each action writes its activity and sends its pushes itself, because the security fixes removed those routes. See [activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md).
- 2026-11-05: added the hosting build, because the public pages are served from Firebase Hosting first.
- 2026-11-05: was a Next.js server (server actions, `/api` route handlers, Prisma over MySQL, Clerk, OneSignal); now one static build served by Firebase Hosting, with SQL Connect and Cloud Functions behind it, because spec 2c removed the server. See [static build on Firebase Hosting](../decisions/static-build-on-firebase-hosting.md).

## Sources

- `next.config.mjs`
- `firebase.json`
- `lib/functions/call.ts`
- `functions/src/http/guard.ts`
- `functions/src/index.ts`
- `lib/data/client.ts`
- `components/auth/require-auth.tsx`
- `app/(platform)/(app)/_utils/calculation.ts`
