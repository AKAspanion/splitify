# Repo Modernization and Security Implementation Plan

**Status:** complete, commits f2d5db0..1710d2c, 2026-11-06. Record: [2026-11-05-repo-modernization.record.md](2026-11-05-repo-modernization.record.md).

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:feature-build-team by default, or ga:feature-build. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

Plan, then build; tests with each task. Say 'test-first' or 'spec it first' to work that way.

**Goal:** Close every open Dependabot alert, bring tooling to its newest compatible release, make CI check formatting, secrets, dependency changes and the main flow end to end, fix the open bugs and findings, and fix what the 2026-11-05 full-repo security audit found.

**Architecture:** One foundation task changes every manifest, lockfile, root config and workflow: the dependency overrides, the firebase-tools pin, Playwright, Prettier's ignore list, the one-time format and the CI/CD changes. Four slices then build on it without touching each other's files: app bug fixes, web and iOS security, data and functions security, and the end-to-end harness.

**Tech Stack:** Next.js 16 static export on Firebase Hosting, Firebase SQL Connect (`dataconnect/`, rule tests with `pnpm test:rules`), Cloud Functions (Node 24, `functions/` with its own pnpm lockfile), pnpm 11, Vitest, ESLint 10, Prettier 3, GitHub Actions (`.github/workflows/ci.yml`, `deploy.yml`, `codeql.yml`), Dependabot, and the iOS WebView wrapper in Swift (`packages/ios`).

**Spec:** none. This is a maintenance and security sweep. Each task cites the alert, finding or decision it closes, and links the decisions taken for it.

## Global Constraints

- Node stays on 24 everywhere ([decision](../../knowledge/decisions/stay-on-node-24.md)), and `@types/node` with it.
- TypeScript stays on 6.0: `typescript-eslint` 8.72.1 still declares `typescript >=4.8.4 <6.1.0` ([decision](../../knowledge/decisions/upgrade-all-dependencies.md)).
- Cloud Functions keep deploying by hand (`pnpm deploy:functions`); the deploy workflow doesn't deploy them ([decision](../../knowledge/decisions/ci-cd-functions-deployed-by-hand.md)).
- No task reads, prints or edits a `.env*` file. Agents are denied them. `.env.sample` edits are the developer's, listed at the finish.
- Every GitHub Action is pinned to a full commit SHA with its version in a trailing comment. Workflow `permissions:` default to `contents: read`.
- A changed `.gql` operation is regenerated with `pnpm dataconnect:generate` (the SDK in `dataconnect/generated/` is gitignored), and its rule test sits beside it.

## Checkpoints

None (`run.checkpoints: none`, unattended). Each security task's summary goes to the ledger.

## Deferred (recorded, not fixed here)

- [Finding: add to group without consent](../../knowledge/findings/add-to-group-without-consent.md). The developer chose to keep it and build invite-and-accept as its own feature.
- Audit Low 4: the WebAuthn challenge isn't bound to its purpose or uid, and `/devices/remove` needs no WebAuthn proof. Acceptable because the biometric lock is a convenience lock; the knowledge job records that on `features/biometric-lock`.
- Audit Low 7, avatar URLs as a tracking channel, and Low 8, push-token re-registration: minor, recorded in the ledger.

---

