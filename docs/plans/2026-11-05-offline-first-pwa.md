# Offline-first PWA (Spec 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:implement-with-subagents by default, or ga:implement. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Splitify work offline: read everything seen from a cache saved in IndexedDB, queue new expenses and settlements until the connection returns, disable every other change offline, and cache the app shell in one service worker shared with FCM.

**Architecture:** A foundation task persists react-query's cache per signed-in person, adds `useOnline`, the offline banner and an `OnlineOnly` wrapper. Three slices then build the service worker and its precache manifest, the queued writes with their optimistic rows, and the online-only guards across the screens.

**Tech Stack:** Next.js 16 static export, React 19, react-query 5 with `@tanstack/react-query-persist-client` and an IndexedDB persister over `idb-keyval`, a hand-written service worker (`public/sw.js`) importing the Firebase messaging compat scripts, Firebase Auth and SQL Connect, Vitest 5, the Firebase emulators via `npx --yes firebase-tools@15.34.2` (with `firebase.emulators.json` for local checks), GitHub Actions (existing `ci.yml`, `deploy.yml`).

**Spec:** [docs/specs/2026-11-05-offline-first-pwa.md](../specs/2026-11-05-offline-first-pwa.md)

## Global Constraints

- Install with `yarn install --frozen-lockfile`; emulator work in a worktree only through the run's `with-emulator-lock.sh`, with `--config firebase.emulators.json` for Hosting.
- Offline text, exactly: banner "You're offline. Showing what was saved on this device.", waiting "<n> changes waiting to sync", syncing "Syncing <n> changes…", disabled actions "You're offline. This needs a connection.", sign-in "You're offline. Connect to sign in.", a queued row "Waiting to sync", a rejected sync "An expense you added offline couldn't be saved: <reason>", a new version "A new version of Splitify is ready." with "Reload".
- The saved cache is one IndexedDB entry per signed-in person (`splitify-cache-<uid>`), kept 7 days, thrown away on a new app version, deleted on sign-out.
- The service worker never caches `/api/**` or a cross-origin request.

## Checkpoints

None, and the run is unattended (`run.unattended: true`).

---

### Task 1: Foundation: the saved cache, useOnline, the banner and OnlineOnly

**Files:**
- Modify: `package.json`, `yarn.lock`
- Create: `lib/offline/persist.ts`
- Test: `lib/offline/persist.test.ts`
- Create: `lib/offline/version.ts`
- Create: `hooks/use-online.ts`
- Test: `hooks/use-online.test.ts`
- Create: `components/offline/offline-banner.tsx`
- Create: `components/offline/online-only.tsx`
- Modify: `components/providers.tsx`
- Modify: `app/(platform)/(app)/layout.hosting.tsx`
- Modify: `lib/firebase/auth.ts`
- Create: `scripts/build-sw.mjs`

**Interfaces:**
- Consumes: existing `useAuth` (`hooks/use-auth.ts`), `signOut` (`lib/firebase/auth.ts`), the `QueryClient` in `components/providers.tsx`.
- Produces (used by Tasks 2 to 4):

```ts
// lib/offline/persist.ts
export const CACHE_MAX_AGE_MS = 604800000; // 7 days
export function cacheKey(uid: string): string; // "splitify-cache-<uid>"
export function createPersister(uid: string): import("@tanstack/react-query-persist-client").Persister;
export function clearSavedCache(uid: string): Promise<void>;

// lib/offline/version.ts
export function appVersion(): string; // the service worker's version, read from /sw-manifest.js's global at runtime, "dev" before one exists

// hooks/use-online.ts
export function useOnline(): boolean;

// components/offline/online-only.tsx
export function OnlineOnly(props: { children: (disabled: boolean) => React.ReactNode }): JSX.Element; // renders children(disabled) and, offline, the message under them

// components/offline/offline-banner.tsx
export function OfflineBanner(): JSX.Element | null; // reads useOnline and useMutationState for paused mutations
```

- `package.json`: dependencies `@tanstack/react-query-persist-client` and `idb-keyval`; `"postbuild": "node scripts/build-sw.mjs"`. `scripts/build-sw.mjs` is a stub that writes `out/sw-manifest.js` with an empty file list and version `"dev"`, which Task 2 replaces.
- `components/providers.tsx` uses `PersistQueryClientProvider` with `createPersister(uid)` for the signed-in person (no persister signed out), `maxAge: CACHE_MAX_AGE_MS`, `buster: appVersion()`, queries `networkMode: "offlineFirst"`, mutations `networkMode: "online"`, and resumes paused mutations after the cache restores (`onSuccess: () => queryClient.resumePausedMutations()`).
- `signOut()` calls `clearSavedCache(uid)` before signing out of Firebase.

