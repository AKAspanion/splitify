# Firebase Sign-in and FCM Push (Spec 2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:implement-with-subagents by default, or ga:implement. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.


**Status:** complete

**Goal:** Let people sign up, sign in and out with Firebase Auth on the hosted site, give 2b a data layer to build on, and send push notifications through FCM in place of OneSignal.

**Architecture:** An auth provider in the root providers holds the Firebase user; the sign-in screens are hosting-build pages. `lib/data/` holds query keys, error text, search escaping and the `expense` connector wrappers. Devices register FCM tokens in a new `PushToken` table; a trigger function per activity-recording mutation reads the activity with the admin SDK and sends the push.

**Tech Stack:** Next.js 16 App Router (hosting build: static export of `*.hosting.tsx` entries), React 19, Tailwind with shadcn/ui, react-query 5, Firebase JS SDK (`firebase/auth`, `firebase/messaging`, `firebase/data-connect`), Firebase SQL Connect (connectors `app`, `admin`, `expense`), Cloud Functions 2nd gen in `functions/` (`firebase-admin` messaging, `onMutationExecuted`), Vitest 5 (root `yarn test`; emulator `yarn test:rules`), GitHub Actions (`ci.yml`, `deploy.yml`).

**Spec:** [docs/specs/2026-11-05-sign-in-and-push.md](../specs/2026-11-05-sign-in-and-push.md)

## Global Constraints

- Never `yarn build` or a plain `yarn install` (their scripts run `prisma db push`); install with `--ignore-scripts`. The Firebase CLI is `npx --yes firebase-tools@15.34.2`; emulator tests run on project `demo-splitify`.
- New screens are hosting entries (`page.hosting.tsx`) built from `components/ui/` and the public pages' `Header`, in light and dark mode, at a 390-pixel width without horizontal scroll.
- Text shown to people is the spec's, never a Firebase or SQL Connect error message.
- Rules in connector `app` use `@auth(expr: "auth != null && auth.token.firebase.sign_in_provider != 'anonymous'")`; identities come from `auth.uid`, never from variables; a record the caller may not touch answers `"Not found"`.
- Functions run in `asia-south1`, log the operation, the activity type and counts only, never a token, an email or a message's text, and give every FCM call a 10-second deadline.
- The normal (server) build still type-checks: `yarn tsc --noEmit` and `yarn lint` cover everything.

## Checkpoints

None: the policy's `run.checkpoints` is `none`, and the spec asks for none. The run stops only at the end, before pushing.

---

### Task 1: Foundation: the PushToken table and its operations, DeleteGroup's title, dependencies and configuration

**Files:**
- Modify: `dataconnect/schema/schema.gql`
- Create: `dataconnect/app/push-tokens.gql`
- Test: `dataconnect/app/push-tokens.test.ts`
- Create: `dataconnect/admin/push.gql`
- Modify: `dataconnect/app/groups.gql`
- Modify: `dataconnect/app/groups.test.ts`
- Modify: `package.json`
- Modify: `yarn.lock`
- Modify: `.env.sample`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: existing schema, connectors and the emulator harness (`dataconnect/test-utils/emulator.ts`).
- Produces (used by Tasks 2 to 5):

```graphql
type PushToken @table(key: "token") { token: String! user: User! platform: String! createdAt: Timestamp! updatedAt: Timestamp }
```

