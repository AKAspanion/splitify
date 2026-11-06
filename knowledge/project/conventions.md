---
type: Conventions
title: Conventions
description: How code is written in Splitify: where files go, how they are named, how errors travel, and which tools check style.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Conventions

## Naming

- Files and folders are kebab-case (`expense-card.tsx`, `use-group-users.ts`). Exception: `components/confirm/`
  uses PascalCase (`Confirm.tsx`).
- Data access is one file per area in `lib/data/` (`groups.ts`, `expenses.ts`, `people.ts`, `activity.ts`,
  `feedback.ts`, `profile.ts`): each exports the TanStack Query hooks (`useMyGroups`, `useCreateGroup`) over the SQL
  Connect SDK, and a write's hook refreshes the affected queries itself ([SQL Connect schema](../data/sql-connect.md)).
  A screen never calls the SDK directly.
- A Cloud Function is a folder under `functions/src/<area>/` with its `index.ts`, tests beside it, and exported from
  `functions/src/index.ts` ([Cloud Functions](../apps/functions.md)).

## Folder layout

- Pages are under `app/` route groups: forms in `app/(platform)/(app)/(forms)/`, screens in
  `app/(platform)/(app)/(screens)/`. Only `*.hosting.tsx` files are routes (`pageExtensions` in `next.config.mjs`).
- A route with an id segment has a `page.hosting.tsx`, a small server wrapper that renders the client `page.tsx` beside
  `generateStaticParams` (the placeholder id `_`); the client page reads the real ids with `useRouteIds`
  (`hooks/use-route-ids.ts`). `firebase.json` rewrites real ids to it ([the web app](../apps/splitify.md)).
- Components used by one route sit next to its `page.tsx`; ones shared inside the app go in
  `app/(platform)/(app)/_components/`; app-wide ones in `components/`, and shadcn primitives in `components/ui/`.
- There are no route handlers, server actions or Prisma types: the app is a static build, and its server side is
  `functions/` and SQL Connect. Types the SQL Connect SDK generates are in `dataconnect/generated/`, and global
  shared types are ambient in `types/*.d.ts`.
- Imports use the `@/` alias for the repository root (`tsconfig.json`).

## Error handling

- A data or function failure reaches the screen as a message a person can read: `toUserMessage` (`lib/data/errors.ts`)
  maps SQL Connect, Auth and function errors, and `callFunction` (`lib/functions/call.ts`) throws an Error carrying
  that message, never the raw text.
- The client shows errors with a `sonner` toast (see `app/(platform)/profile/delete-account-action.tsx`).
- Cloud Functions answer `{ message }` with a status: `401` for a failed sign-in, `400` for a bad request, `500`
  otherwise, and log the error's class only, never its message ([logging](../operations/logging.md)). The shared guard
  is `functions/src/http/guard.ts`.

## Tests

- Unit tests are Vitest (`vitest.config.mts`), in a `*.test.ts` file beside the file they cover
  (`lib/data/expenses.test.ts`, `functions/src/http/guard.test.ts`), run by `pnpm test`.
- A service worker file can't be imported, so `lib/offline/sw-navigation.test.ts` runs `public/sw.js` in a Node `vm` context with fake globals; follow it for worker code ([service worker](../operations/service-worker.md)). Tests that touch IndexedDB use `fake-indexeddb` (`lib/firebase/auth.test.ts`).
- SQL Connect rule tests sit beside their `.gql` file under `dataconnect/` and run on the emulators with `pnpm test:rules`, not in `pnpm test` ([run locally](../operations/run-locally.md)).
- End-to-end tests are Playwright specs in `tests/e2e/*.spec.ts`, run by `pnpm test:e2e` against the emulators
  (`playwright.config.ts`); Vitest excludes them. Changes are tested through the main flows:
  [decision](../decisions/e2e-main-flows.md), [the runner](../decisions/e2e-playwright-main-flow.md).

## Lint and format

- ESLint, configured in `./eslint.config.mjs` (Next's core-web-vitals rules at the preset's level; the React Compiler
  rules were once set to warn, [finding](../findings/react-compiler-lint-warnings.md)), run by `eslint .` (Next 16
  removed `next lint`).
- Prettier, configured in `./.prettierrc`, ignoring what `./.prettierignore` lists: prose (`knowledge/`, `docs/`),
  lockfiles, `pnpm-workspace.yaml` and generated files. The check is `pnpm prettier --check .`, and CI runs it.

## Git

- Commit messages are free-form: none of the last 100 commits is conventional or carries a ticket. Policy:
  `git.message`, `git.ticket`.
- Work branches are named `feat/<topic>` (8 of 9 branch names) and merge into `main` (4 of 4 merges). Policy:
  `git.branch`, `git.base`. Squashing has too little history to say; policy: `git.squash`.

## Commands

- The package manager is pnpm (`packageManager` in `package.json`); `functions/` is its own pnpm package with its own lockfile.
- Type-check, lint and format-check commands are in the policy: `checks.commands.typecheck`,
  `checks.commands.lint`, `checks.commands.format-check`. Tests run with `pnpm test`
  (`checks.commands.test`) and end-to-end tests with `pnpm test:e2e` (`checks.commands.e2e`).

## History

- 2026-11-06: ESLint had two React Compiler rules at warn, Prettier was not in CI and there was no e2e command; now the rules are at the preset's level, the format check runs in CI over everything but prose and generated files, and e2e is `pnpm test:e2e`, because the repository-modernization run fixed the warnings and added Playwright. See [the runner](../decisions/e2e-playwright-main-flow.md).
- 2026-11-05: the package manager was yarn and the commands `yarn test` and `yarn test:rules`; now pnpm, because the repository moved to pnpm 11.
- 2026-11-05: did not say how a service worker or IndexedDB is tested; now the `vm` harness and `fake-indexeddb`, because the offline feature added both.
- 2026-11-05: described server actions (`createSafeAction`, `{ error, debugMessage }`), route handlers, `@/generated/prisma` types and `resolvePageProps`; now `lib/data/` hooks, Cloud Functions with the guard, `page.hosting.tsx` wrappers and `toUserMessage`, because spec 2c removed the server.
- 2026-11-04: added the SQL Connect rule tests and `yarn test:rules`, because the schema's rules are tested apart from `yarn test`.
- 2026-11-04: said the repository had no tests; now Vitest unit tests sit beside the code and end-to-end tests of the main flows are decided, because tests were added and the testing question was answered. See [e2e of the main flows](../decisions/e2e-main-flows.md).
- 2026-11-04: lint was `next lint` with `.eslintrc.json`; now `eslint .` with `eslint.config.mjs`, because Next 16 removed `next lint`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `vitest.config.mts`
- `vitest.rules.config.mts`
- `lib/data/expenses.test.ts`
- `functions/src/http/guard.test.ts`
- `lib/data/groups.ts`
- `lib/data/errors.ts`
- `lib/functions/call.ts`
- `functions/src/http/guard.ts`
- `functions/src/index.ts`
- `hooks/use-route-ids.ts`
- `app/(platform)/(app)/(screens)/groups/[id]/page.hosting.tsx`
- `types/common.d.ts`
- `./eslint.config.mjs`
- `./.prettierrc`
- `./.prettierignore`
- `playwright.config.ts`
- `tsconfig.json`
- `package.json`
- `app/(platform)/profile/delete-account-action.tsx`
- `lib/firebase/auth.test.ts`
- `lib/offline/sw-navigation.test.ts`
- `public/sw.js`
