---
type: Technical Debt
title: Technical debt
description: Known weak spots in the code worth fixing, apart from the security findings.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Technical debt

## Items

- **Android build output is committed** under `packages/android/source/app/build/` and `packages/android/source/.gradle/`
  (over 200 generated files). They belong in `.gitignore`.
- **The schema is pushed on install and build.** `postinstall` and `postbuild` in `package.json` run `prisma db push`,
  which applies the schema straight to the database `DATABASE_URL` names, production included, with no migrations.
- **Reads are written twice.** The `actions/get-*` functions and the `/api/app` routes run the same queries
  (e.g. `actions/get-expenses/index.ts` and `app/api/app/group/[id]/expense/route.ts`).
- **Test code ships with the app:** the `app/(platform)/(app)/webauthn/test/` page (the earlier `test.tsx` page with
  hard-coded user ids is gone); `/api/test(.*)` is a public route in `proxy.ts` though no such
  route exists.
- **The service worker is commented out** (`app/sw.ts`).
- **React warnings in the expense form and activity list.** `PaymentDrawer` puts a `Button` inside vaul's
  `DrawerTrigger` without `asChild`, a button inside a button (`app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`),
  and `ActivityPaginate` renders a list without unique `key`s
  (`app/(platform)/(app)/(screens)/activity/activity-paginate.tsx`).
- **Unused pieces:** the `/api/uploadthing` route and `components/uploadthing/`, `Expense.settlement` and `User.uid`.
- **`useAction` swallows thrown errors.** Its `catch` only clears `loading` (`hooks/use-action.ts`), so an action
  that throws shows nothing to the person.
- **Errors leak details:** route handlers return `error.message` in `500` responses, and the global error page shows
  it (`app/global-error.tsx`).
- **Four moderate advisories remain** (`uuid` and `minimatch` under `exceljs`), and `@grpc/grpc-js` is pinned to `^1.13.6` through `resolutions` in `package.json` because firebase 13.2.0's `@firebase/firestore` still depends on `~1.9.0`, which carries a high advisory; the app doesn't use Firestore. Drop the pin when firebase moves its dependency. CI fails only on high or critical ([CI and deploy](../operations/ci-cd.md)).

## History

- 2026-11-04: dropped "activity depends on a second request" and the unused create-friend push route, and the test page's path, because those routes and `test.tsx` are deleted ([decision](../decisions/activity-and-notifications-in-actions.md)).
- 2026-11-04: added the pinned grpc and remaining moderate advisories, because the CI audit run found them.

## Sources

- `app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`
- `app/(platform)/(app)/(screens)/activity/activity-paginate.tsx`
- `package.json`
- `proxy.ts`
- `hooks/use-action.ts`
- `app/sw.ts`
- `app/global-error.tsx`
- `app/(platform)/(app)/webauthn/test/page.tsx`
- `actions/get-expenses/index.ts`
- `app/api/app/group/[id]/expense/route.ts`
