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

- **Test code ships with the app:** the `app/(platform)/(app)/webauthn/test/` page, with hard-coded checks for trying the
  biometric lock.
- **The service worker is commented out** (`app/sw.ts`).
- **A React warning in the expense form.** `PaymentDrawer` puts a `Button` inside vaul's `DrawerTrigger` without
  `asChild`, a button inside a button (`app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`).
- **The global error page shows the error's message** (`app/global-error.tsx`).
- **Moderate advisories under `exceljs`** (`uuid` and `minimatch`, now in `functions/`, whose `resolutions` pin the
  `minimatch` ones), and `@grpc/grpc-js` is pinned to `^1.13.6` through `resolutions` in `package.json` because firebase
  13.2.0's `@firebase/firestore` still depends on `~1.9.0`, which carries a high advisory; the app doesn't use
  Firestore. Drop the pin when firebase moves its dependency. CI fails only on high or critical
  ([CI and deploy](../operations/ci-cd.md)).
- **`docker-compose.yml` still starts MySQL** though nothing uses a database of that kind now; it can go.
- **`.env.sample` lists removed keys** until the developer edits it ([environment](../operations/environment.md)).

## History

- 2026-11-05: dropped the schema push on install, the doubled reads, the unused UploadThing route and `Expense.settlement`, the `useAction` and route-handler error items, the activity list's missing keys and the committed Android build output; added leftover MySQL compose file and `.env.sample`, because spec 2c removed the server, Prisma and those files, and the Android build output is no longer tracked.
- 2026-11-04: dropped "activity depends on a second request" and the unused create-friend push route, and the test page's path, because those routes and `test.tsx` are deleted ([decision](../decisions/activity-and-notifications-in-actions.md)).
- 2026-11-04: added the pinned grpc and remaining moderate advisories, because the CI audit run found them.

## Sources

- `app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`
- `package.json`
- `functions/package.json`
- `docker-compose.yml`
- `app/sw.ts`
- `app/global-error.tsx`
- `app/(platform)/(app)/webauthn/test/page.tsx`
