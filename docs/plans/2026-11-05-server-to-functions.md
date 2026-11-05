# Server Pieces to Cloud Functions and a Static-Only Build (Spec 2c) Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:implement-with-subagents by default, or ga:implement. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the server code and its packages, make the static export the only build, and move reports, the WebAuthn lock and account deletion into Cloud Functions.

**Architecture:** The foundation deletes everything server-side that no screen calls since spec 2b, moves the packages the functions need into `functions/`, adds the shared ID-token guard and `callFunction`, the admin operations, the Hosting rewrites, the 404 page and the CSP. Three slices then port the reports, WebAuthn and account deletion into functions from git history (`git show 866468a:<path>`), each with its screen.

**Tech Stack:** Next.js 16 static export (`*.hosting.tsx` entries), React 19, Firebase JS SDK, Firebase SQL Connect (connectors `app`, `admin`, `expense`), Cloud Functions 2nd gen in `functions/` (`onRequest`, `onCall`, `firebase-admin`), exceljs, SimpleWebAuthn 14, iron-session 9, Vitest 5, the Firebase emulators via `npx --yes firebase-tools@15.34.2`, GitHub Actions (existing `ci.yml`, `deploy.yml`).

**Spec:** [docs/specs/2026-11-05-server-to-functions.md](../specs/2026-11-05-server-to-functions.md)

## Global Constraints

- Every function the browser calls verifies the Firebase ID token from `Authorization: Bearer <token>` before reading the body, answering `401 {"message": "Sign in again to continue."}`, and caps the body at 64 KB with `413 {"message": "That request is too large."}`.
- Functions run in `asia-south1`; secrets come from `defineSecret`, never from code or logs; logs carry the operation and the cause class only.
- Old server code is ported from git history at the run's base, `git show 866468a:<path>`; nothing imports a removed package or file.
- `.env.sample` is the developer's to edit: the permission settings deny editing it, so tasks list its changes in their reports instead.
- Never `yarn install` without `--ignore-scripts` until Task 1 rewrites `postinstall`; emulator work in a worktree only through the run's `with-emulator-lock.sh`.

## Checkpoints

None, and the run is unattended (`run.unattended: true`).

---

### Task 1: Foundation: remove the server, one static build, the function guard, rewrites and CSP