### Task 1: Dependencies, formatting and CI/CD (foundation)

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- Modify: `functions/package.json`, `functions/pnpm-lock.yaml`, `functions/pnpm-workspace.yaml`
- Modify: `.prettierignore`
- Delete: `docker-compose.yml`
- Modify: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/dependabot.yml`
- Create: `.github/workflows/secrets-scan.yml`
- Modify: `README.md` (CI and deploy section)
- Modify (format only): each code file `pnpm prettier --check .` lists once `.prettierignore` is updated (today `functions/` ×3, `components/` ×1, `.mcp.json`, `.claude/` ×1; the two `.github/` files are already listed above)

**Interfaces:**
- Produces: `package.json` script `test:e2e` = `playwright test` (Task 5)
- Produces: `@playwright/test` as a root devDependency (Task 5)
- Produces: script `ngrok`, reading `$NGROK_DOMAIN` and refusing an empty one
- Produces: firebase-tools pinned at `15.35.0` in `package.json` and both strings in `deploy.yml`

**Spec:**
- Dependabot alerts 201–207: minimatch `>= 7.0.0, < 11.0.1` (patched `11.0.1`), uuid `< 11.1.1` (patched `11.1.1`), glob `>= 9.0.0, <= 14.0.1` (patched `14.0.2`), in `pnpm-lock.yaml` and `functions/pnpm-lock.yaml`.
- [Debt](../../knowledge/risks/debt.md): "`docker-compose.yml` still starts MySQL though nothing uses a database of that kind now; it can go."
- [Decision](../../knowledge/decisions/e2e-playwright-main-flow.md): "CI runs the e2e tests on every pull request."

**Tags:** security (workflow permissions, secret scanning, credential moved out of a script)

**Knowledge:**
- `risks/debt`: the moderate advisories are closed by scoped pnpm overrides, and `docker-compose.yml` is gone
- `operations/ci-cd`: pull requests run format check, lint, typecheck, unit, rules and e2e tests, a dependency review and a secret scan; audits fail on moderate and above; firebase-tools is pinned at `15.35.0`
- `findings/sql-connect-triggers-not-run-locally`: re-checked against firebase-tools `15.35.0`'s `functionsEmulator.js`
- `project/conventions`: Prettier ignores `knowledge/`, `docs/`, lockfiles and generated files
- `operations/run-locally`: `pnpm ngrok` reads `NGROK_DOMAIN`

**Acceptance:**
- Given both workspaces installed, when `pnpm audit` and `pnpm --dir functions audit` run with no `--audit-level`, then each reports no known vulnerabilities.
- Given the overrides, when `pnpm why minimatch`, `pnpm why uuid` and `pnpm --dir functions why glob` run, then no installed version falls in a vulnerable range above, and packages on minimatch 3 or 5 keep their major.
- Given the root manifest, when `pnpm outdated` runs, then only `typescript` and `@types/node` are listed.
- Given the new ignore list, when `pnpm prettier --check .` runs, then it exits 0, and `knowledge/`, `docs/`, both lockfiles, `public/sw-manifest.js` and `dataconnect/generated/` are ignored.
- Given `pnpm ngrok` with `NGROK_DOMAIN` unset, when it runs, then it exits non-zero, saying `NGROK_DOMAIN` is required, and the old ngrok domain appears in no tracked file.
- Given a pull request, when CI runs, then `pnpm prettier --check .` runs before lint, and both audit steps use `--audit-level moderate`.
- Given a pull request adding a dependency with a moderate or worse advisory, when the `dependency-review` job (`actions/dependency-review-action`, `fail-on-severity: moderate`) runs, then it fails.
- Given a commit containing a verified credential, when `secrets-scan.yml` runs (on pull requests, on pushes to `main`, and weekly over the full history), then it fails. The scanner is pinned by SHA and needs no paid licence.
- Given a pull request, when the `e2e` job runs, then it installs Chromium (`pnpm exec playwright install --with-deps chromium`), runs `pnpm test:e2e`, uploads `playwright-report/` as an artifact on failure, and reads no repository secret.
- Given `dependabot.yml`, then it covers `gradle` at `/packages/android/source`, and the stale `prisma` ignore is gone.
- Given every workflow, then no job uses `pull_request_target`, every `uses:` is SHA-pinned, and each job's `permissions` is the least it needs.
- Given the change, when `pnpm test` and `pnpm functions:build` run, then both pass.

- [x] **Step 1: Add pnpm `overrides`** for minimatch, uuid and glob, scoped to the vulnerable ranges, in `pnpm-workspace.yaml` and `functions/pnpm-workspace.yaml`. Drop `functions/`' minimatch pins where the range override covers them.
- [x] **Step 2: Edit `package.json`**: firebase-tools `15.35.0`, `@playwright/test` (latest), the `test:e2e` script, and `ngrok` reading `$NGROK_DOMAIN` through a guard
- [x] **Step 3: Reinstall both workspaces** (`pnpm install`, then `pnpm --dir functions install`), and run the audits and `why` checks

Run: `pnpm audit && pnpm --dir functions audit`
Expected: no vulnerabilities in either

- [x] **Step 4: Update `.prettierignore`**, delete `docker-compose.yml`, and run `pnpm prettier --write` on exactly the files `--check` lists
- [x] **Step 5: Edit the workflows and `dependabot.yml`**, create `secrets-scan.yml`, and update the README's CI section
- [x] **Step 6: Validate the workflows**

Run: `pnpm dlx @action-validator/cli .github/workflows/ci.yml` (and for each workflow changed), or a YAML parse of each if that tool can't run
Expected: no errors

- [x] **Step 7: Run the acceptance commands**

Run: `pnpm prettier --check . && pnpm test && pnpm functions:build`
Expected: PASS

- [x] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml functions/package.json functions/pnpm-lock.yaml functions/pnpm-workspace.yaml .prettierignore docker-compose.yml .github/workflows/ci.yml .github/workflows/deploy.yml .github/workflows/secrets-scan.yml .github/dependabot.yml README.md
git commit -m "Close the open Dependabot alerts, raise firebase-tools to 15.35.0, make Prettier check only code, and check formatting, dependency changes, secrets and the main flow on every pull request."
```

