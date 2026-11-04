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
- **Activity depends on a second request.** Activity rows are written by the push-notification routes the browser
  calls after an action succeeds; if that call fails or the tab closes, the change has no activity entry
  ([question](../questions/activity-recording-location.md)).
- **Reads are written twice.** The `actions/get-*` functions and the `/api/app` routes run the same queries
  (e.g. `actions/get-expenses/index.ts` and `app/api/app/group/[id]/expense/route.ts`).
- **Test code ships with the app:** `app/(platform)/(app)/test.tsx` (hard-coded user ids and a test notification) and
  the `app/(platform)/(app)/webauthn/test/` page; `/api/test(.*)` is a public route in `middleware.ts` though no such
  route exists.
- **The service worker is commented out** (`app/sw.ts`).
- **Unused pieces:** the `/api/uploadthing` route and `components/uploadthing/`, `POST /api/push-notification/create-friend`,
  `Expense.settlement` and `User.uid`.
- **`useAction` swallows thrown errors.** Its `catch` only clears `loading` (`hooks/use-action.ts`), so an action
  that throws shows nothing to the person.
- **Errors leak details:** route handlers return `error.message` in `500` responses, and the global error page shows
  it (`app/global-error.tsx`).

## Sources

- `package.json`
- `middleware.ts`
- `hooks/use-action.ts`
- `app/sw.ts`
- `app/global-error.tsx`
- `app/(platform)/(app)/test.tsx`
- `actions/get-expenses/index.ts`
- `app/api/app/group/[id]/expense/route.ts`