| Operation | Connector | Variables | Returns |
|---|---|---|---|
| `RegisterMyPushToken` | `app` | `token: String!, platform: String!` | `pushToken_upsert` key |
| `RemoveMyPushToken` | `app` | `token: String!` | deleted count (0 when not the caller's) |
| `ListPushTokens` | `admin` | `userIds: [String!]!` | `pushTokens { token user { id } platform }` |
| `DeletePushTokens` | `admin` | `tokens: [String!]!` | deleted count |
| `DeleteGroup` (changed) | `app` | `id: UUID!` | also `title` of the group, read before the delete |

- `package.json`: `react-onesignal` removed; `yarn.lock` updated with `yarn install --ignore-scripts`.
- `.env.sample`: `NEXT_PUBLIC_FIREBASE_VAPID_KEY=` beside the other `NEXT_PUBLIC_FIREBASE_*` keys.
- `ci.yml` "Hosting build" env: `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_APP_ID`, `_VAPID_KEY` from `vars.*`, each with a demo fallback (`demo-key`, `demo-splitify.firebaseapp.com`, `demo-splitify`, `1:0:web:0`, `demo-vapid-key`).
- `deploy.yml`: the configuration check also requires those five Variables, with no fallback, and the hosting build reads them.

**Spec:**
- Push: tokens: "Connector `admin`: `ListPushTokens(userIds)` and `DeletePushTokens(tokens)`."
- Push: the function: "`DeleteGroup` also returns the group's `title`; `sendGroupDeletedPush`, triggered by it, sends `GROUP_MINUS` text to"
- Push: tokens: "`react-onesignal`, `public/OneSignalSDK.sw.js` and `public/OneSignalSDKWorker.js` are removed;"
- Testing: "Rules (emulators): a person can register a token only as themselves, can't remove another's, re-registering a"

**Tags:** `security`

**Knowledge:** `data/sql-connect`: the `PushToken` table and its operations, and `DeleteGroup` returning the group's title. `operations/deploy-setup`: the five `NEXT_PUBLIC_FIREBASE_*` Variables and the manual `deploy_dataconnect` run the new table needs.

**Acceptance:**
- Given Alice signed in, when she runs `RegisterMyPushToken("tok-a", "web")`, then a `PushToken` row `tok-a` exists with user Alice and platform `"web"`.
- Given `tok-a` is Alice's, when Bob runs `RegisterMyPushToken("tok-a", "ios")`, then the row's user is Bob and its platform `"ios"` (a token belongs to whoever is signed in on that device now).
- Given `tok-a` is Alice's, when Bob runs `RemoveMyPushToken("tok-a")`, then it returns 0 and the row stays; when Alice runs it, then the row is gone.
- Given a token of 4097 characters, or a platform `"android"`, when `RegisterMyPushToken` runs, then it fails and nothing is written; 4096 characters and `"web"`/`"ios"` succeed.
- Given nobody signed in, when either `app` operation runs, then it is refused; given Alice signed in, when she calls `ListPushTokens` or `DeletePushTokens`, then each is refused; through the admin harness, `ListPushTokens([Alice])` returns her tokens and `DeletePushTokens` removes them.
- Given Alice is a member of group "Goa trip", when she runs `DeleteGroup`, then it returns the title "Goa trip" with the member ids, and the group is gone (the existing `groups.test.ts` cases still pass).
- Given the change, then `grep` finds no `react-onesignal` in `package.json`, `yarn install --frozen-lockfile --ignore-scripts` passes, and both workflows pass `npx --yes @action-validator/cli` by absolute path.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `dataconnect/app/push-tokens.test.ts` and `dataconnect/app/groups.test.ts`, with the operations declared so they fail on behaviour

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test:rules`
Expected: FAIL on the assertions in `push-tokens.test.ts` and the `DeleteGroup` title case

- [x] **Step 3: Write the schema, operations, dependency and configuration changes** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test:rules`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add dataconnect/schema/schema.gql dataconnect/app/push-tokens.gql dataconnect/app/push-tokens.test.ts dataconnect/admin/push.gql dataconnect/app/groups.gql dataconnect/app/groups.test.ts package.json yarn.lock .env.sample .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "Add the PushToken table with its operations, return the title from DeleteGroup, drop react-onesignal, and read the Firebase web config in CI and deploy."
```

---

### Task 2: Auth state, the sign-in screens, the guard, and the landing page on Firebase Auth

**Files:**
- Create: `components/auth/auth-provider.tsx`
- Create: `hooks/use-auth.ts`
- Create: `components/auth/require-auth.tsx`
- Create: `lib/auth/next-path.ts`
- Test: `lib/auth/next-path.test.ts`
- Create: `lib/auth/auth-errors.ts`
- Test: `lib/auth/auth-errors.test.ts`
- Modify: `components/providers.tsx`
- Create: `app/(platform)/(auth)/sign-in/page.hosting.tsx`
- Create: `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- Create: `app/(platform)/(auth)/sign-up/page.hosting.tsx`
- Create: `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- Create: `app/(platform)/(auth)/forgot-password/page.hosting.tsx`
- Create: `app/(platform)/(auth)/forgot-password/forgot-password-form.tsx`
- Modify: `app/(landing)/page.tsx`
- Modify: `app/(landing)/_components/navbar.tsx`
- Modify: `scripts/check-hosting-build.mjs`

**Interfaces:**
- Consumes: existing `signInWithGoogle`, `signInWithEmail`, `signUpWithEmail`, `sendPasswordReset`, `signOut` and `onUserChanged` from `lib/firebase/auth.ts`; the `DeleteGroup`-free hosting build from the merged hosting work.
- Produces (used by 2b):

```ts
// hooks/use-auth.ts
export type AuthUser = { uid: string; email: string; name: string | null; emailVerified: boolean };
export type AuthState = { status: "loading" | "signed-out" | "signed-in"; user: AuthUser | null };
export function useAuth(): AuthState;

// components/auth/require-auth.tsx
export function RequireAuth(props: { children: React.ReactNode }): JSX.Element | null;

// lib/auth/next-path.ts
export function safeNextPath(raw: string | null | undefined): string; // "/groups" unless raw is a same-site path

// lib/auth/auth-errors.ts
export function authErrorMessage(error: unknown): string;
```

**Spec:**
- Auth state: "`components/auth/require-auth.tsx` renders its children when signed in, a full-page spinner while loading, and"
- Auth state: "`lib/auth/next-path.ts` `safeNextPath(raw)` returns `raw` only when it starts with a single `/` and isn't `//` or"
- Screens: "After any sign-in or sign-up, `UpsertMe` runs (`lib/firebase/auth.ts` already does), then the person goes to"
- Screens: "Emails are trimmed before they're sent to Firebase."
- Testing: "Screens: checked in the hosting build in the browser, in light and dark at 390 pixels, including each error."

**Tags:** `security`, `screen`, `failure-paths`

**Knowledge:** `security/auth`: the browser's auth state, the sign-in, sign-up and forgot-password screens, the guard and `safeNextPath`. `features/sign-in` (new): what each screen does and says, and its error text.

**Acceptance:**
- Given `safeNextPath`, then `"/groups/abc"` returns itself; `null`, `""`, `"groups"`, `"//evil.example"`, `"/\\evil.example"`, `"https://evil.example"` and `"javascript:alert(1)"` each return `"/groups"`.
- Given Firebase errors with codes `auth/wrong-password`, `auth/user-not-found` and `auth/invalid-credential`, then `authErrorMessage` returns "That email and password don't match."; `auth/email-already-in-use` "An account with that email already exists. Sign in instead."; `auth/invalid-email` "Enter a valid email address."; `auth/too-many-requests` "Too many attempts. Try again in a few minutes."; `auth/network-request-failed` "Couldn't reach Splitify. Check your connection."; `auth/popup-blocked` and `auth/operation-not-supported-in-this-environment` "Google sign-in isn't available here. Use email and password."; any other value "Something went wrong. Try again."
- Given `/sign-in/` with the Auth emulator, when an existing person enters ` Alice@Example.test ` and the right password, then the email is sent trimmed, `UpsertMe` runs, and they land on `next` or `/groups`; with the wrong password the form shows "That email and password don't match." and keeps the email.
- Given `/sign-up/`, when the password has 7 characters, then it shows "Use at least 8 characters." without calling Firebase; with 8, it creates the account, shows "Check your inbox to verify your email. You can start using Splitify now." and "Continue"; with a taken email it shows the already-exists message.
- Given `/forgot-password/`, when any email is submitted, existing or not, then it shows "If an account exists for that email, a reset link is on its way."
- Given a request in flight on any of the three, then its button shows a spinner and is disabled.
- Given someone signed in who opens `/sign-in/?next=/groups/abc`, then they are sent to `/groups/abc` without the form.
- Given `RequireAuth` while the auth state is loading, then it renders a full-page spinner; signed out on `/groups/abc`, it sends the person to `/sign-in/?next=%2Fgroups%2Fabc`; signed in, it renders its children.
- Given the landing page and navbar, then while loading they show a skeleton, signed out "Sign in" and "Sign up", signed in "Go to app" and "Sign out"; no `@clerk/nextjs` import remains in either file.
- Given `yarn build:hosting && yarn check:hosting`, then `out/sign-in/`, `out/sign-up/` and `out/forgot-password/` exist and answer 200, and the check no longer expects `sign-in/` to be absent.
- Given each screen in the hosting build, then it is checked in the browser in light and dark at 390 pixels, with each error state shown.

- [x] **Step 1: Write the failing tests** for `safeNextPath` and `authErrorMessage` in `lib/auth/next-path.test.ts` and `lib/auth/auth-errors.test.ts`, and the hosting check's new pages in `scripts/check-hosting-build.mjs`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `next-path.test.ts` and `auth-errors.test.ts`

- [x] **Step 3: Write the provider, hook, guard, screens and landing changes** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build:hosting && yarn check:hosting`
Expected: PASS, then check each screen in the browser as the last Acceptance case says

- [x] **Step 5: Commit**

```bash
git add components/auth/auth-provider.tsx hooks/use-auth.ts components/auth/require-auth.tsx lib/auth/next-path.ts lib/auth/next-path.test.ts lib/auth/auth-errors.ts lib/auth/auth-errors.test.ts components/providers.tsx "app/(platform)/(auth)/sign-in/page.hosting.tsx" "app/(platform)/(auth)/sign-in/sign-in-form.tsx" "app/(platform)/(auth)/sign-up/page.hosting.tsx" "app/(platform)/(auth)/sign-up/sign-up-form.tsx" "app/(platform)/(auth)/forgot-password/page.hosting.tsx" "app/(platform)/(auth)/forgot-password/forgot-password-form.tsx" "app/(landing)/page.tsx" "app/(landing)/_components/navbar.tsx" scripts/check-hosting-build.mjs
git commit -m "Sign people in, up and out with Firebase Auth on the hosted site, with a guard and a safe redirect for the signed-in routes."
```

---

### Task 3: Push token registration in the browser and the iOS wrapper

**Files:**
- Create: `lib/push/register.ts`
- Test: `lib/push/register.test.ts`
- Create: `public/firebase-messaging-sw.js`
- Delete: `public/OneSignalSDK.sw.js`
- Delete: `public/OneSignalSDKWorker.js`
- Modify: `app/launch.tsx`
- Modify: `lib/firebase/auth.ts`

**Interfaces:**
- Consumes: `RegisterMyPushToken` and `RemoveMyPushToken` from Task 1 (generated `@dataconnect/app`); existing `getFirebaseApp()` and `getDataConnectClient()` from `lib/firebase/app.ts`; existing `onUserChanged`.
- Produces (used by 2b's profile button):

```ts
// lib/push/register.ts
export type PushDeps = { getToken(): Promise<string | null>; requestPermission(): Promise<NotificationPermission>; register(token: string, platform: "web" | "ios"): Promise<void>; remove(token: string): Promise<void>; storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> };
export function registerWebPush(deps?: Partial<PushDeps>): Promise<"registered" | "denied" | "unsupported">;
export function listenForIosToken(deps?: Partial<PushDeps>): () => void; // returns the unsubscribe
export function unregisterThisDevice(deps?: Partial<PushDeps>): Promise<void>;
```

This device's registered token is kept in `localStorage` under `splitify.pushToken`, so sign-out knows which to remove.

**Spec:**
- Push: tokens: "`unregisterThisDevice()`: removes this device's token, used by sign-out."
- Push: tokens: "`public/firebase-messaging-sw.js` initialises messaging from the public web config and shows the notification's"
- Push: tokens: "`react-onesignal`, `public/OneSignalSDK.sw.js` and `public/OneSignalSDKWorker.js` are removed;"

**Tags:** `security`, `failure-paths`

**Knowledge:** `features/notifications`: devices register FCM tokens on the signed-in account (browser and iOS wrapper), and sign-out removes this device's. `integrations/onesignal`: removed from the browser; the server actions keep `lib/onesignal.ts` until 2c (planned).

**Acceptance:**
- Given permission is granted and `getToken` returns `"tok-web"`, when `registerWebPush` runs, then it registers `("tok-web", "web")`, stores it under `splitify.pushToken`, and returns `"registered"`.
- Given permission is denied, then it returns `"denied"` and registers nothing; given messaging isn't supported (no `Notification` or no service worker), it returns `"unsupported"`.
- Given `getToken` or `register` rejects, then `registerWebPush` rejects nothing to its caller: it returns `"unsupported"` and logs one line without the token.
- Given `listenForIosToken` is listening, when a `push-token` event arrives with detail `"tok-ios"`, then it registers `("tok-ios", "ios")` and stores it; with detail `"ERROR GET TOKEN"` or an empty string it registers nothing; after calling the returned unsubscribe, a later event registers nothing.
- Given a stored token, when `unregisterThisDevice` runs, then it removes that token and clears the storage key; with no stored token it does nothing; when `remove` rejects, it still clears the storage key and resolves.
- Given `signOut()` in `lib/firebase/auth.ts`, then it awaits `unregisterThisDevice()` before signing out of Firebase.
- Given `app/launch.tsx` with someone signed in, then it starts `listenForIosToken()` and, only when `Notification.permission` is `"granted"`, calls `registerWebPush()`; it never prompts; it no longer imports `react-onesignal`.
- Given `public/`, then the two OneSignal worker files are gone and `firebase-messaging-sw.js` exists; `yarn build:hosting && yarn check:hosting` still pass.

- [x] **Step 1: Write the failing tests** for each `lib/push/register.ts` case in `lib/push/register.test.ts`, with fake `PushDeps`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `register.test.ts`

- [x] **Step 3: Write the registration module, the service worker, and the launch and sign-out changes** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn build:hosting && yarn check:hosting`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add lib/push/register.ts lib/push/register.test.ts public/firebase-messaging-sw.js public/OneSignalSDK.sw.js public/OneSignalSDKWorker.js app/launch.tsx lib/firebase/auth.ts
git commit -m "Register each device's FCM token on the signed-in account, from the browser and from the iOS wrapper, and remove it on sign-out."
```

---

### Task 4: The push functions

**Files:**
- Create: `functions/src/activity-text.ts`
- Test: `functions/src/activity-text.test.ts`
- Create: `functions/src/push-activity.ts`
- Test: `functions/src/push-activity.test.ts`
- Modify: `functions/src/index.ts`

**Interfaces:**
- Consumes: `ListPushTokens` and `DeletePushTokens` from Task 1 (`admin` connector, through `executeGraphql` as `merge-contact.ts` does); `DeleteGroup` returning `title` and `memberIds` (Task 1); existing `Activity`, `Group` and `GroupMember` tables.
- Produces:

```ts
// functions/src/activity-text.ts (no SDK imports)
export type ActivityForText = { type: ActivityType; title: string; amount: number | null; groupId: string | null; expenseId: string | null; actorId: string; subjectId: string | null };
export type PushText = { title: string; body: string; link: string };
export function activityText(activity: ActivityForText, names: { actor: string | null; subject: string | null }): PushText;

// functions/src/push-activity.ts
export type Messaging = { sendEachForMulticast(message: { tokens: string[]; notification: { title: string; body: string }; webpush: { fcmOptions: { link: string } }; data: Record<string, string> }): Promise<{ responses: { success: boolean; error?: { code: string } }[] }> };
export function pushForActivity(activityId: string, authId: string, messaging: Messaging): Promise<{ sent: number; removed: number; skipped?: "actor-mismatch" | "muted" | "no-recipients" }>;
export function pushForDeletedGroup(title: string, memberIds: string[], authId: string, messaging: Messaging): Promise<{ sent: number; removed: number }>;
export const sendActivityPushApp: import("firebase-functions").CloudFunction<unknown>;     // connector "app", operations CreateGroup, UpdateGroup, AddGroupMember, AddFriend, UpdateExpense, DeleteExpense
export const sendActivityPushExpense: import("firebase-functions").CloudFunction<unknown>; // connector "expense", operations CreateExpense, CreateSettlement
export const sendGroupDeletedPush: import("firebase-functions").CloudFunction<unknown>;    // connector "app", operation DeleteGroup
```

Links: a group's activity `/groups/<groupId>`, an expense's `/groups/<groupId>/expense/<expenseId>`, a friend's `/friends/<subjectId>`.

**Spec:**
- Push: the function: "`functions/src/activity-text.ts`, free of SDK imports so 2b's activity feed can import it too:"
- Push: the function: "`functions/src/push-activity.ts`, `sendActivityPush` triggered (`onMutationExecuted`, region `asia-south1`) by"
- Push: the function: "Every FCM call has a 10-second deadline. A failure logs the operation, the activity type and the count, never a"
- Testing: "`sendActivityPush` and `sendGroupDeletedPush` against the emulators with a fake messaging client: recipients"

**Tags:** `security`, `failure-paths`

**Knowledge:** `apps/functions`: the push functions, their triggers and what they read, who gets a push for each change, muted groups, and dead-token cleanup.

**Acceptance:**
- Given each `ActivityType`, when `activityText` runs with names, then the title and body follow `lib/notification/messages.ts`'s wording (for example `EXPENSE_PLUS` with actor "Alice", title "Dinner" and amount 300: body "Alice added Dinner for ₹ 300"); with null names it uses "Someone"; the link follows the rules above.
- Given group G with Alice, Bob and Carol, each with one token, when `pushForActivity` runs for Alice's `EXPENSE_PLUS` activity with `authId` Alice, then one multicast goes to Bob's and Carol's tokens only, and it returns `sent: 2`.
- Given the activity's actor is Alice but `authId` is Bob, then nothing is sent and it returns `skipped: "actor-mismatch"`.
- Given G has `mute: true`, then nothing is sent and it returns `skipped: "muted"`.
- Given a friend's `USER` activity with no group, then only the subject's tokens get it.
- Given FCM answers `messaging/registration-token-not-registered` for Bob's token, then `DeletePushTokens` removes it and the result counts `removed: 1`.
- Given the messaging client rejects, or takes longer than 10 seconds, then `pushForActivity` resolves without sending, and one log line names the operation and the activity type, with no token or text.
- Given `pushForDeletedGroup("Goa trip", [Alice, Bob], Alice, …)`, then Bob's tokens get `GROUP_MINUS` text naming "Goa trip", Alice's get nothing.
- Given `functions/src/index.ts`, then the three triggers are exported beside `mergeContactOnSignUp` and `billingKillSwitch`, each in `asia-south1` with the connectors and operations above (read from their endpoint options), and `yarn --cwd functions build` exits 0.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `functions/src/activity-text.test.ts` and `functions/src/push-activity.test.ts`, with a fake `Messaging` and the emulator harness

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test:rules`
Expected: FAIL on the assertions in `activity-text.test.ts` and `push-activity.test.ts`

- [x] **Step 3: Write the text builder, the push logic and the triggers** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test:rules`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add functions/src/activity-text.ts functions/src/activity-text.test.ts functions/src/push-activity.ts functions/src/push-activity.test.ts functions/src/index.ts
git commit -m "Send each change's push through FCM from a trigger function, to every member but the actor, and clean up dead tokens."
```

---

### Task 5: The data layer's core

**Files:**
- Create: `lib/data/client.ts`
- Create: `lib/data/errors.ts`
- Test: `lib/data/errors.test.ts`
- Create: `lib/data/search.ts`
- Test: `lib/data/search.test.ts`
- Create: `lib/data/expense-writes.ts`
- Test: `lib/data/expense-writes.test.ts`

**Interfaces:**
- Consumes: existing `getDataConnectClient()` (`lib/firebase/app.ts`) and the generated `@dataconnect/app` operation names; existing `dataconnect/expense/expense-writes.gql` variables.
- Produces (used by 2b):

```ts
// lib/data/client.ts
export function dc(): import("firebase/data-connect").DataConnect;
export const queryKeys: Record<string, (...args: unknown[]) => readonly unknown[]>; // one entry per query operation in connector app, keyed by its name, e.g. queryKeys.ListMyGroups({ search, limit })

// lib/data/errors.ts
export function toUserMessage(error: unknown): string;

// lib/data/search.ts
export function escapeSearch(text: string): string;

// lib/data/expense-writes.ts
export type CreateExpenseVars = { id: string; groupId: string; amount: number; description: string; category?: string | null; type: "EQUAL" | "EXACT" | "PERCENT"; payments: { id: string; userId: string; amount: number }[]; splits: { id: string; userId: string; amount: number; percent?: number | null }[]; activityId: string };
export type CreateSettlementVars = { id: string; groupId: string; amount: number; fromUserId: string; toUserId: string; paymentId: string; splitId: string; activityId: string };
export function createExpense(vars: CreateExpenseVars): Promise<{ id: string }>;
export function createSettlement(vars: CreateSettlementVars): Promise<{ id: string }>;
```

**Spec:**
- Data layer core: "`lib/data/client.ts`: the SQL Connect handle (`getDataConnectClient()`), and `queryKeys`, one function per query"
- Data layer core: "`lib/data/search.ts`: `escapeSearch(text)` escapes every regular-expression character and caps the text at 100"
- Data layer core: "`lib/data/expense-writes.ts`: typed `createExpense(vars)` and `createSettlement(vars)` over the `expense`"

**Tags:** `security`, `failure-paths`

**Knowledge:** `data/sql-connect`: where the browser's data layer lives, its query keys, error text and search escaping, and that the `expense` connector is called through typed `mutationRef` wrappers.

**Acceptance:**
- Given an error carrying a `@check` message "Not found", "Only members of this group can be added to an expense", "That email is already in use" or "You can only add your friends to a group", then `toUserMessage` returns that message unchanged.
- Given an unauthenticated error, then it returns "Sign in again to continue."; a network failure "Couldn't reach Splitify. Check your connection."; anything else, including a SQL error's text, "Something went wrong. Try again."
- Given `escapeSearch("a.b*(c)?[d]{e}|f^g$h\\i+")`, then every special character is backslash-escaped and the result matched as a regular expression finds only that literal text; a 150-character input is cut to 100 characters before escaping; `"taxi"` comes back as `"taxi"`.
- Given `queryKeys.ListMyGroups({ search: "goa", limit: 6 })`, then it returns `["ListMyGroups", { search: "goa", limit: 6 }]`, and there is one entry for each query operation in `dataconnect/app/*.gql`.
- Given `createExpense` against the emulators with Alice signed in and a group she shares with Bob, then the expense is written and `{ id }` returned; with Carol in a split it rejects, and `toUserMessage` of the rejection is "Only members of this group can be added to an expense". The same for `createSettlement`.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `lib/data/errors.test.ts`, `lib/data/search.test.ts` and `lib/data/expense-writes.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test`
Expected: FAIL on the assertions in `errors.test.ts` and `search.test.ts` (`expense-writes.test.ts` runs under `yarn test:rules`)

- [x] **Step 3: Write the data layer modules** to the Interfaces, until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test && yarn test:rules`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add lib/data/client.ts lib/data/errors.ts lib/data/errors.test.ts lib/data/search.ts lib/data/search.test.ts lib/data/expense-writes.ts lib/data/expense-writes.test.ts
git commit -m "Add the data layer's core: query keys, people-facing error text, search escaping, and typed wrappers for the expense writes."
```