**Spec:**
- The saved cache: "react-query's cache is persisted to IndexedDB with `@tanstack/react-query-persist-client` and an IndexedDB"
- The saved cache: "Signing out deletes that person's entry, so the next person on the device sees none of it."
- Offline in the screens: "`hooks/use-online.ts` `useOnline()` follows `navigator.onLine` and the `online`/`offline` events."

**Tags:** `security`, `screen`, `failure-paths`

**Knowledge:** `features/offline` (new): what works offline, the saved cache's key, life and clearing, and the banner. `apps/splitify`: the persisted query client.

**Acceptance:**
- Given `cacheKey("u1")`, then `"splitify-cache-u1"`; given `createPersister("u1")` writing then `clearSavedCache("u1")`, then the IndexedDB entry is gone and `"u2"`'s entry is untouched (tested with `fake-indexeddb` as a dev dependency).
- Given `useOnline` starting online, when an `offline` event fires, then it returns false; after `online`, true.
- Given the banner offline with two paused mutations, then it shows "You're offline. Showing what was saved on this device." and "2 changes waiting to sync"; online with paused mutations resuming, "Syncing 2 changes…"; online with none, nothing.
- Given `OnlineOnly` offline, then its child receives `disabled: true` and "You're offline. This needs a connection." shows under it; online, `false` and no message.
- Given a person signed in who loads a group, goes offline and reloads, then the group shows from the saved cache (checked in the browser against the emulators in Task 3's run; here, the persister restoring a query in a unit test).
- Given sign-out, then `clearSavedCache` runs for that person before Firebase's sign-out.
- Given the change, then `yarn tsc --noEmit`, `yarn lint`, `yarn test` and `yarn build` pass, and `out/sw-manifest.js` exists.

- [ ] **Step 1: Write the failing tests** for `persist.ts`, `useOnline` and the banner's text, in `lib/offline/persist.test.ts` and `hooks/use-online.test.ts`

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `persist.test.ts` and `use-online.test.ts`

- [ ] **Step 3: Write the persister, the hooks, the banner, the wrapper and the provider changes** to the Interfaces, until they pass

- [ ] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock lib/offline/persist.ts lib/offline/persist.test.ts lib/offline/version.ts hooks/use-online.ts hooks/use-online.test.ts components/offline/offline-banner.tsx components/offline/online-only.tsx components/providers.tsx "app/(platform)/(app)/layout.hosting.tsx" lib/firebase/auth.ts scripts/build-sw.mjs
git commit -m "Save the query cache in IndexedDB per signed-in person, and add the online state, the offline banner and the online-only wrapper."
```

---

### Task 2: One service worker

**Files:**
- Create: `public/sw.js`
- Delete: `public/firebase-messaging-sw.js`
- Modify: `scripts/build-sw.mjs`
- Test: `scripts/build-sw.test.mjs`
- Create: `lib/offline/sw-routing.js`
- Test: `lib/offline/sw-routing.test.ts`
- Modify: `lib/push/register.ts`
- Modify: `lib/push/register.test.ts`
- Modify: `app/launch.tsx`
- Create: `components/offline/update-toast.tsx`
- Create: `scripts/hosting-pages/pwa.json`

**Interfaces:**
- Consumes: the `postbuild` hook and `appVersion()` from Task 1; existing `registerWebPush` and the FCM handling in `public/firebase-messaging-sw.js`; the rewrites in `firebase.json`.
- Produces:

```ts
// lib/offline/sw-routing.js (plain JS, imported by sw.js with importScripts and by tests)
export function cacheStrategy(url: string, origin: string): "precache-first" | "network-first-page" | "bypass";
export function fallbackPage(pathname: string): string; // the cached page for a path, using the same patterns as firebase.json's rewrites
```

`out/sw-manifest.js` sets `self.__SW_MANIFEST = { version, files }` (every file under `out/` but `sw.js` and `sw-manifest.js`); `version` is a hash of the files' contents.

**Spec:**
- One service worker: "`public/sw.js` replaces `public/firebase-messaging-sw.js`: it keeps the FCM background handling as it is today and"
- One service worker: "`scripts/build-sw.mjs` runs after `next build` (`postbuild`) and writes `out/sw-manifest.js`: the list of every file"
- One service worker: "A new version shows a toast"

**Tags:** `security`, `failure-paths`

**Knowledge:** `operations/service-worker` (new): the worker's caching strategies, its precache manifest and version, and its update toast. `features/notifications`: push now comes through `/sw.js`.

**Acceptance:**
- Given a fake `out/` with three files, when `build-sw.mjs` runs, then the manifest lists all three, and changing one file's content changes `version`.
- Given `cacheStrategy`, then `/_next/static/x.js` and `/images/a.png` are `precache-first`; a same-origin page path `network-first-page`; `/api/reports/expenses`, `https://firebasedataconnect.googleapis.com/…` and `https://accounts.google.com/…` `bypass`.
- Given `fallbackPage`, then `/groups/abc/` gives `/groups/_/index.html`, `/groups/abc/expense/def/` `/groups/_/expense/_/index.html`, `/friends/x/` `/friends/_/index.html`, `/groups/` `/groups/index.html`, and an unknown path `/404.html`.
- Given `registerWebPush`, then it registers `/sw.js` with the config query and passes that registration to `getToken`; `register.test.ts` passes.
- Given `app/launch.tsx`, then it registers `/sw.js` for everyone on load, signed in or not.
- Given a waiting worker, then the toast "A new version of Splitify is ready." with "Reload" shows, and "Reload" posts `SKIP_WAITING` and reloads once the new worker takes control.
- Given `yarn build && yarn check:hosting`, then `out/sw.js` and `out/sw-manifest.js` are served (`pwa.json`), and in the browser against the emulators, after one visit and going offline, `/` and a visited group page load from the worker.

- [ ] **Step 1: Write the failing tests** for the manifest writer and the routing functions, in `scripts/build-sw.test.mjs` and `lib/offline/sw-routing.test.ts`

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `build-sw.test.mjs` and `sw-routing.test.ts`

- [ ] **Step 3: Write the worker, the manifest writer, the routing, the registration and the toast** to the Interfaces, until they pass

- [ ] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build && yarn check:hosting`
Expected: PASS, then the browser check offline

- [ ] **Step 5: Commit**

```bash
git rm -q public/firebase-messaging-sw.js
git add public/sw.js scripts/build-sw.mjs scripts/build-sw.test.mjs lib/offline/sw-routing.js lib/offline/sw-routing.test.ts lib/push/register.ts lib/push/register.test.ts app/launch.tsx components/offline/update-toast.tsx scripts/hosting-pages/pwa.json
git commit -m "Serve the app shell offline from one service worker that also carries FCM, with a precache built from the export and an update toast."
```

---

### Task 3: Queued expenses and settlements

**Files:**
- Create: `lib/offline/queued-writes.ts`
- Test: `lib/offline/queued-writes.test.ts`
- Modify: `lib/data/expenses.ts`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense-card.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expenses-list.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/add-expense.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/settle/settle-expense.tsx`
- Modify: `components/providers.tsx`

**Interfaces:**
- Consumes: the persisted query client and `useOnline` from Task 1; existing `createExpense`, `createSettlement`, `invalidatedByExpenseWrite`, `toUserMessage`.
- Produces:

```ts
// lib/offline/queued-writes.ts
export const CREATE_EXPENSE_KEY = ["CreateExpense"] as const;
export const CREATE_SETTLEMENT_KEY = ["CreateSettlement"] as const;
export function registerQueuedWrites(queryClient: import("@tanstack/react-query").QueryClient): void; // setMutationDefaults for both keys: mutationFn, onMutate (optimistic insert, pending: true), onError (rollback + toast), onSettled (invalidate)
export function isDuplicateIdError(error: unknown): boolean; // an "already exists" answer for the mutation's own id
export function withPending<T extends { id: string }>(rows: T[], pending: T[]): (T & { pending?: boolean })[];
```

`registerQueuedWrites` is called once where the query client is made (`components/providers.tsx` imports it; that one line is this task's, merged after Task 1).

**Spec:**
- Writing offline: "`CreateExpense` and `CreateSettlement` are react-query mutations with defaults registered by key"
- Writing offline: "When it is sent: success replaces the optimistic row with the server's; an"

**Tags:** `security`, `failure-paths`

**Knowledge:** `features/expenses`: adding an expense or a settlement works offline, queued with a "Waiting to sync" mark, sent once (a duplicate id counts as success), with the rejection message.

**Acceptance:**
- Given `isDuplicateIdError` with SQL Connect's duplicate-key error for the expense's id, then true; for "Not found" or a network error, false.
- Given an offline `CreateExpense` for group G, then G's cached expense list and ledger gain the row with `pending: true` at once, and the mutation is paused.
- Given the paused mutation resumes and the server answers success, then the row's `pending` mark goes and G's keys are invalidated; given it answers a duplicate-id error, the same as success; given "Not found", the row and the ledger change are rolled back and the toast reads "An expense you added offline couldn't be saved: Not found".
- Given a reload while the mutation is paused, then after the cache restores it is still paused, and it resumes when online (the defaults registered by key make that possible).
- Given the expense card for a pending row, then it shows "Waiting to sync"; the add and settle forms go back to the group as they do online.
- Given the browser against the emulators with the network off: load a group, go offline, reload (the group shows), add an expense and a settlement (both "Waiting to sync", "2 changes waiting to sync"), reload offline (still waiting), go online (they sync, the marks go, and the server has each exactly once).

- [ ] **Step 1: Write the failing tests** for each unit Acceptance case, in `lib/offline/queued-writes.test.ts`

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `queued-writes.test.ts`

- [ ] **Step 3: Write the queued writes and wire the hooks, card and forms** to the Interfaces, until they pass

- [ ] **Step 4: Run them to verify they pass**

Run: `yarn test`
Expected: PASS, then the browser check with the network off

- [ ] **Step 5: Commit**

```bash
git add lib/offline/queued-writes.ts lib/offline/queued-writes.test.ts lib/data/expenses.ts "app/(platform)/(app)/(screens)/groups/[id]/expense-card.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expenses-list.tsx" "app/(platform)/(app)/(forms)/expense/add/add-expense.tsx" "app/(platform)/(app)/(forms)/groups/[id]/settle/settle-expense.tsx" components/providers.tsx
git commit -m "Queue expenses and settlements made offline, show them as waiting to sync, and send them once when the connection returns."
```

---

### Task 4: Online-only actions disabled offline

**Files:**
- Modify: `app/(platform)/(app)/(screens)/groups/group-create.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/add/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/edit/form.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/settings/group-delete.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/add-member/add-member.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-actions.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/[id]/edit/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/add/search.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/add/contact/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/[id]/edit/contact/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/feedback/add/form.tsx`
- Modify: `app/(platform)/profile/delete-account-action.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx`
- Modify: `app/(platform)/(app)/webauthn/register/authn-register.tsx`
- Modify: `app/(platform)/(app)/webauthn/register/authn-actions.tsx`
- Modify: `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- Modify: `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- Modify: `app/(platform)/(auth)/forgot-password/forgot-password-form.tsx`

**Interfaces:**
- Consumes: `OnlineOnly` and `useOnline` from Task 1.
- Produces: nothing new; each listed control is wrapped in `OnlineOnly` (or reads `useOnline` for a form's submit).

**Spec:**
- Offline in the screens: "Online-only actions are disabled while offline, each with"
- Offline in the screens: "The sign-in screens offline say"

**Tags:** `security`, `screen`, `failure-paths`

**Knowledge:** `features/sign-in`: the sign-in screens offline. `features/groups`: which group, member and expense actions need a connection.

**Acceptance:**
- Given the network off, then each of these is disabled with "You're offline. This needs a connection.": create a group, edit a group, delete a group, add a member, edit and delete an expense, add a friend, add and edit a contact, send feedback, delete the account, download a report, register and remove a biometric device.
- Given the network off on `/sign-in/`, `/sign-up/` and `/forgot-password/`, then their buttons are disabled and "You're offline. Connect to sign in." shows.
- Given the network back on, then each control is enabled again without a reload.
- Given "Add expense" and "Settle up" offline, then they stay enabled (Task 3 queues them).
- Given each screen in the browser against the emulators, light and dark at 390 pixels, then the disabled state and its message are visible and the layout doesn't overflow.

- [ ] **Step 1: Write the failing test** for one representative control's offline state (the group delete button) in `components/offline/online-only.test.tsx` if a DOM test environment is available, else record the browser check as the test

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test`
Expected: FAIL on the disabled assertion, or the browser check showing the control enabled offline

- [ ] **Step 3: Wrap each listed control** to the Interfaces, until it passes

- [ ] **Step 4: Run it to verify it passes**

Run: `yarn test && yarn build`
Expected: PASS, then the browser check of every listed control offline

- [ ] **Step 5: Commit**

```bash
git add "app/(platform)/(app)/(screens)/groups/group-create.tsx" "app/(platform)/(app)/(forms)/groups/add/form.tsx" "app/(platform)/(app)/(forms)/groups/[id]/edit/form.tsx" "app/(platform)/(app)/(screens)/groups/[id]/settings/group-delete.tsx" "app/(platform)/(app)/(screens)/groups/[id]/add-member/add-member.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-actions.tsx" "app/(platform)/(app)/(forms)/expense/[id]/edit/form.tsx" "app/(platform)/(app)/(forms)/friends/add/search.tsx" "app/(platform)/(app)/(forms)/friends/add/contact/form.tsx" "app/(platform)/(app)/(forms)/friends/[id]/edit/contact/form.tsx" "app/(platform)/(app)/(forms)/feedback/add/form.tsx" "app/(platform)/profile/delete-account-action.tsx" "app/(platform)/(app)/(screens)/groups/[id]/_components/download-report.tsx" "app/(platform)/(app)/webauthn/register/authn-register.tsx" "app/(platform)/(app)/webauthn/register/authn-actions.tsx" "app/(platform)/(auth)/sign-in/sign-in-form.tsx" "app/(platform)/(auth)/sign-up/sign-up-form.tsx" "app/(platform)/(auth)/forgot-password/forgot-password-form.tsx"
git commit -m "Disable every change that needs a connection while offline, with a message saying so."
```
