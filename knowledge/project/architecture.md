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
- **The hosting build** (`NEXT_BUILD_TARGET=hosting` in `next.config.mjs`) exports only the public pages as a static
  site for Firebase Hosting; see [the web app](../apps/splitify.md#the-hosting-build).
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

There are no background jobs or queues. Each server action writes its `Activity` row in the same transaction as its
change, then sends its pushes after the response with `notifyAfterResponse` (`lib/notification/notify.ts`), which
calls OneSignal through `lib/onesignal.ts`; a failed push doesn't fail the action. Once the app moves to Firebase, Cloud Functions send these pushes through FCM instead ([notifications](../features/notifications.md)). See
[activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md).

## Data flow

1. A signed-in person submits a form; the client calls a server action through `useAction` (`hooks/use-action.ts`).
2. The action checks `auth()` from Clerk and the caller's group membership, writes the change and its `Activity` row
   with Prisma in one transaction, calls `revalidatePath`, and returns `{ data }` or `{ error, debugMessage }`.
3. After the response, the action pushes to the group's members through OneSignal.
4. Pages re-render; balance screens recompute balances from the group's expenses, payments and splits.

User rows are created and updated by Clerk's webhook, `POST /api/webhook/clerk` (see
[Clerk](../integrations/clerk.md)), or as offline contacts by `createContact`.

## History

- 2026-11-05: pushes and activity were sent by `/api/push-notification` routes the browser called after each action; now each action writes its activity and sends its pushes itself, because the security fixes removed those routes. See [activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md).
- 2026-11-05: added the hosting build, because the public pages are served from Firebase Hosting first.

## Sources

- `next.config.mjs`
- `proxy.ts`
- `lib/safe-actions.ts`
- `hooks/use-action.ts`
- `utils/api.ts`
- `lib/db.ts`
- `prisma/schema.prisma`
- `lib/notification/notify.ts`
- `lib/onesignal.ts`
- `app/(platform)/(app)/_utils/calculation.ts`
