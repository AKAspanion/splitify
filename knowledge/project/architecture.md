---
type: Architecture
title: Architecture
description: One Next.js App Router app: server actions write, route handlers read and notify, Prisma stores data in MySQL, Clerk signs people in.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Architecture

## Services

There is one deployable service, the Next.js app at the repository root (`next.config.mjs`). Inside it:

- **Pages** live in `app/`, in route groups: `app/(landing)` (public home page), `app/(platform)` (the signed-in
  app, plus the Clerk sign-in pages and `/privacy`) and `app/(admin)` (the logs page). See
  [the web app](../apps/splitify.md).
- **Writes** go through server actions in `actions/<verb-noun>/`, each wrapped by `createSafeAction` in
  `lib/safe-actions.ts`, which validates the input with its zod schema first. See
  [server actions](../api/server-actions.md).
- **Reads** are a mix: server components call the `actions/get-*` functions, and client components fetch the
  `/api/app/...` route handlers through react-query hooks in `hooks/` (`utils/api.ts` wraps axios). Zustand stores in
  `store/` cache groups, expenses and activities on the client. See [app API](../api/app.md).
- **Balances** are computed in memory on each render by the split engine in `lib/splitify/`, called from
  `app/(platform)/(app)/_utils/calculation.ts`. Nothing about balances is stored. See
  [split types](../domain/split-types.md) and [debt simplification](../domain/debt-simplification.md).
- **Data** is Prisma over MySQL (`prisma/schema.prisma`, client in `lib/db.ts`). See [data model](../data/model.md).
- **Auth** is Clerk, enforced by `proxy.ts`. See [auth](../security/auth.md).

## Jobs and queues

There are no background jobs or queues. Follow-up work after a write runs as a second request from the browser:
when a server action succeeds, the form's `onSuccess` calls a `NotificationService` method
(`lib/notification/service/index.ts`), which posts to `/api/push-notification/...`. That route sends the OneSignal
push **and** writes the `Activity` row. See [push-notification API](../api/push-notification.md).

## Data flow

1. A signed-in person submits a form; the client calls a server action through `useAction` (`hooks/use-action.ts`).
2. The action checks `auth()` from Clerk, writes with Prisma, calls `revalidatePath`, and returns `{ data }` or
   `{ error, debugMessage }`.
3. On success the client calls the matching notification route, which notifies the group's members through
   OneSignal and records the activity.
4. Pages re-render; balance screens recompute balances from the group's expenses, payments and splits.

User rows are created and updated by Clerk's webhook, `POST /api/webhook/clerk` (see
[Clerk](../integrations/clerk.md)), or as offline contacts by `createContact`.

## Sources

- `next.config.mjs`
- `proxy.ts`
- `lib/safe-actions.ts`
- `hooks/use-action.ts`
- `utils/api.ts`
- `lib/db.ts`
- `prisma/schema.prisma`
- `lib/notification/service/index.ts`
- `app/(platform)/(app)/_utils/calculation.ts`
