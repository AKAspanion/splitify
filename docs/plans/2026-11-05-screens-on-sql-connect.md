# The Screens on SQL Connect (Spec 2b) Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:implement-with-subagents by default, or ga:implement. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Move every signed-in screen onto SQL Connect and Firebase Auth and into the hosting build, so the app runs on Firebase Hosting with no server.

**Architecture:** A foundation task adds the signed-in shell (guard, navbars, verify-email banner), the id-route mechanism (placeholder `_` pages, Hosting rewrites, `useRouteIds`) and the ledger adapter. Four slices then convert their area's components in place to read and write through per-area hooks in `lib/data/`, make each `page.tsx` a thin client page, and add a `page.hosting.tsx` entry re-exporting it.

**Tech Stack:** Next.js 16 App Router (hosting build: static export of `*.hosting.tsx` entries), React 19, Tailwind with shadcn/ui, react-query 5, Firebase JS SDK (`firebase/auth`, `firebase/data-connect`), the generated `@dataconnect/app` SDK and `lib/data/expense-writes.ts`, the split engine in `lib/splitify/`, Vitest 5, Firebase emulators via `npx --yes firebase-tools@15.34.2`, GitHub Actions (existing `ci.yml`, `deploy.yml`).

**Spec:** [docs/specs/2026-11-05-screens-on-sql-connect.md](../specs/2026-11-05-screens-on-sql-connect.md)

## Global Constraints

- Never `yarn build` or a plain `yarn install`; install with `--ignore-scripts`. Emulator work runs on project `demo-splitify`, and in a worktree only through the run's `with-emulator-lock.sh`.
- Reads and writes go through `lib/data/` hooks over `@dataconnect/app` (and `lib/data/expense-writes.ts` for `createExpense`/`createSettlement`); no screen imports `@/actions/*`, `@/hooks/use-*` data hooks, `utils/api`, axios, `@clerk/nextjs` or Prisma types for data. New ids come from `crypto.randomUUID()`.
- Text shown for an error comes from `toUserMessage`; search text goes through `escapeSearch`.
- A screen that gets `null` shows "We couldn't find that. It may have been deleted, or you may not be a member." with a link to `/groups`; lists show a skeleton while loading, an empty state, and an error with "Try again"; forms disable submit while sending and keep what was typed on error.
- Each `page.tsx` in a slice becomes a thin client page rendering the screen; its `page.hosting.tsx` re-exports it, and for a route with an id segment also exports `generateStaticParams` returning the placeholder `_` for each segment. Ids are read with `useRouteIds()`, never from the page's params.
- What each screen shows and does stays as today; only the data source changes. Report download and account deletion stay out (2c): the group page hides "Download report", and the profile's "Delete account" links to `/delete-account`.
- Screens are checked in the browser against the emulators, light and dark at 390 pixels, with no horizontal scroll.

## Checkpoints

None, and the run is unattended (`run.unattended: true`): checkpoints become summaries, and conflicts become `Provisional:` rulings.

---

### Task 1: Foundation: the signed-in shell, id routes, the ledger adapter and the hosting check's manifests

**Files:**
- Create: `app/(platform)/(app)/layout.hosting.tsx`
- Modify: `app/(platform)/(app)/_components/navbar.tsx`
- Modify: `app/(platform)/(app)/_components/navbar-bottom.tsx`
- Create: `components/auth/verify-email-banner.tsx`
- Create: `hooks/use-route-ids.ts`
- Test: `hooks/use-route-ids.test.ts`
- Create: `lib/data/ledger.ts`
- Test: `lib/data/ledger.test.ts`
- Modify: `firebase.json`
- Modify: `scripts/check-hosting-build.mjs`
- Create: `scripts/hosting-pages/public.json`
- Create: `scripts/hosting-pages/shell.json`

**Interfaces:**
- Consumes: `RequireAuth`, `useAuth` (spec 2a); existing `calcGroupSplits`, `calcExpenseSplits`, `evaluateTotals` and `ExpenseWithPaymentWithSplit` (`types/shared.d.ts`).
- Produces (used by Tasks 2 to 5):

```ts
// hooks/use-route-ids.ts
export type RouteIds = { groupId: string | null; expenseId: string | null; friendId: string | null; activityId: string | null };
export function useRouteIds(): RouteIds;
export function routeIdsFromPath(pathname: string): RouteIds; // the pure part, tested

// lib/data/ledger.ts
export function toLedgerExpenses(ledger: GetGroupLedgerData["expenses"]): ExpenseWithPaymentWithSplit[];
```