**Files:**
- Delete: `actions/` (every file under it)
- Delete: `app/api/` (every file under it)
- Delete: `app/(platform)/(clerk)/` (every file under it)
- Delete: `app/analytics.tsx`, `app/coming-soon/page.hosting.tsx`
- Delete: `lib/db.ts`, `lib/safe-actions.ts`, `lib/logger.ts`, `lib/onesignal.ts`, `lib/notification/`, `lib/clerk-hosting.tsx`, `lib/excel.ts`, `lib/account/`
- Delete: `prisma/`, `prisma.config.ts`, `proxy.ts`, `proxy.test.ts`, `components/uploadthing/`, `hooks/use-action.ts`, `utils/api.ts`, and the old `hooks/use-*.ts` data hooks that call `/api/app` (`use-activities`, `use-expense`, `use-expenses`, `use-group-users`, `use-group`)
- Delete: `lib/auth/membership.ts`, `lib/auth/membership.test.ts`, `lib/auth/session.ts`, `lib/auth/session.test.ts`, `lib/auth/service/` (server-only; Task 3 ports what it needs from history)
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/split-drawer.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/split-drawer.types.ts`
- Modify: `app/(platform)/(app)/(screens)/friends/[id]/shared-groups.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/balances-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list-wrapper.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-summary-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance.tsx`
- Modify: `app/(platform)/(app)/_components/group-card.tsx`
- Modify: `app/(platform)/(app)/_components/user-avatars.tsx`
- Modify: `app/(platform)/(app)/_components/user-card.tsx`
- Modify: `app/(platform)/(app)/_utils/calculation.ts`
- Modify: `app/(platform)/(app)/_utils/expense.ts`
- Modify: `app/(platform)/(app)/webauthn/register/authn-devices.tsx`
- Modify: `components/biometric/biometric.tsx`
- Modify: `components/register-device.tsx`
- Modify: `lib/data/expenses.test.ts`
- Modify: `lib/data/expenses.ts`
- Modify: `lib/data/groups.ts`
- Modify: `lib/data/ledger.test.ts`
- Modify: `lib/data/ledger.ts`
- Modify: `store/activity/index.ts`
- Modify: `store/expense/index.ts`
- Modify: `store/group/index.ts`
- Modify: `types/shared.d.ts`
- Modify: `package.json`, `yarn.lock`
- Modify: `functions/package.json`, `functions/yarn.lock`
- Modify: `next.config.mjs`, `app/layout.tsx`, `components/providers.tsx`
- Create: `app/not-found.hosting.tsx`
- Create: `lib/functions/call.ts`
- Test: `lib/functions/call.test.ts`
- Create: `functions/src/http/guard.ts`
- Test: `functions/src/http/guard.test.ts`
- Create: `dataconnect/admin/server.gql`
- Modify: `firebase.json`
- Modify: `scripts/check-hosting-build.mjs`, `scripts/hosting-pages/public.json`
- Modify: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- Modify: `functions/src/index.ts`
- Create: `functions/src/reports/index.ts`, `functions/src/webauthn/index.ts`, `functions/src/account/delete-my-account.ts` (stubs answering `501` and `unimplemented`, exported from `functions/src/index.ts`, so Tasks 2 to 4 each fill in their own file)

**Interfaces:**
- Consumes: existing `toUserMessage` (`lib/data/errors.ts`), `getFirebaseAuth` (`lib/firebase/app.ts`), the admin connector harness.
- Produces (used by Tasks 2 to 4):

```ts
// lib/functions/call.ts
export function callFunction(path: string, init?: RequestInit): Promise<Response>; // adds Authorization: Bearer <idToken>; throws an Error whose message is toUserMessage's text on a non-2xx