(Also stage, by name, each file the format step rewrote.)

---

### Task 2: App bug fixes and debt

**Files:**
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`
- Modify: `app/global-error.tsx`
- Delete: `app/(platform)/(app)/webauthn/test/page.hosting.tsx`, `app/(platform)/(app)/webauthn/test/page.tsx`, `app/(platform)/(app)/webauthn/test/authn.tsx`, `app/(platform)/(app)/webauthn/test/authn.css`
- Delete: `app/sw.ts`
- Modify: `next.config.mjs` (drop the `img.clerk.com` and `images.clerk.dev` remote patterns)
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`, `app/(platform)/profile/notification-action.tsx`, `components/biometric/biometric.tsx`, `components/scroll-to.tsx`
- Test: `app/global-error.test.tsx`, `app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.test.tsx`, `app/(platform)/(app)/(forms)/expense/add/(form)/form.test.tsx`

**Interfaces:**
- Consumes: none from other tasks (existing code; waits for Task 1 only for the format pass)

**Spec:**
- [Debt](../../knowledge/risks/debt.md): "`PaymentDrawer` puts a `Button` inside vaul's `DrawerTrigger` without `asChild`, a button inside a button"; "The global error page shows the error's message"; "Test code ships with the app"; "The service worker is commented out (`app/sw.ts`)".
- [Finding](../../knowledge/findings/react-compiler-lint-warnings.md): `form.tsx`, `notification-action.tsx`, `biometric.tsx` and `scroll-to.tsx` are four of its six components. Task 3 fixes the other two and restores the rules.

**Tags:** security, failure-paths (removes a shipped WebAuthn test page; stops showing raw error text)

**Knowledge:**
- `risks/debt`: the nested button, the error text on the global error page, the shipped WebAuthn test page and `app/sw.ts` are gone, and so are the Clerk image hosts

**Acceptance:**
- Given the expense form, when the payment drawer renders, then no `button` is inside another `button`. Clicking the trigger opens the drawer; with `disabled`, it doesn't.
- Given a render error with message `"secret detail"` and digest `"abc123"`, when `global-error` renders, then it says "Something went wrong.", shows `abc123`, has a Try again button that calls `reset`, and `"secret detail"` appears nowhere.
- Given `pnpm build`, then `out/` has no `webauthn/test` page.
- Given the expense form, when `users` changes, then the equal split resets to the new users as before, with no synchronous `setState` inside an effect (derived state, or a `key` reset).
- Given notification-action on mount, and biometric on a path change, then each behaves as before, with no synchronous `setState` in an effect.
- Given `scrollTo`, then `performance.now()` runs only inside the animation callback.
- Given these four component files, when `pnpm eslint` runs on them with `react-hooks/set-state-in-effect` and `react-hooks/purity` at `error` (`--rule`), then neither rule reports.