- `scripts/check-hosting-build.mjs` reads every `scripts/hosting-pages/*.json`, each `{ "pages": string[], "requests": { "path": string, "expectText": string }[] }`, and asserts each page file exists in `out/` and each request answers 200 containing its text. `public.json` holds today's assertions; each slice adds its own file.
- `firebase.json` rewrites, before the coming-soon catch-all, most specific first: `/groups/*/expense/*` → `/groups/_/expense/_/index.html`; `/groups/*/expense` → `/groups/_/expense/index.html`; `/groups/*/edit`, `/groups/*/settle`, `/groups/*/settings`, `/groups/*/add-member`, `/groups/*/activity` → `/groups/_/<that>/index.html`; `/groups/*` → `/groups/_/index.html`; `/expense/*/edit` → `/expense/_/edit/index.html`; `/friends/*/edit/contact` → `/friends/_/edit/contact/index.html`; `/friends/*` → `/friends/_/index.html`; `/activity/*` → `/activity/_/index.html`. Paths with a trailing slash match too.

**Spec:**
- The signed-in shell: "`app/(platform)/(app)/layout.hosting.tsx` wraps its pages in `RequireAuth`, the existing `Navbar` and"
- Routes with an id: "`hooks/use-route-ids.ts` `useRouteIds()` reads the real ids from `usePathname()` by the route's pattern, never from"
- Balances: "`lib/data/ledger.ts` `toLedgerExpenses(result)` turns `GetGroupLedger`'s expenses into the"

**Tags:** `security`, `screen`, `failure-paths`

**Knowledge:** `apps/splitify`: the signed-in shell in the hosting build, the id routes' placeholder pages and rewrites, and the hosting check's manifests. `features/balances`: balances come from `GetGroupLedger` through `toLedgerExpenses` into the unchanged split engine.

**Acceptance:**
- Given `routeIdsFromPath`, then `/groups/0123456789abcdef0123456789abcdef/` gives that group id; `/groups/0123…/expense/fedc…/` both ids; a dashed UUID is accepted; `/groups/_/` (the placeholder), `/groups/not-an-id/` and `/groups/../x` give `null`; `/friends/spuser_abc/` gives friend id `spuser_abc`; a 129-character friend id gives `null`; `/activity/<uuid>/` the activity id.
- Given a ledger of three expenses (an equal split of 300 paid by Alice among Alice, Bob and Carol; an exact split of 100 paid by Bob, 60 to Alice and 40 to Carol; a settlement of 50 from Carol to Alice), when `toLedgerExpenses` feeds `calcGroupSplits` and `evaluateTotals`, then the balances and totals equal those the same expenses give in the old Prisma shape (written in the test), and `tag` and `type` are kept.
- Given the signed-in layout, then signed out it sends the person to `/sign-in/?next=…`; signed in with `emailVerified: false` it shows the banner text from the spec with "Resend email" and "I've verified"; "Resend email" shows "Sent. Check your inbox." and stays disabled for 60 seconds; verified, no banner.
- Given `navbar.tsx` and `navbar-bottom.tsx`, then neither imports `@clerk/nextjs`, the avatar and links come from `useAuth()`, and `yarn tsc --noEmit` passes.
- Given `yarn build:hosting && yarn check:hosting`, then the check reads `scripts/hosting-pages/*.json` and today's assertions still pass from `public.json`; `/webauthn/register` still answers the coming-soon page.

- [x] **Step 1: Write the failing tests** for `routeIdsFromPath` and `toLedgerExpenses` in `hooks/use-route-ids.test.ts` and `lib/data/ledger.test.ts`, and the manifest-reading check

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `use-route-ids.test.ts` and `ledger.test.ts`

- [x] **Step 3: Write the shell, banner, id routes, adapter and check changes** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build:hosting && yarn check:hosting`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/(app)/layout.hosting.tsx" "app/(platform)/(app)/_components/navbar.tsx" "app/(platform)/(app)/_components/navbar-bottom.tsx" components/auth/verify-email-banner.tsx hooks/use-route-ids.ts hooks/use-route-ids.test.ts lib/data/ledger.ts lib/data/ledger.test.ts firebase.json scripts/check-hosting-build.mjs scripts/hosting-pages/public.json scripts/hosting-pages/shell.json
git commit -m "Add the signed-in shell with the verify-email banner, the id routes for the hosting build, and the adapter that feeds SQL Connect's ledger to the split engine."
```