// functions/src/http/guard.ts
export type Guarded = { uid: string; body: unknown };
export function guard(req: import("firebase-functions/v2/https").Request, res: import("express").Response, opts?: { maxBytes?: number }): Promise<Guarded | null>; // null after it has answered 401, 413 or 415
export const MAX_BODY_BYTES = 65536;
```

| Admin operation (`dataconnect/admin/server.gql`) | Variables | Returns |
|---|---|---|
| `IsGroupMember` | `groupId: UUID!, userId: String!` | `groupMember` or null |
| `GetGroupLedgerAdmin` | `groupId: UUID!` | the group's title and every expense with payments and splits and their users' names |
| `AnonymiseUser` | `userId: String!, name: String!, email: String!, imageUrl: String!` | `user_update` |
| `DeleteUserData` | `userId: String!` | deletes the user's push tokens, feedback, devices and friendships |

- Rewrites in `firebase.json`, first: `/api/reports/**` → function `reports` (region `asia-south1`), `/api/webauthn/**` → function `webauthn`. The coming-soon rewrite goes; the page rewrites stay; anything else gets `404.html`.
- `next.config.mjs`: `output: "export"`, `trailingSlash`, `images.unoptimized` and `pageExtensions: ["hosting.tsx"]` always; `NEXT_BUILD_TARGET` is gone. `package.json`: `"build": "next build"`, `"build:hosting": "next build"`, `postinstall` `yarn dataconnect:generate` only, no `postbuild`.
- Packages removed from the root: `@clerk/nextjs`, `@clerk/themes`, `@prisma/adapter-mariadb`, `@prisma/client`, `prisma`, `mariadb`, `uploadthing`, `@uploadthing/react`, `iron-session`, `@simplewebauthn/server`, `axios`, `exceljs`, `@vercel/analytics`, `@vercel/speed-insights`. Added to `functions/`: `exceljs`, `iron-session`, `@simplewebauthn/server`.
- `ci.yml` and `deploy.yml` drop `npx prisma generate` and run `yarn build`.

**Spec:**
- Calling a function: "Every function the browser calls checks the Firebase ID token from `Authorization: Bearer <token>` with the admin"
- Calling a function: "Every request body is at most 64 KB"
- Removing the server: "Packages removed: `@clerk/nextjs`, `@clerk/themes`, `@prisma/adapter-mariadb`, `@prisma/client`, `prisma`,"
- One build: "The coming-soon page and its catch-all rewrite are removed; any unknown path gets a 404 page,"
- Headers: "A `Content-Security-Policy` in `firebase.json`, in flash-cards' form: `default-src 'self'`; scripts from `'self'`,"

**Tags:** `security`, `failure-paths`

**Knowledge:** `project/architecture`: no server; the browser talks to SQL Connect and to Cloud Functions under `/api/`. `apps/splitify`: one static build. `security/auth`: the functions' ID-token guard. `integrations/clerk`, `integrations/uploadthing`, `integrations/vercel-analytics`, `integrations/onesignal`: removed.

**Acceptance:**
- Given `guard` with no `Authorization` header, a malformed one, or a token the admin SDK rejects, then it answers `401 {"message": "Sign in again to continue."}` and returns null, before reading the body.
- Given a valid token and a body of 65,537 bytes, then it answers `413 {"message": "That request is too large."}`; a `text/plain` body answers `415`; a valid JSON body under the cap returns `{ uid, body }` with the token's uid.
- Given `callFunction` with a signed-in user, then it sends `Authorization: Bearer <idToken>`; on a `401` it throws "Sign in again to continue."; on a network failure "Couldn't reach Splitify. Check your connection."
- Given `IsGroupMember` for a member and a non-member, then it returns the row and null; `AnonymiseUser` changes only the four fields; `DeleteUserData` leaves the user's memberships, payments and splits; all four are refused to a signed-in caller.
- Given `grep -rE "@clerk|@prisma|prisma|uploadthing|@vercel|iron-session|@simplewebauthn/server|axios|exceljs|lib/db|safe-actions|actions/" app components hooks lib store utils types`, then it finds nothing (functions/ excepted).
- Given `yarn build`, then it exports the whole site to `out/`, with `out/404.html` showing "We couldn't find that page." and a link to `/groups`; `yarn check:hosting` passes with `public.json` no longer expecting a coming-soon page.
- Given the CSP, then loading `/`, `/sign-in/`, `/groups/` and a group page in the browser against the emulators reports no `securitypolicyviolation` (checked with a listener in the page).
- Given the change, then `yarn tsc --noEmit`, `yarn lint`, `yarn test` and `yarn test:rules` pass, `yarn install --frozen-lockfile` (now safe) and `yarn --cwd functions install --frozen-lockfile` pass, and both workflows validate.

- [x] **Step 1: Write the failing tests** for `guard` and `callFunction` in `functions/src/http/guard.test.ts` and `lib/functions/call.test.ts`, and the admin operations' rules

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test:rules`
Expected: FAIL on the assertions in `guard.test.ts` and the admin operations' cases

- [x] **Step 3: Remove the server code and packages, switch to one build, and add the guard, the client, the operations, the rewrites and the CSP** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn test:rules && yarn build && yarn check:hosting`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git rm -r -q actions app/api "app/(platform)/(clerk)" app/analytics.tsx app/coming-soon/page.hosting.tsx lib/db.ts lib/safe-actions.ts lib/logger.ts lib/onesignal.ts lib/notification lib/clerk-hosting.tsx lib/excel.ts lib/account prisma prisma.config.ts proxy.ts proxy.test.ts components/uploadthing hooks/use-action.ts hooks/use-activities.ts hooks/use-expense.ts hooks/use-expenses.ts hooks/use-group-users.ts hooks/use-group.ts utils/api.ts
git add types/shared.d.ts package.json yarn.lock functions/package.json functions/yarn.lock next.config.mjs app/layout.tsx components/providers.tsx app/not-found.hosting.tsx lib/functions/call.ts lib/functions/call.test.ts functions/src/http/guard.ts functions/src/http/guard.test.ts dataconnect/admin/server.gql firebase.json scripts/check-hosting-build.mjs scripts/hosting-pages/public.json .github/workflows/ci.yml .github/workflows/deploy.yml functions/src/index.ts functions/src/reports/index.ts functions/src/webauthn/index.ts functions/src/account/delete-my-account.ts
git rm -r -q lib/auth/membership.ts lib/auth/membership.test.ts lib/auth/session.ts lib/auth/session.test.ts lib/auth/service
git add "app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/split-drawer.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/split-drawer.types.ts" "app/(platform)/(app)/(screens)/friends/[id]/shared-groups.tsx" "app/(platform)/(app)/(screens)/groups/[id]/balances-list.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list-wrapper.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-summary-list.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance.tsx" "app/(platform)/(app)/_components/group-card.tsx" "app/(platform)/(app)/_components/user-avatars.tsx" "app/(platform)/(app)/_components/user-card.tsx" "app/(platform)/(app)/_utils/calculation.ts" "app/(platform)/(app)/_utils/expense.ts" "app/(platform)/(app)/webauthn/register/authn-devices.tsx" "components/biometric/biometric.tsx" "components/register-device.tsx" "lib/data/expenses.test.ts" "lib/data/expenses.ts" "lib/data/groups.ts" "lib/data/ledger.test.ts" "lib/data/ledger.ts" "store/activity/index.ts" "store/expense/index.ts" "store/group/index.ts"
git commit -m "Remove the server code and its packages, build only the static export, and add the function guard, the Hosting rewrites, the 404 page and the CSP."
```

---

### Task 2: The reports function and the download button

**Files:**
- Modify: `functions/src/reports/index.ts`
- Create: `functions/src/reports/excel.ts`
- Create: `functions/src/reports/csv.ts`
- Create: `functions/src/reports/text.ts`
- Test: `functions/src/reports/reports.test.ts`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/group-details.tsx`

**Interfaces:**
- Consumes: `guard`, `IsGroupMember`, `GetGroupLedgerAdmin` and `callFunction` from Task 1; the old routes at `git show 866468a:app/api/generate/{excel,csv,text}/expense/route.ts` and `git show 866468a:lib/excel.ts`.
- Produces: `reports` (`onRequest`, `asia-south1`) answering `POST /api/reports/expenses`:

| Request | Response | Errors |
|---|---|---|
| `{ groupId: string, format: "excel" \| "csv" \| "text" }` | `200` the file, with the old routes' content type and `Content-Disposition` file name | `401`, `413`, `415` (guard); `400 {"message": "Choose a report format."}` for a bad format or a missing groupId; `404 {"message": "Not found"}` for a missing group or a non-member |

**Spec:**
- Reports: "It reads the group's expenses with their payments and splits through the admin connector and builds the file the"
- Reports: "button comes back, calling it through `callFunction`."

**Tags:** `security`, `failure-paths`

**Knowledge:** `features/reports`: reports are built by the `reports` function from the admin ledger, for members only. `api/generate`: replaced by `POST /api/reports/expenses`.

**Acceptance:**
- Given a member and a group with three expenses, when they ask for `excel`, then the answer is an `.xlsx` workbook whose rows match the old route's for the same expenses; `csv` starts with the old header line; `text` with the group's title.
- Given a non-member, or a group id that doesn't exist, then the answer is `404 {"message": "Not found"}` and no file.
- Given `format: "pdf"`, or no `groupId`, then `400 {"message": "Choose a report format."}`.
- Given no token, then `401`, through the guard.
- Given the group page in the browser against the emulators, then "Download report" shows again and each format downloads; a failure shows the error text in a toast.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `functions/src/reports/reports.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test:rules`
Expected: FAIL on the assertions in `reports.test.ts`

- [x] **Step 3: Port the report builders and write the function and the button** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test:rules`
Expected: PASS, then the browser check of the download

- [x] **Step 5: Commit**

```bash
git add functions/src/reports/index.ts functions/src/reports/excel.ts functions/src/reports/csv.ts functions/src/reports/text.ts functions/src/reports/reports.test.ts "app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx" "app/(platform)/(app)/(screens)/groups/[id]/group-details.tsx"
git commit -m "Build the expense reports in a Cloud Function for members only, and bring back the download button."
```

---

### Task 3: The WebAuthn function and the biometric lock

**Files:**
- Modify: `functions/src/webauthn/index.ts`
- Create: `functions/src/webauthn/session.ts`
- Test: `functions/src/webauthn/webauthn.test.ts`
- Modify: `components/biometric/biometric.tsx`
- Modify: `app/(platform)/(app)/webauthn/register/page.tsx`
- Modify: `app/(platform)/(app)/webauthn/register/authn-actions.tsx`
- Modify: `app/(platform)/(app)/webauthn/register/authn-devices.tsx`
- Modify: `app/(platform)/(app)/webauthn/register/authn-register.tsx`
- Modify: `app/(platform)/(app)/webauthn/test/page.tsx`
- Modify: `app/(platform)/(app)/webauthn/test/authn.tsx`
- Create: `app/(platform)/(app)/webauthn/register/page.hosting.tsx`
- Create: `app/(platform)/(app)/webauthn/test/page.hosting.tsx`
- Create: `scripts/hosting-pages/webauthn.json`

**Interfaces:**
- Consumes: `guard` and `callFunction` from Task 1; existing admin `GetDevices`, `SaveDevices`; the old routes at `git show 866468a:app/api/webauthn/` and `git show 866468a:lib/auth/session.ts`, `lib/auth/service/devices.ts`.
- Produces: `webauthn` (`onRequest`, `asia-south1`) answering, at the same paths as before, `GET /api/webauthn/devices`, `POST /api/webauthn/devices/remove`, `GET /api/webauthn/generate-registration-options`, `POST /api/webauthn/verify-registration`, `GET /api/webauthn/generate-authentication-options`, `POST /api/webauthn/verify-authentication`, each behind `guard`, with secret `SESSION_PASSWORD` and params `AUTHN_RP_ID` (default `splitify.spanion.in`) and `AUTHN_EXPECTED_ORIGIN` (default `https://splitify.spanion.in`).

**Spec:**
- WebAuthn: "The user is the Firebase token's `uid`, never one from the body; devices are read and written through the admin"
- WebAuthn: "`components/biometric/biometric.tsx` and the `/webauthn/register` and `/webauthn/test` pages call it through"

**Tags:** `security`, `failure-paths`

**Knowledge:** `api/webauthn`: the routes are served by the `webauthn` function behind the ID-token guard. `features/biometric-lock`: the lock calls it through `callFunction`.

**Acceptance:**
- Given SimpleWebAuthn's test helpers, when a registration runs (options, then verify), then the device is saved for the token's uid; a body naming another user id is ignored.
- Given a saved device, when an authentication runs, then it verifies and the saved counter increases; a replayed response with the old counter is refused.
- Given a verification with no challenge in the session, then it answers `400` and saves nothing, as the old route did.
- Given no token, then each route answers `401`; given `SESSION_PASSWORD` unset, then the function refuses to start the session and logs the cause class only.
- Given `/webauthn/register` and `/webauthn/test` in the hosting build, then they answer 200 with their screens; in the browser against the emulators the register page lists devices and removing one updates the list.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `functions/src/webauthn/webauthn.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test:rules`
Expected: FAIL on the assertions in `webauthn.test.ts`

- [x] **Step 3: Port the routes into the function and point the lock and pages at it** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test:rules`
Expected: PASS, then the browser check of the register page

- [x] **Step 5: Commit**

```bash
git add functions/src/webauthn/index.ts functions/src/webauthn/session.ts functions/src/webauthn/webauthn.test.ts components/biometric/biometric.tsx "app/(platform)/(app)/webauthn/register/authn-actions.tsx" "app/(platform)/(app)/webauthn/register/authn-devices.tsx" "app/(platform)/(app)/webauthn/register/authn-register.tsx" "app/(platform)/(app)/webauthn/register/page.tsx" "app/(platform)/(app)/webauthn/register/page.hosting.tsx" "app/(platform)/(app)/webauthn/test/authn.tsx" "app/(platform)/(app)/webauthn/test/page.tsx" "app/(platform)/(app)/webauthn/test/page.hosting.tsx" scripts/hosting-pages/webauthn.json
git commit -m "Serve the WebAuthn lock from a Cloud Function behind the ID-token guard, and bring its pages into the hosting build."
```

---

### Task 4: Deleting an account

**Files:**
- Modify: `functions/src/account/delete-my-account.ts`
- Create: `functions/src/account/anonymise.ts`
- Test: `functions/src/account/delete-my-account.test.ts`
- Modify: `app/(platform)/profile/delete-account-action.tsx`
- Modify: `app/(platform)/profile/page.tsx`

**Interfaces:**
- Consumes: `AnonymiseUser` and `DeleteUserData` from Task 1; existing `signOut`; the old rules at `git show 866468a:lib/account/anonymise.ts` and `git show 866468a:actions/delete-account/index.ts`.
- Produces: `deleteMyAccount` (`onCall`, `asia-south1`), no input, returning `{ ok: true }`; refuses an unauthenticated call with `unauthenticated`.

**Spec:**
- Deleting an account: "`deleteMyAccount` (callable, `asia-south1`) anonymises the caller's `User` row as"
- Deleting an account: "`functions/src/account/anonymise.ts` and run through admin mutations in one transaction), deletes their push"

**Tags:** `security`, `failure-paths`

**Knowledge:** `features/profile`: "Delete account" calls `deleteMyAccount`. `decisions/anonymise-deleted-accounts` stays as it is; `apps/functions` names `functions/src/account/` as where it's built.

**Acceptance:**
- Given Alice in a group with Bob and an expense, when she calls `deleteMyAccount`, then her row's name is "Deleted user", her email `<her id>@deleted.invalid` and her image the placeholder (the old rules), her push tokens, feedback and devices are gone, her memberships, payments and splits remain, and her Firebase Auth user no longer exists.
- Given Bob's view of the group afterwards, then the expense shows "Deleted user" where Alice was.
- Given the Auth user delete fails (a forced failure), then the anonymisation stands, the call answers an error, and a second call finishes the job.
- Given an unauthenticated call, then it is refused with `unauthenticated` and nothing changes.
- Given the profile in the browser against the emulators, then "Delete account" asks "Delete your account? Your shared expenses stay, shown as Deleted user. This can't be undone.", and confirming deletes the account, signs out and lands on `/`.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `functions/src/account/delete-my-account.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test:rules`
Expected: FAIL on the assertions in `delete-my-account.test.ts`

- [x] **Step 3: Port the anonymiser and write the callable and the profile's flow** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test:rules`
Expected: PASS, then the browser check of deleting an account

- [x] **Step 5: Commit**

```bash
git add functions/src/account/delete-my-account.ts functions/src/account/anonymise.ts functions/src/account/delete-my-account.test.ts "app/(platform)/profile/delete-account-action.tsx" "app/(platform)/profile/page.tsx"
git commit -m "Delete an account through a callable function that anonymises the person, and wire the profile's button to it."
```