- [x] **Step 1: Write the failing tests** for the drawer, global error and expense-form reset cases
- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run app/global-error.test.tsx "app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.test.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/form.test.tsx"`
Expected: FAIL on the assertions

- [x] **Step 3: Make the fixes**, delete the test page and `app/sw.ts`, and edit `next.config.mjs`
- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run app/global-error.test.tsx "app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.test.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/form.test.tsx"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.test.tsx" app/global-error.tsx app/global-error.test.tsx "app/(platform)/(app)/webauthn/test/page.hosting.tsx" "app/(platform)/(app)/webauthn/test/page.tsx" "app/(platform)/(app)/webauthn/test/authn.tsx" "app/(platform)/(app)/webauthn/test/authn.css" app/sw.ts next.config.mjs "app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/form.test.tsx" "app/(platform)/profile/notification-action.tsx" components/biometric/biometric.tsx components/scroll-to.tsx
git commit -m "Fix the nested button in the payment drawer, hide error details on the global error page, remove the shipped WebAuthn test page and dead files, and clear the React Compiler warnings in four components."
```

---

### Task 3: Web and iOS security

**Files:**
- Modify: `lib/firebase/auth.ts`, `lib/firebase/auth.test.ts`
- Modify: `app/(platform)/(auth)/sign-in/sign-in-form.tsx`, `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- Modify: `eslint.config.mjs`
- Modify: `firebase.emulators.json`, `firebase.json` (HSTS header only), `lib/security/csp.test.ts`
- Modify: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/edit-contact.tsx`, `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/form.tsx`, `app/(platform)/(app)/(forms)/friends/add/page.tsx`, `app/(platform)/(app)/(forms)/friends/add/search.tsx`, `components/container/header.tsx`
- Test: `components/container/header.test.tsx`
- Modify: `app/layout.tsx`, `app/adsense.tsx`, and the layout or page file under `app/(landing)/` and `app/(platform)/privacy/` that now renders `<Adsense />`
- Modify: `packages/ios/src/Splitify/SceneDelegate.swift`, `packages/ios/src/Splitify/WebView.swift`, `packages/ios/src/Splitify/Info.plist`

**Interfaces:**
- Consumes: existing `safeNextPath(path: string | null | undefined): string` from `lib/auth/next-path.ts`
- Produces: `completeGoogleSignIn` still rejects with `UpsertMe`'s error. When sign-out then fails too, it clears Firebase Auth's persisted state before rejecting, so no signed-in user survives the next load.

**Spec:**
- [Finding](../../knowledge/findings/google-sign-in-signout-failure-keeps-session.md): "If that sign-out rejects too (a local IndexedDB failure), it only logs a warning and rethrows `UpsertMe`'s error. The Firebase session stays".
- [Finding](../../knowledge/findings/emulator-csp-blocks-auth-iframe.md): "`firebase.emulators.json` … has neither `'self'` nor the Auth emulator's origin in its `frame-src`".
- [Decision](../../knowledge/decisions/adsense-on-public-pages-only.md): "The ad script loads only on the public pages, the landing page and the privacy page."
- Audit Medium 1: `?back=https://evil.example` on `/friends/<id>/edit/contact/` sends the person off-site after a save, or from the header's back link.
- Audit Low 2 and 3: iOS `evaluateJavaScript("location.href = '\(url)'")`; host checks by substring; `Info.plist` app-bound domains list `splitify.spanion.in/groups` and `account.google.com`; `NSAllowsArbitraryLoads` is true.
- Audit Low 9: `firebase.json` sends no `Strict-Transport-Security`.

**Tags:** security, failure-paths