---

### Task 2: Groups and the dashboard

**Files:**
- Create: `lib/data/groups.ts`
- Test: `lib/data/groups.test.ts`
- Create: `scripts/hosting-pages/groups.json`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/edit/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/edit/group-edit.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/edit/page.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/add/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/add/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/dashboard/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/add-member/action.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/add-member/add-member.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/add-member/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/balances-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/balances-loader.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/balances.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense-card.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense-date.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expenses-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expenses-paginate.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expenses-tabs.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/group-client.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/group-details.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/group-users.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/settings/group-delete.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/settings/group-members.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/settings/group-settings.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/settings/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/totals-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/totals.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/who-paid.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/your-share.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/group-create.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/group-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/groups.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/page.tsx`
- Create: `app/(platform)/(app)/(forms)/groups/[id]/edit/page.hosting.tsx`
- Create: `app/(platform)/(app)/(forms)/groups/add/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/dashboard/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/groups/[id]/add-member/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/groups/[id]/expense/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/groups/[id]/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/groups/[id]/settings/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/groups/page.hosting.tsx`

**Interfaces:**
- Consumes: `useRouteIds`, `toLedgerExpenses`, the shell and the manifests from Task 1; existing `queryKeys`, `toUserMessage`, `escapeSearch` (spec 2a); `ListMyGroups`, `GetGroup`, `ListGroupMembers`, `GetGroupLedger`, `ListGroupExpenses`, `CreateGroup`, `UpdateGroup`, `DeleteGroup`, `ListFriends`, `AddGroupMember` from `@dataconnect/app`.
- Produces:

```ts
// lib/data/groups.ts
export function useMyGroups(search: string, limit: number): UseQueryResult<GroupSummary[]>;
export function useGroup(groupId: string | null): UseQueryResult<GroupDetail | null>;
export function useGroupMembers(groupId: string | null): UseQueryResult<Member[]>;
export function useGroupLedger(groupId: string | null): UseQueryResult<ExpenseWithPaymentWithSplit[]>;
export function useGroupExpenses(groupId: string | null, search: string): UseInfiniteQueryResult<ExpensePage>;
export function useCreateGroup(): UseMutationResult<{ id: string }, Error, { title: string; description?: string; type?: string }>;
export function useUpdateGroup(): UseMutationResult<void, Error, { id: string; title: string; description?: string; type?: string }>;
export function useDeleteGroup(): UseMutationResult<void, Error, { id: string }>;
export function useAddGroupMember(): UseMutationResult<void, Error, { groupId: string; userId: string }>;
export function invalidatedByGroupWrite(op: "CreateGroup" | "UpdateGroup" | "DeleteGroup" | "AddGroupMember", groupId: string): readonly unknown[][]; // the keys each write invalidates, tested
```

**Spec:**
- Screens: "**Groups:** `/groups` (`ListMyGroups`, search), `/groups/add` (`CreateGroup`), `/groups/[id]` (`GetGroup`,"
- Screens: "**Dashboard:** `/dashboard`, as today, from the groups and ledgers above."
- Screens: "button is hidden until 2c moves reports to a function."

**Tags:** `security`, `screen`, `failure-paths`

**Knowledge:** `features/groups`: the group screens read and write through `lib/data/groups.ts`. `features/balances`: the group page's balances come from `useGroupLedger`.

**Acceptance:**
- Given `invalidatedByGroupWrite`, then `CreateGroup` invalidates `ListMyGroups`; `UpdateGroup` `ListMyGroups` and `GetGroup` for the group; `DeleteGroup` `ListMyGroups` and every key for the group; `AddGroupMember` `ListGroupMembers` and `GetGroup` for the group.
- Given the emulators and a signed-in person, when they create "Goa trip", then it appears on `/groups`, and searching "goa" finds it while "(" doesn't error.
- Given a group with Alice, Bob and an equal expense, then `/groups/<id>` shows the expenses, the balances matching the split engine, and the totals; "Download report" isn't shown.
- Given `/groups/<id>/edit`, `/settings` (members, delete after a confirm, then back to `/groups`) and `/add-member` (friends not yet in the group; adding one shows them as a member), then each works, and a non-member opening any of them gets the not-found state.
- Given `/groups/<id>/expense`, then the group's expenses page loads more on scroll, ten at a time.
- Given `/dashboard`, then it shows what it shows today, from these hooks.
- Given each list's loading, empty and error state, and each form's sending and error state, then each shows as the Global Constraints say, checked once in the browser.
- Given `yarn build:hosting && yarn check:hosting`, then `groups.json`'s pages exist and its requests (`/groups/`, `/groups/abc/`, `/groups/abc/settings/`, `/dashboard/`) answer 200 with their screen's text.

- [x] **Step 1: Write the failing tests** for `invalidatedByGroupWrite` in `lib/data/groups.test.ts`, and `scripts/hosting-pages/groups.json`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `groups.test.ts`

- [x] **Step 3: Write the hooks and convert the screens** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build:hosting && yarn check:hosting`
Expected: PASS, then the browser check of every group screen

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/(app)/(forms)/groups/[id]/edit/form.tsx" "app/(platform)/(app)/(forms)/groups/[id]/edit/group-edit.tsx" "app/(platform)/(app)/(forms)/groups/[id]/edit/page.tsx" "app/(platform)/(app)/(forms)/groups/add/form.tsx" "app/(platform)/(app)/(forms)/groups/add/page.tsx" "app/(platform)/(app)/(screens)/dashboard/page.tsx" "app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx" "app/(platform)/(app)/(screens)/groups/[id]/add-member/action.tsx" "app/(platform)/(app)/(screens)/groups/[id]/add-member/add-member.tsx" "app/(platform)/(app)/(screens)/groups/[id]/add-member/page.tsx" "app/(platform)/(app)/(screens)/groups/[id]/balances-list.tsx" "app/(platform)/(app)/(screens)/groups/[id]/balances-loader.tsx" "app/(platform)/(app)/(screens)/groups/[id]/balances.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense-card.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense-date.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/page.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expenses-list.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expenses-paginate.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expenses-tabs.tsx" "app/(platform)/(app)/(screens)/groups/[id]/group-client.tsx" "app/(platform)/(app)/(screens)/groups/[id]/group-details.tsx" "app/(platform)/(app)/(screens)/groups/[id]/group-users.tsx" "app/(platform)/(app)/(screens)/groups/[id]/page.tsx" "app/(platform)/(app)/(screens)/groups/[id]/settings/group-delete.tsx" "app/(platform)/(app)/(screens)/groups/[id]/settings/group-members.tsx" "app/(platform)/(app)/(screens)/groups/[id]/settings/group-settings.tsx" "app/(platform)/(app)/(screens)/groups/[id]/settings/page.tsx" "app/(platform)/(app)/(screens)/groups/[id]/totals-list.tsx" "app/(platform)/(app)/(screens)/groups/[id]/totals.tsx" "app/(platform)/(app)/(screens)/groups/[id]/who-paid.tsx" "app/(platform)/(app)/(screens)/groups/[id]/your-share.tsx" "app/(platform)/(app)/(screens)/groups/group-create.tsx" "app/(platform)/(app)/(screens)/groups/group-list.tsx" "app/(platform)/(app)/(screens)/groups/groups.tsx" "app/(platform)/(app)/(screens)/groups/page.tsx" "app/(platform)/(app)/(forms)/groups/[id]/edit/page.hosting.tsx" "app/(platform)/(app)/(forms)/groups/add/page.hosting.tsx" "app/(platform)/(app)/(screens)/dashboard/page.hosting.tsx" "app/(platform)/(app)/(screens)/groups/[id]/add-member/page.hosting.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/page.hosting.tsx" "app/(platform)/(app)/(screens)/groups/[id]/page.hosting.tsx" "app/(platform)/(app)/(screens)/groups/[id]/settings/page.hosting.tsx" "app/(platform)/(app)/(screens)/groups/page.hosting.tsx" lib/data/groups.ts lib/data/groups.test.ts scripts/hosting-pages/groups.json
git commit -m "Move the group screens and the dashboard onto SQL Connect and into the hosting build."
```

---

### Task 3: Expenses and settling up

**Files:**
- Create: `lib/data/expenses.ts`
- Test: `lib/data/expenses.test.ts`
- Create: `scripts/hosting-pages/expenses.json`
- Modify: `app/(platform)/(app)/(forms)/expense/[id]/edit/edit-expense.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/[id]/edit/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/[id]/edit/page.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/equal-loader.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/equal.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/exact-loader.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/exact.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/_splits/percent.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/category-combobox.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/group-combobox.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/split-drawer.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/add-expense.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/page.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/settle/(form)/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/settle/page.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/settle/settle-expense.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/settle/settle-users.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-actions.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-added-by.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list-wrapper.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-summary-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-client.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-details.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-header.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-users-client.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-users.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.tsx`
- Modify: `app/(platform)/(app)/_components/add-expense-fab.tsx`
- Modify: `app/(platform)/(app)/_components/expense-form-loading.tsx`
- Create: `app/(platform)/(app)/(forms)/expense/[id]/edit/page.hosting.tsx`
- Create: `app/(platform)/(app)/(forms)/expense/add/page.hosting.tsx`
- Create: `app/(platform)/(app)/(forms)/groups/[id]/settle/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.hosting.tsx`

**Interfaces:**
- Consumes: `useRouteIds` and the manifests from Task 1; existing `createExpense`, `createSettlement`, `queryKeys`, `toUserMessage` (spec 2a); `GetExpense`, `UpdateExpense`, `DeleteExpense`, `ListMyGroups`, `ListGroupMembers` from `@dataconnect/app`; existing `calcExpenseSplits`, `yourShareInExpense`, `whoPaidExpense`.
- Produces:

```ts
// lib/data/expenses.ts
export function useExpense(expenseId: string | null): UseQueryResult<ExpenseDetail | null>;
export function useCreateExpense(): UseMutationResult<{ id: string }, Error, Omit<CreateExpenseVars, "id" | "activityId" | "payments" | "splits"> & { payments: { userId: string; amount: number }[]; splits: { userId: string; amount: number; percent?: number | null }[] }>;
export function useCreateSettlement(): UseMutationResult<{ id: string }, Error, Omit<CreateSettlementVars, "id" | "paymentId" | "splitId" | "activityId">>;
export function useUpdateExpense(): UseMutationResult<void, Error, { id: string; description: string; groupId: string }>;
export function useDeleteExpense(): UseMutationResult<void, Error, { id: string; groupId: string }>;
export function invalidatedByExpenseWrite(op: "CreateExpense" | "CreateSettlement" | "UpdateExpense" | "DeleteExpense", groupId: string, expenseId?: string): readonly unknown[][];
```

`useCreateExpense` and `useCreateSettlement` make every id (the expense's, each payment's and split's, the activity's) with `crypto.randomUUID()`.

**Spec:**
- Screens: "**Expenses:** `/expense/add` (`createExpense` from `lib/data/expense-writes.ts`), `/groups/[id]/expense/[expenseId]`"
- Balances: "on an expense follow `yourShareInExpense`, showing the net amount."

**Tags:** `security`, `screen`, `failure-paths`

**Knowledge:** `features/expenses`: the expense screens read and write through `lib/data/expenses.ts`, with every id made in the browser. `features/settle-up`: settling records through `createSettlement`.

**Acceptance:**
- Given `invalidatedByExpenseWrite`, then each write invalidates the group's `GetGroupLedger`, `ListGroupExpenses` and `GetGroup`, and `ListMyActivity`; `UpdateExpense` and `DeleteExpense` also the expense's `GetExpense`.
- Given `useCreateExpense` called twice with the same input, then the two expenses have different ids, and every payment and split id is a fresh UUID.
- Given `/expense/add` in a group of three, when an equal expense of 300 is saved, then the group page shows it and the balances move by 100 each; an exact expense whose splits don't add up is refused by the form's existing check before sending.
- Given a split including someone not in the group (forced in the test), then the form shows "Only members of this group can be added to an expense" and keeps the entries.
- Given `/groups/<id>/expense/<expenseId>`, then it shows the payers, the splits and "You owe" or "You get back" with the net amount; deleting asks first, then returns to the group.
- Given `/expense/<id>/edit`, then only the description can change, and saving shows the new description.
- Given `/groups/<id>/settle`, when Bob settles 100 with Alice, then the settlement shows in the group and the balance between them drops by 100.
- Given each form's sending and error state, then each shows as the Global Constraints say, checked once in the browser.
- Given `yarn build:hosting && yarn check:hosting`, then `expenses.json`'s pages exist and its requests (`/expense/add/`, `/groups/abc/expense/def/`, `/expense/abc/edit/`, `/groups/abc/settle/`) answer 200 with their screen's text.

- [x] **Step 1: Write the failing tests** for `invalidatedByExpenseWrite` and the id generation in `lib/data/expenses.test.ts`, and `scripts/hosting-pages/expenses.json`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `expenses.test.ts`

- [x] **Step 3: Write the hooks and convert the screens** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build:hosting && yarn check:hosting`
Expected: PASS, then the browser check of every expense screen

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/(app)/(forms)/expense/[id]/edit/edit-expense.tsx" "app/(platform)/(app)/(forms)/expense/[id]/edit/form.tsx" "app/(platform)/(app)/(forms)/expense/[id]/edit/page.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/_splits/equal-loader.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/_splits/equal.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/_splits/exact-loader.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/_splits/exact.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/_splits/percent.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/category-combobox.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/group-combobox.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/payment-drawer.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/split-drawer.tsx" "app/(platform)/(app)/(forms)/expense/add/add-expense.tsx" "app/(platform)/(app)/(forms)/expense/add/page.tsx" "app/(platform)/(app)/(forms)/groups/[id]/settle/(form)/form.tsx" "app/(platform)/(app)/(forms)/groups/[id]/settle/page.tsx" "app/(platform)/(app)/(forms)/groups/[id]/settle/settle-expense.tsx" "app/(platform)/(app)/(forms)/groups/[id]/settle/settle-users.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-actions.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-added-by.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list-wrapper.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-list.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance-summary-list.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-balance.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-client.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-details.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-header.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-users-client.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-users.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.tsx" "app/(platform)/(app)/_components/add-expense-fab.tsx" "app/(platform)/(app)/_components/expense-form-loading.tsx" "app/(platform)/(app)/(forms)/expense/[id]/edit/page.hosting.tsx" "app/(platform)/(app)/(forms)/expense/add/page.hosting.tsx" "app/(platform)/(app)/(forms)/groups/[id]/settle/page.hosting.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/page.hosting.tsx" lib/data/expenses.ts lib/data/expenses.test.ts scripts/hosting-pages/expenses.json
git commit -m "Move adding, viewing, editing and deleting expenses, and settling up, onto SQL Connect and into the hosting build."
```

---

### Task 4: Friends and contacts

**Files:**
- Create: `lib/data/people.ts`
- Test: `lib/data/people.test.ts`
- Create: `scripts/hosting-pages/people.json`
- Modify: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/edit-contact.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/page.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/add/action.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/add/contact/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/add/contact/page.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/add/page.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/add/search.tsx`
- Modify: `app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx`
- Modify: `app/(platform)/(app)/(screens)/friends/[id]/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/friends/[id]/shared-groups.tsx`
- Modify: `app/(platform)/(app)/(screens)/friends/[id]/verify-details.tsx`
- Modify: `app/(platform)/(app)/(screens)/friends/friends-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/friends/friends-paginate.tsx`
- Modify: `app/(platform)/(app)/(screens)/friends/page.tsx`
- Create: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/page.hosting.tsx`
- Create: `app/(platform)/(app)/(forms)/friends/add/contact/page.hosting.tsx`
- Create: `app/(platform)/(app)/(forms)/friends/add/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/friends/[id]/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/friends/page.hosting.tsx`

**Interfaces:**
- Consumes: `useRouteIds` and the manifests from Task 1; existing `queryKeys`, `toUserMessage` (spec 2a); `ListFriends`, `GetFriend`, `SearchUserByEmail`, `AddFriend`, `CreateContact`, `UpdateContact`, `ListMyGroups`, `ListGroupMembers` from `@dataconnect/app`.
- Produces:

```ts
// lib/data/people.ts
export function useFriends(): UseQueryResult<Friend[]>;
export function useFriend(friendId: string | null): UseQueryResult<Friend | null>;
export function useSharedGroups(friendId: string | null): UseQueryResult<GroupSummary[]>;
export function useSearchUser(email: string): UseQueryResult<FoundUser | null>; // email trimmed and lower-cased before sending
export function useAddFriend(): UseMutationResult<void, Error, { friendId: string; groupId?: string | null }>; // sends withGroup: groupId != null
export function useCreateContact(): UseMutationResult<{ id: string }, Error, { name: string; email: string }>; // id is "spuser_" + a random id
export function useUpdateContact(): UseMutationResult<void, Error, { id: string; name: string; email: string }>;
export function contactId(): string;
export function normaliseEmail(email: string): string;
```

**Spec:**
- Screens: "**Friends:** `/friends` (`ListFriends`), `/friends/[id]` (`GetFriend`, the groups you share,"

**Tags:** `security`, `screen`, `failure-paths`

**Knowledge:** `features/friends-and-contacts`: the friend and contact screens read and write through `lib/data/people.ts`. `data/user`: a contact's id is `spuser_` plus a random id made in the browser.

**Acceptance:**
- Given `normaliseEmail("  Dev@Example.TEST ")`, then it returns `dev@example.test`; given `contactId()`, then it starts with `spuser_` and two calls differ.
- Given `useAddFriend` with no group, then it sends `withGroup: false`; with a group, `withGroup: true` and the group id.
- Given `/friends/add`, when someone searches an existing person's email, then they show with "Add"; adding them lists them on `/friends`; searching an unknown email offers "Add as a contact".
- Given `/friends/add/contact`, when a contact is saved, then they show on `/friends` and their page says "Verification pending"; a taken email shows "That email is already in use".
- Given `/friends/<id>/edit/contact` for a contact you're friends with, then the name changes; for a signed-up friend the page shows the not-found state.
- Given `/friends/<id>`, then it shows the groups you share.
- Given each list's and form's states, then each shows as the Global Constraints say, checked once in the browser.
- Given `yarn build:hosting && yarn check:hosting`, then `people.json`'s pages exist and its requests (`/friends/`, `/friends/abc/`, `/friends/add/`, `/friends/add/contact/`, `/friends/abc/edit/contact/`) answer 200 with their screen's text.

- [x] **Step 1: Write the failing tests** for `normaliseEmail`, `contactId` and `useAddFriend`'s variables in `lib/data/people.test.ts`, and `scripts/hosting-pages/people.json`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `people.test.ts`

- [x] **Step 3: Write the hooks and convert the screens** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build:hosting && yarn check:hosting`
Expected: PASS, then the browser check of every friend and contact screen

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/(app)/(forms)/friends/[id]/edit/contact/edit-contact.tsx" "app/(platform)/(app)/(forms)/friends/[id]/edit/contact/form.tsx" "app/(platform)/(app)/(forms)/friends/[id]/edit/contact/page.tsx" "app/(platform)/(app)/(forms)/friends/add/action.tsx" "app/(platform)/(app)/(forms)/friends/add/contact/form.tsx" "app/(platform)/(app)/(forms)/friends/add/contact/page.tsx" "app/(platform)/(app)/(forms)/friends/add/page.tsx" "app/(platform)/(app)/(forms)/friends/add/search.tsx" "app/(platform)/(app)/(screens)/friends/[id]/friend-details.tsx" "app/(platform)/(app)/(screens)/friends/[id]/page.tsx" "app/(platform)/(app)/(screens)/friends/[id]/shared-groups.tsx" "app/(platform)/(app)/(screens)/friends/[id]/verify-details.tsx" "app/(platform)/(app)/(screens)/friends/friends-list.tsx" "app/(platform)/(app)/(screens)/friends/friends-paginate.tsx" "app/(platform)/(app)/(screens)/friends/page.tsx" "app/(platform)/(app)/(forms)/friends/[id]/edit/contact/page.hosting.tsx" "app/(platform)/(app)/(forms)/friends/add/contact/page.hosting.tsx" "app/(platform)/(app)/(forms)/friends/add/page.hosting.tsx" "app/(platform)/(app)/(screens)/friends/[id]/page.hosting.tsx" "app/(platform)/(app)/(screens)/friends/page.hosting.tsx" lib/data/people.ts lib/data/people.test.ts scripts/hosting-pages/people.json
git commit -m "Move the friend and contact screens onto SQL Connect and into the hosting build."
```

---

### Task 5: Activity, feedback and the profile

**Files:**
- Create: `lib/data/activity.ts`
- Test: `lib/data/activity.test.ts`
- Create: `lib/data/feedback.ts`
- Create: `scripts/hosting-pages/activity.json`
- Modify: `app/(platform)/(app)/(forms)/feedback/add/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/feedback/add/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/activity/[id]/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/activity/activity-list.tsx`
- Modify: `app/(platform)/(app)/(screens)/activity/activity-paginate.tsx`
- Modify: `app/(platform)/(app)/(screens)/activity/page.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/activity/group-activity.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx`
- Modify: `app/(platform)/(app)/_components/activity-card.tsx`
- Modify: `app/(platform)/profile/delete-account-action.tsx`
- Modify: `app/(platform)/profile/notification-action.tsx`
- Modify: `app/(platform)/profile/page.tsx`
- Create: `app/(platform)/(app)/(forms)/feedback/add/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/activity/[id]/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/activity/page.hosting.tsx`
- Create: `app/(platform)/(app)/(screens)/groups/[id]/activity/page.hosting.tsx`
- Create: `app/(platform)/profile/page.hosting.tsx`

**Interfaces:**
- Consumes: `useRouteIds` and the manifests from Task 1; existing `activityText` (`functions/src/activity-text.ts`), `queryKeys`, `toUserMessage`, `useAuth`, `signOut`, the notification control (spec 2a); `ListMyActivity`, `GetActivity`, `UpsertMyFeedback`, `GetMe` from `@dataconnect/app`.
- Produces:

```ts
// lib/data/activity.ts
export function useMyActivity(): UseInfiniteQueryResult<ActivityPage>; // ten at a time
export function useActivity(activityId: string | null): UseQueryResult<ActivityItem | null>;
export function useGroupActivity(groupId: string | null): UseInfiniteQueryResult<ActivityPage>;
export function activityLine(item: ActivityItem, viewerId: string): { title: string; body: string; link: string }; // activityText, with "You" for the viewer

