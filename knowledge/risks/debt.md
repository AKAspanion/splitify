---
type: Technical Debt
title: Technical debt
description: Known weak spots in the code worth fixing, apart from the security findings.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Technical debt

## Items

- **`@grpc/grpc-js` is pinned to `^1.13.6`** through `overrides` in `pnpm-workspace.yaml` because firebase 13.2.0's
  `@firebase/firestore` still depends on `~1.9.0`, which carries a high advisory; the app doesn't use Firestore. Drop
  the pin when firebase moves its dependency.
- **Other advisories are closed by scoped overrides, not by upgrades.** `minimatch`, `glob`, `uuid` and
  `@opentelemetry/core` (the last for `@google-cloud/pubsub`) have no patched release on the major their dependents ask
  for, so `pnpm-workspace.yaml` overrides each only inside the vulnerable range. Remove an override when its dependents
  move to a patched release. CI fails on moderate and above ([CI and deploy](../operations/ci-cd.md)).
- **`.env.sample` lists removed keys** until the developer edits it ([environment](../operations/environment.md)).

## History

- 2026-11-06: dropped the shipped WebAuthn test page, the commented-out service worker, the nested button in the payment drawer, the global error page showing the error's message, the leftover `docker-compose.yml`, and the moderate advisories under `exceljs`; the pin note moved from `resolutions` to `overrides`, because the repository modernisation fixed or deleted each and added scoped overrides for the rest.
- 2026-11-05: dropped the schema push on install, the doubled reads, the unused UploadThing route and `Expense.settlement`, the `useAction` and route-handler error items, the activity list's missing keys and the committed Android build output; added leftover MySQL compose file and `.env.sample`, because spec 2c removed the server, Prisma and those files, and the Android build output is no longer tracked.
- 2026-11-04: dropped "activity depends on a second request" and the unused create-friend push route, and the test page's path, because those routes and `test.tsx` are deleted ([decision](../decisions/activity-and-notifications-in-actions.md)).
- 2026-11-04: added the pinned grpc and remaining moderate advisories, because the CI audit run found them.

## Sources

- `pnpm-workspace.yaml`
- `package.json`
- `functions/package.json`
- `.env.sample`