**Knowledge:**
- `findings/google-sign-in-signout-failure-keeps-session`: Fixed
- `findings/emulator-csp-blocks-auth-iframe`: Fixed
- `findings/react-compiler-lint-warnings`: Fixed in all six components (four by Task 2), with both rules back at the preset's level
- `findings/committed-firebase-config`: Fixed. The plist is untracked ([decision](../../knowledge/decisions/untrack-ios-firebase-config.md)), but its key stays in git history, so restrict it to the iOS bundle id in Google Cloud.
- `integrations/google-adsense`: the script loads on the landing and privacy pages only
- `security/data-protection`: `back` links pass through `safeNextPath`; HSTS is sent; the iOS wrapper matches hosts exactly and allows no arbitrary loads
- `apps/ios`: deep links load with `URLRequest`; the app-bound domains are `splitify.spanion.in` and `accounts.google.com`

**Acceptance:**
- Given `UpsertMe` rejects and `signOut` rejects, when `completeGoogleSignIn` runs, then it rejects with `UpsertMe`'s error, Firebase Auth's persisted user is cleared, and the sign-in form shows the error and stays on `/sign-in/`.
- Given `UpsertMe` rejects and `signOut` succeeds, then behaviour is unchanged (the existing tests still pass).
- Given the sign-in and sign-up forms finishing a Google redirect, then `pending` comes from a lazy initial state or an external store, not a synchronous `setState` in the mount effect.
- Given `eslint.config.mjs`, then neither `react-hooks/set-state-in-effect` nor `react-hooks/purity` is overridden.
- Given `firebase.emulators.json`, then its CSP `frame-src` holds `'self'` and `http://127.0.0.1:<auth emulator port from firebase.json>`, each its own token, checked in `lib/security/csp.test.ts`.
- Given `firebase.json`, then every path sends `Strict-Transport-Security: max-age=63072000; includeSubDomains`, checked in `lib/security/csp.test.ts`.
- Given `back=https://evil.example`, `back=//evil.example` or `back=javascript:alert(1)`, when the edit-contact page saves or the header's back link renders, then the target is `/friends/<id>/`. A same-site `back=/groups/abc/` is kept.
- Given a signed-in page such as `/groups/`, then no `adsbygoogle.js` script is in the page. Given `/` and `/privacy/` with a publisher id set, then it is.
- Given the iOS sources, then no `evaluateJavaScript` call interpolates a URL; host checks compare `url.host` exactly (or as a `.splitify.spanion.in` suffix); `NSAllowsArbitraryLoads` is absent or false; and `WKAppBoundDomains` lists `splitify.spanion.in` and `accounts.google.com`. These are checked by reading the code: there is no iOS test target.

- [x] **Step 1: Write the failing tests** for the sign-in, CSP and HSTS, and header `back` cases
- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run lib/firebase/auth.test.ts lib/security/csp.test.ts components/container/header.test.tsx`
Expected: FAIL on the assertions

- [x] **Step 3: Implement the web fixes**: sign-in, the forms, ESLint, both Firebase configs, `back`, AdSense
- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run lib/firebase/auth.test.ts lib/security/csp.test.ts components/container/header.test.tsx`
Expected: PASS

- [x] **Step 5: Make the iOS fixes**, and check each Acceptance line against the Swift and plist
- [x] **Step 6: Commit**

```bash
git add lib/firebase/auth.ts lib/firebase/auth.test.ts "app/(platform)/(auth)/sign-in/sign-in-form.tsx" "app/(platform)/(auth)/sign-up/sign-up-form.tsx" eslint.config.mjs firebase.emulators.json firebase.json lib/security/csp.test.ts "app/(platform)/(app)/(forms)/friends/[id]/edit/contact/edit-contact.tsx" "app/(platform)/(app)/(forms)/friends/[id]/edit/contact/form.tsx" "app/(platform)/(app)/(forms)/friends/add/page.tsx" "app/(platform)/(app)/(forms)/friends/add/search.tsx" components/container/header.tsx components/container/header.test.tsx app/layout.tsx app/adsense.tsx packages/ios/src/Splitify/SceneDelegate.swift packages/ios/src/Splitify/WebView.swift packages/ios/src/Splitify/Info.plist
git commit -m "Clear the Auth session when a failed Google sign-in can't sign out, refuse off-site back links, load ads only on public pages, send HSTS, and harden the iOS wrapper's URL handling."
```