// lib/data/feedback.ts
export function useSendFeedback(): UseMutationResult<void, Error, { title: string; description?: string }>;
```

**Spec:**
- Screens: "**Activity:** `/activity` (`ListMyActivity`, paged) and `/activity/[id]` (`GetActivity`), text from"
- Screens: "**Profile:** `/profile`, from `useAuth()` and `GetMe`, with the notification control 2a moved to FCM, the theme"

**Tags:** `security`, `screen`, `failure-paths`

**Knowledge:** `features/activity-feed`: the feed reads `ListMyActivity` and builds each line with `activityText`, naming the viewer "You". `features/feedback`: sent through `UpsertMyFeedback`. `features/profile` (new): what the profile shows, and that deleting an account links to `/delete-account` until 2c.

**Acceptance:**
- Given `activityLine` for an `EXPENSE_PLUS` by the viewer, then the actor reads "You"; by someone else, their name; a `MEMBER_PLUS` whose subject is the viewer reads "You were added to …".
- Given `/activity` with 25 entries, then ten show, and more load on scroll; `/activity/<id>` shows one entry, and another person's entry outside your groups shows the not-found state.
- Given `/groups/<id>/activity`, then it shows only that group's entries.
- Given `/feedback/add`, when feedback is sent twice, then the second replaces the first, and a 101-character title is refused by the form before sending.
- Given `/profile`, then it shows the person's name and email from `useAuth`, the notification control, the theme toggle, "Sign out" (signs out and returns to `/`), and "Delete account" linking to `/delete-account`.
- Given each list's and form's states, then each shows as the Global Constraints say, checked once in the browser.
- Given `yarn build:hosting && yarn check:hosting`, then `activity.json`'s pages exist and its requests (`/activity/`, `/activity/abc/`, `/groups/abc/activity/`, `/feedback/add/`, `/profile/`) answer 200 with their screen's text.

- [x] **Step 1: Write the failing tests** for `activityLine` in `lib/data/activity.test.ts`, and `scripts/hosting-pages/activity.json`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `activity.test.ts`

- [x] **Step 3: Write the hooks and convert the screens** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build:hosting && yarn check:hosting`
Expected: PASS, then the browser check of every activity, feedback and profile screen

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/(app)/(forms)/feedback/add/form.tsx" "app/(platform)/(app)/(forms)/feedback/add/page.tsx" "app/(platform)/(app)/(screens)/activity/[id]/page.tsx" "app/(platform)/(app)/(screens)/activity/activity-list.tsx" "app/(platform)/(app)/(screens)/activity/activity-paginate.tsx" "app/(platform)/(app)/(screens)/activity/page.tsx" "app/(platform)/(app)/(screens)/groups/[id]/activity/group-activity.tsx" "app/(platform)/(app)/(screens)/groups/[id]/activity/page.tsx" "app/(platform)/(app)/_components/activity-card.tsx" "app/(platform)/profile/delete-account-action.tsx" "app/(platform)/profile/notification-action.tsx" "app/(platform)/profile/page.tsx" "app/(platform)/(app)/(forms)/feedback/add/page.hosting.tsx" "app/(platform)/(app)/(screens)/activity/[id]/page.hosting.tsx" "app/(platform)/(app)/(screens)/activity/page.hosting.tsx" "app/(platform)/(app)/(screens)/groups/[id]/activity/page.hosting.tsx" "app/(platform)/profile/page.hosting.tsx" lib/data/activity.ts lib/data/activity.test.ts lib/data/feedback.ts scripts/hosting-pages/activity.json
git commit -m "Move the activity feed, feedback and the profile onto SQL Connect and into the hosting build."
```
