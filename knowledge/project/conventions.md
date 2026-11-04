---
type: Conventions
title: Conventions
description: How code is written in Splitify: where files go, how they are named, how errors travel, and which tools check style.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Conventions

## Naming

- Files and folders are kebab-case (`expense-card.tsx`, `use-group-users.ts`). Exception: `components/confirm/`
  uses PascalCase (`Confirm.tsx`).
- A server action is a folder `actions/<verb>-<noun>/` with `index.ts` (the `"use server"` handler), `schema.ts`
  (zod) and `types.ts` (`InputType`, `ReturnType`), e.g. `actions/create-group/`. Read-only `get-*` actions have
  only `index.ts`, e.g. `actions/get-group/index.ts`.
- Client data hooks are `hooks/use-<thing>.ts`, e.g. `hooks/use-expenses.ts`.

## Folder layout

- Pages are under `app/` route groups: forms in `app/(platform)/(app)/(forms)/`, screens in
  `app/(platform)/(app)/(screens)/`.
- Components used by one route sit next to its `page.tsx`; ones shared inside the app go in
  `app/(platform)/(app)/_components/`; app-wide ones in `components/`, and shadcn primitives in `components/ui/`.
- Route handlers are `app/api/<area>/.../route.ts`. Global request/response types are ambient in `types/*.d.ts`
  (e.g. `types/api.d.ts`).
- Imports use the `@/` alias for the repository root (`tsconfig.json`).
- Prisma model types and enums come from `@/generated/prisma/browser`, everywhere; only `lib/db.ts` imports
  `@/generated/prisma/client`. The `client` entrypoint is server-only, and files without `"use client"` (stores,
  hooks, `_utils`) are still bundled into client components.
- A `page.tsx` takes `ServerSidePageProp` (Next passes `params` and `searchParams` as promises) and resolves them
  once with `resolvePageProps` from `utils/page.ts`; the components under it take the resolved
  `ServerSideComponentProp` (`types/common.d.ts`).

## Error handling

- Server actions never throw to the client: they return `{ error, debugMessage }` (see
  `actions/create-group/index.ts`), with `getErrorMessage` from `utils/validate.ts`; validation errors come back as
  `fieldErrors` from `createSafeAction` (`lib/safe-actions.ts`).
- Route handlers wrap their body in `try`/`catch` and return `NextResponse.json({ message }, { status })`: `401`
  when `auth()` has no user, `400` for a bad body, `500` otherwise (see `app/api/app/group/[id]/route.ts`).
- The client shows errors with a `sonner` toast in `useAction`'s `onError` (see
  `app/(platform)/(app)/(forms)/friends/add/action.tsx`).

## Tests

- Unit tests are Vitest (`vitest.config.mts`), in a `*.test.ts` file beside the file they cover
  (`actions/create-expense/index.test.ts`), run by `yarn test`.
- Changes are to be tested end to end through the main flows: [decision](../decisions/e2e-main-flows.md).

## Lint and format

- ESLint, configured in `./eslint.config.mjs` (Next's core-web-vitals rules, with two React Compiler rules set to
  warn: [finding](../findings/react-compiler-lint-warnings.md)), run by `eslint .` (Next 16 removed `next lint`).
- Prettier, configured in `./.prettierrc`, ignoring what `./.prettierignore` lists.

## Git

- Commit messages are free-form: none of the last 100 commits is conventional or carries a ticket. Policy:
  `git.message`, `git.ticket`.
- Work branches are named `feat/<topic>` (8 of 9 branch names) and merge into `main` (4 of 4 merges). Policy:
  `git.branch`, `git.base`. Squashing has too little history to say; policy: `git.squash`.

## Commands

- The package manager is yarn (`packageManager` in `package.json`).
- Type-check, lint and format-check commands are in the policy: `checks.commands.typecheck`,
  `checks.commands.lint`, `checks.commands.format-check`. Tests run with `yarn test`
  (`checks.commands.test`); there is no e2e command yet (`checks.commands.e2e`).

## History

- 2026-11-04: said the repository had no tests; now Vitest unit tests sit beside the code and end-to-end tests of the main flows are decided, because tests were added and the testing question was answered. See [e2e of the main flows](../decisions/e2e-main-flows.md).
- 2026-11-04: lint was `next lint` with `.eslintrc.json`; now `eslint .` with `eslint.config.mjs`, because Next 16 removed `next lint`. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `vitest.config.mts`
- `actions/create-expense/index.test.ts`
- `utils/page.ts`
- `types/common.d.ts`
- `lib/db.ts`
- `./eslint.config.mjs`
- `./.prettierrc`
- `./.prettierignore`
- `tsconfig.json`
- `package.json`
- `lib/safe-actions.ts`
- `utils/validate.ts`
- `actions/create-group/index.ts`
- `actions/create-group/types.ts`
- `actions/get-group/index.ts`
- `hooks/use-expenses.ts`
- `types/api.d.ts`
- `app/api/app/group/[id]/route.ts`
- `app/(platform)/(app)/(forms)/friends/add/action.tsx`