(Also stage, by name, the landing and privacy layout or page files that now render the ad script.)

---

### Task 4: Data and Cloud Functions security

**Files:**
- Modify: `dataconnect/app/people.gql`, `dataconnect/app/people.test.ts`
- Modify: `dataconnect/app/expenses.gql`, `dataconnect/app/expenses.test.ts`
- Modify: `dataconnect/app/groups.gql`, `dataconnect/app/groups.test.ts`
- Modify: `dataconnect/app/activity.gql`, `dataconnect/app/activity.test.ts`
- Modify: `functions/src/reports/csv.ts`, `functions/src/reports/reports.test.ts`
- Modify: `functions/src/account/delete-my-account.ts`, `functions/src/account/delete-my-account.test.ts`
- Modify: `functions/src/index.ts` (global `maxInstances`)

**Interfaces:**
- Consumes: none from other tasks (existing operations and functions)
- Produces: unchanged operation names and variables, so `lib/data/*` and the generated SDK keep their signatures. Only the `@auth` and `@check` expressions tighten.

**Spec:**
- [Decision](../../knowledge/decisions/contacts-editable-only-by-their-friends.md): "`AddFriend` refuses a target with `signedUp == false` unless the caller already has a `Friendship` with it." "`UpdateContact` refuses an email that another `User` row already has, as `CreateContact` does."
- Audit Low 1: `functions/src/reports/csv.ts` exports a description such as `=HYPERLINK(...)` unescaped.
- Audit Low 5: `deleteMyAccount` has no recent-login check, and doesn't revoke refresh tokens.
- Audit Low 6: `ListGroupExpenses` has no bound on `$search` or `$limit`; `ListFriends` and `ListMyActivity` have no `$limit` cap; `type` and `category` are unbounded on `CreateGroup`, `UpdateGroup` and `CreateExpense`; no HTTP function sets `maxInstances`.

**Tags:** security, failure-paths

**Knowledge:**
- `features/friends-and-contacts`: another person's offline contact can't be added as a friend, and a contact can't take an email already in use
- `security/roles`: the AddFriend and UpdateContact rules, and the input bounds
- `features/reports`: CSV cells that start with `=`, `+`, `-`, `@`, a tab or a carriage return are prefixed with `'`
- `features/profile`: account deletion needs a sign-in within the last `5` minutes and revokes refresh tokens
- `apps/functions`: the global `maxInstances`

**Acceptance:**
- Given Mallory shares a group with Bob's offline contact Mom and isn't Mom's friend, when Mallory runs `AddFriend(Mom)`, with or without a group, then it fails "Not found", and no Friendship or GroupMember row is written.
- Given Bob, Mom's creator and friend, when he runs `AddFriend(Mom)` again, then it succeeds as before.
- Given a signed-up user Carol, when anyone runs `AddFriend(Carol)`, then it succeeds as before.
- Given Bob, when he runs `UpdateContact(Mom, email = Carol's email)`, then it fails "That email is already in use" and Mom's email is unchanged. Given a free email, then it updates.
- Given the full takeover sequence from the decision (AddFriend, then UpdateContact to the attacker's email, then UpsertMe), then the first step fails, and Mom's memberships stay on Mom.
- Given `ListGroupExpenses` with `$limit` `101` or a `$search` of `101` characters, then it's refused; with `$limit` `100` and a `100`-character search, it runs. Given `ListFriends` or `ListMyActivity` with `$limit` `101`, it's refused.
- Given `CreateGroup`, `UpdateGroup` or `CreateExpense` with a `type` or `category` over `50` characters, then it's refused.
- Given a CSV report row whose description is `=HYPERLINK("http://x")`, `+1`, `-1`, `@SUM(A1)`, or starts with a tab or carriage return, then the cell is written with a leading `'`. `Dinner` is unchanged.
- Given `deleteMyAccount` with an ID token whose `auth_time` is older than `300` seconds, then it answers `401 { message: "Sign in again to delete your account." }` and deletes nothing. Given a fresh token, then it deletes as before and calls `revokeRefreshTokens(uid)`.
- Given `functions/src/index.ts`, then the global options set `maxInstances` to `10`, and the kill switch keeps its own `1` (its test still passes).

- [x] **Step 1: Write the failing rule tests** in the four `*.test.ts` beside the `.gql` files, and the function tests for CSV and account deletion
- [x] **Step 2: Run them to verify they fail**

Run: `pnpm test:rules` and `pnpm vitest run functions/src/reports/reports.test.ts functions/src/account/delete-my-account.test.ts`
Expected: FAIL on the assertions

- [x] **Step 3: Tighten the operations**, run `pnpm dataconnect:generate`, and change the two functions and the global options
- [x] **Step 4: Run them to verify they pass**

Run: `pnpm test:rules` and `pnpm vitest run functions/src/reports/reports.test.ts functions/src/account/delete-my-account.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add dataconnect/app/people.gql dataconnect/app/people.test.ts dataconnect/app/expenses.gql dataconnect/app/expenses.test.ts dataconnect/app/groups.gql dataconnect/app/groups.test.ts dataconnect/app/activity.gql dataconnect/app/activity.test.ts functions/src/reports/csv.ts functions/src/reports/reports.test.ts functions/src/account/delete-my-account.ts functions/src/account/delete-my-account.test.ts functions/src/index.ts
git commit -m "Stop group-mates taking over someone else's contact, bound query inputs, escape CSV formulas, and require a recent sign-in to delete an account."
```

---

### Task 5: End-to-end harness and the main flow

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/main-flow.spec.ts`, `tests/e2e/fixtures.ts`
- Modify: `.gitignore` (`playwright-report/`, `test-results/`)
- Modify: `vitest.config.mts` (exclude `tests/e2e/**`)
- Modify: `.ga/config.json` (`checks.commands.e2e` = `pnpm test:e2e`, through `ga.mjs workflow set`)

**Interfaces:**
- Consumes: `@playwright/test` and the `test:e2e` script (Task 1)
- Produces: `playwright.config.ts`, whose `webServer` starts the emulators and the site on the 2140-series ports with `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` set, needing no `.env`. Task 1's CI job runs it.

**Spec:**
- [Decision](../../knowledge/decisions/e2e-playwright-main-flow.md): "The main flow is: sign in, create a group, add an expense split equally with a contact, and see the balance."

**Tags:** harness, security (creates an emulator-only test user with a generated password)

**Knowledge:**
- `project/conventions`: e2e tests live in `tests/e2e/*.spec.ts` and run with `pnpm test:e2e` on the emulators

**Acceptance:**
- Given the emulators with no data, when `pnpm test:e2e` runs, then a test user is created on the Auth emulator with credentials generated in `fixtures.ts`, signs in, creates group "E2E Trip", adds contact "Asha" and an expense "Dinner" of `600` split equally, and the group shows Asha owing `300`.
- Given a wrong password, when the test signs in, then the form's error is visible and the URL stays on `/sign-in/`.
- Given `pnpm test`, then Vitest doesn't pick up `tests/e2e/`.
- Given `fixtures.ts`, then it refuses to run unless the Auth emulator host is set, so it can never create a user on a real project.

- [x] **Step 1: Write the spec and fixtures**
- [x] **Step 2: Run it to verify it fails** on a locator or an assertion, not on a missing module

Run: `pnpm test:e2e`
Expected: FAIL

- [x] **Step 3: Write `playwright.config.ts`**, the `.gitignore` and Vitest exclusions, and set `checks.commands.e2e`
- [x] **Step 4: Run it to verify it passes**

Run: `pnpm test:e2e`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/main-flow.spec.ts tests/e2e/fixtures.ts .gitignore vitest.config.mts .ga/config.json
git commit -m "Add a Playwright end-to-end test of the main flow on the emulators."
```
