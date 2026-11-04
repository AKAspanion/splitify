# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:implement-with-subagents by default, or ga:implement. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the open security findings and the hard-coded session secret, and clear the high and critical dependency advisories, without changing what a legitimate user sees.

**Architecture:** One membership helper in `lib/auth/membership.ts` guards every group-scoped read and write. Server actions write their `Activity` row in the same transaction as their change and send pushes after the response with Next's `after()`, so the `/api/push-notification` routes and the browser's `NotificationService` go. The Clerk webhook is verified with Clerk's `verifyWebhook`, and the WebAuthn routes share one iron-session config read from `SESSION_PASSWORD`.

**Tech Stack:** Next.js 16 App Router (server actions and route handlers), React 19, Clerk 7 (`@clerk/nextjs`), Prisma 7 with the MariaDB adapter on MySQL (`relationMode = "prisma"`), iron-session 9, SimpleWebAuthn 14, OneSignal through `lib/onesignal.ts`, zod 4, yarn 1. Vitest is added by Task 1. The repository has no CI.

**Spec:** [docs/specs/2026-11-04-security-fixes.md](../specs/2026-11-04-security-fixes.md)

## Global Constraints

- A record the caller may not see is answered exactly as a missing one: `404` from a route, `{ error: "Not found" }` from an action.
- New failure responses never carry a Prisma error, a stack trace or `error.message`; route 500s in touched files answer `{ message: "Something went wrong" }`.
- `auth()` and the membership check run before any body is parsed beyond the ids the check needs.
- Logs carry the cause and the activity type, never a request body, a secret or personal data.
- Server actions keep the shape in `knowledge/project/conventions.md` (`actions/<verb>-<noun>/index.ts`, return `{ error }` or `{ data }`, never throw to the client).
- Packages held below `latest` by `knowledge/decisions/upgrade-all-dependencies.md` (`typescript` 6.0, `prisma` 7.x, `@types/node` 24) stay where they are.
- Installs run with `--ignore-scripts`: `postinstall` runs `prisma db push` against whatever `DATABASE_URL` names. Run `npx prisma generate` after an install instead.
- Tests sit beside the file they test as `<name>.test.ts`, and mock `@/lib/db`; none touches a real database.

## Checkpoints

None: the policy's `run.checkpoints` is `none`, and the spec asks for none. The run stops only at the end, before pushing.

---

### Task 1: Foundation: Vitest, dependency cleanup, and the membership helper

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`
- Create: `vitest.config.mts`
- Create: `lib/auth/membership.ts`
- Test: `lib/auth/membership.test.ts`
- Modify: `.ga/config.json`

**Interfaces:**
- Consumes: existing `db` from `@/lib/db`.
- Produces (used by Tasks 2 and 3):

```ts
export function isGroupMember(userId: string, groupId: string): Promise<boolean>;
export function groupIdOfExpense(expenseId: string): Promise<string | null>;
export function areGroupMembers(groupId: string, userIds: string[]): Promise<boolean>;
export function isFriendOf(userId: string, otherId: string): Promise<boolean>;
```

- `package.json` gains `"test": "vitest run"`; `.ga/config.json` sets `checks.commands.test` to `yarn test` (through `ga.mjs workflow set checks.commands.test "yarn test"`).
- `vitest.config.mts` resolves the `@/` alias to the repository root and runs in the `node` environment.

**Spec:**
- §1: "`isGroupMember(userId, groupId): Promise<boolean>`: one query, `db.group.count({ where: { id: groupId, users: {
  some: { id: userId } } } })`."
- §1: "`areGroupMembers(groupId, userIds): Promise<boolean>`: true only when every distinct id is a member."
- §1: "`isFriendOf(userId, otherId): Promise<boolean>`: whether `otherId` is in `userId`'s `friends`."
- §6: "Remove `web-push`, `memorystore` and `webpack`, which nothing imports. That drops the `jws` and `bn.js` advisories."
- §6: "Done when `yarn audit` reports no high or critical advisory. A moderate or low advisory that can't be pinned
  without breaking its parent is listed in the upgrade decision with its reason."
- Testing: "Vitest is added as a dev dependency with a `test` script, and `checks.commands.test` is set to `yarn test`."

**Tags:** security

**Knowledge:**
- `project/conventions`: tests are Vitest files beside their source, `<name>.test.ts`, run by `yarn test`, mocking `@/lib/db`.
- `questions/testing-approach`: answered for now with Vitest unit tests beside the code; see the security-fixes spec.
- `decisions/upgrade-all-dependencies`: `web-push`, `memorystore` and `webpack` were removed as unused, and the transitive advisories are pinned through `resolutions`; any moderate or low advisory left is listed with its reason.

**Acceptance:**
- Given user `u1` is in group `g1`, when `isGroupMember("u1", "g1")` runs, then it returns `true`, and the `db.group.count` call's `where` names both `id: "g1"` and the user `u1`.
- Given user `u2` is not in group `g1` (the count is `0`), when `isGroupMember("u2", "g1")` runs, then it returns `false`.
- Given members `u1` and `u2` of `g1`, when `areGroupMembers("g1", ["u1", "u2", "u1"])` runs, then it returns `true` (duplicates count once).
- Given `u3` is not a member, when `areGroupMembers("g1", ["u1", "u3"])` runs, then it returns `false`.
- Given an empty list, when `areGroupMembers("g1", [])` runs, then it returns `true` without querying.
- Given expense `e1` in group `g1`, when `groupIdOfExpense("e1")` runs, then it returns `"g1"`; for an unknown id it returns `null`.
- Given `u2` is in `u1`'s friends, when `isFriendOf("u1", "u2")` runs, then it returns `true`; given they aren't friends, it returns `false`.
- After the install, `yarn audit --groups dependencies devDependencies` reports `0` high and `0` critical.

- [ ] **Step 1: Install Vitest and remove the unused packages**

Run: `yarn add -D vitest --ignore-scripts` then `yarn remove web-push memorystore webpack --ignore-scripts` then `npx prisma generate`

- [ ] **Step 2: Pin the patched transitive packages**

Add `resolutions` to `package.json` for `brace-expansion`, `minimatch`, `braces`, `micromatch`, `picomatch`, `tmp`, `uuid` and `effect`, each at the patched release within the major its parent uses (yarn 1 accepts a path such as `exceljs/**/minimatch` where two majors are in the tree). Prefer a newer `exceljs` or `uploadthing` that already pulls the fix. Run `yarn install --ignore-scripts`, then `yarn audit --summary`.

- [ ] **Step 3: Add the test script, `vitest.config.mts`, and set the test command**

Run: `node "<ga CLI path from the session start>" workflow set checks.commands.test "yarn test"`

- [ ] **Step 4: Write the failing tests** for each membership Acceptance case, in `lib/auth/membership.test.ts`, with `lib/auth/membership.ts` exporting the four functions with their real signatures and empty bodies that return the wrong value

- [ ] **Step 5: Run them to verify they fail**

Run: `yarn vitest run lib/auth/membership.test.ts`
Expected: FAIL on the assertions, not on a missing module.

- [ ] **Step 6: Implement the four functions** to the Interfaces

- [ ] **Step 7: Run them to verify they pass**

Run: `yarn vitest run lib/auth/membership.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock vitest.config.mts lib/auth/membership.ts lib/auth/membership.test.ts .ga/config.json
git commit -m "Add Vitest and the group membership helper, remove the unused web-push, memorystore and webpack, and pin patched transitive packages."
```

---

### Task 2: Membership checks on group and expense reads

**Files:**
- Modify: `app/api/app/group/[id]/expense/route.ts`
- Modify: `app/api/app/group/[id]/users/route.ts`
- Modify: `app/api/app/group/[id]/your-share/[expenseId]/route.ts`
- Modify: `app/api/app/expense/[id]/who-paid/route.ts`
- Modify: `app/api/generate/excel/expense/route.ts`
- Modify: `app/api/generate/csv/expense/route.ts`
- Modify: `app/api/generate/text/expense/route.ts`
- Modify: `actions/get-expenses/index.ts`
- Modify: `actions/get-expense/index.ts`
- Modify: `actions/get-group-users/index.ts`
- Modify: `actions/get-share/index.ts`
- Modify: `actions/get-who-paid/index.ts`
- Test: `app/api/app/group/[id]/expense/route.test.ts`
- Test: `app/api/app/expense/[id]/who-paid/route.test.ts`
- Test: `app/api/generate/csv/expense/route.test.ts`
- Test: `actions/get-expense/index.test.ts`

**Interfaces:**
- Consumes: `isGroupMember(userId, groupId)` and `groupIdOfExpense(expenseId)` from Task 1; existing `auth()` from `@clerk/nextjs/server`.
- Produces: nothing new; each handler keeps its current success response.

| Route | Request | Response | Errors |
|---|---|---|---|
| `GET /api/app/group/:id/expense` | query `page`, `limit`, `queryText` | `200 { count, expenses }` | `401` no session, `404 { message: "Not found" }` not a member or no such group |
| `GET /api/app/group/:id/users` | none | `200` as today | `401`, `404 { message: "Not found" }` |
| `GET /api/app/group/:id/your-share/:expenseId` | none | `200` as today | `401`, `404 { message: "Not found" }` when not a member, or the expense isn't in that group |
| `GET /api/app/expense/:id/who-paid` | none | `200` as today | `401`, `404 { message: "Not found" }` when not a member of the expense's group |
| `POST /api/generate/{excel,csv,text}/expense` | `{ groupId }` | the export as today | `401`, `404 { message: "Not found" }` |

**Spec:**
- §1: "Where possible the membership condition goes into the query itself"
- §1: "Nothing tells a non-member that the id"
- §1: "`GET /api/app/group/:id` and `getGroup` already check; they stay as they are."
- §5: "500 responses in the files this change touches return a fixed message, not `error.message`."

**Tags:** security

**Knowledge:**
- `findings/missing-group-membership-checks-on-reads`: fixed; every group and expense read checks the caller's membership and answers a non-member as a missing record.
- `security/roles`: reads of a group or expense are limited to the group's members.

**Acceptance:**
- Given a member of `g1`, when they `GET /api/app/group/g1/expense`, then they get `200` with `{ count, expenses }` as before.
- Given a signed-in non-member of `g1`, when they `GET /api/app/group/g1/expense`, then they get `404 { message: "Not found" }` and `db.expense.findMany` is not called.
- Given a group id that doesn't exist, when a signed-in user requests it, then the answer is the same `404 { message: "Not found" }` as for a non-member.
- Given a non-member, when they `GET /api/app/expense/e1/who-paid` for an expense in `g1`, then they get `404 { message: "Not found" }`.
- Given a non-member of `g1`, when they `POST /api/generate/csv/expense` with `{ groupId: "g1" }`, then they get `404 { message: "Not found" }` and no export is built.
- Given a non-member, when `getExpense` runs for an expense in `g1`, then it returns `{ error: "Not found" }`.
- Given the database throws, when a member calls a touched route, then it answers `500 { message: "Something went wrong" }`, without the thrown message.

- [ ] **Step 1: Write the failing tests** for each Acceptance case, in the four test files, mocking `@clerk/nextjs/server` and `@/lib/db`

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn vitest run app/api/app actions/get-expense app/api/generate/csv`
Expected: FAIL on the status and body assertions.

- [ ] **Step 3: Add the membership check** to each of the twelve handlers, in the query where it can be (`where: { id, group: { users: { some: { id: userId } } } }`), else with `isGroupMember` before the read

- [ ] **Step 4: Run them to verify they pass**

Run: `yarn vitest run app/api/app actions/get-expense app/api/generate/csv`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/api/app/group/[id]/expense/route.ts" "app/api/app/group/[id]/users/route.ts" "app/api/app/group/[id]/your-share/[expenseId]/route.ts" "app/api/app/expense/[id]/who-paid/route.ts" app/api/generate/excel/expense/route.ts app/api/generate/csv/expense/route.ts app/api/generate/text/expense/route.ts actions/get-expenses/index.ts actions/get-expense/index.ts actions/get-group-users/index.ts actions/get-share/index.ts actions/get-who-paid/index.ts "app/api/app/group/[id]/expense/route.test.ts" "app/api/app/expense/[id]/who-paid/route.test.ts" app/api/generate/csv/expense/route.test.ts actions/get-expense/index.test.ts
git commit -m "Check group membership on every group and expense read, answering a non-member as a missing record."
```

---

### Task 3: Authorised writes that record activity and send pushes themselves

**Files:**
- Create: `lib/notification/messages.ts`
- Test: `lib/notification/messages.test.ts`
- Create: `lib/notification/notify.ts`
- Modify: `actions/create-group/index.ts`
- Modify: `actions/update-group/index.ts`
- Modify: `actions/delete-group/index.ts`
- Modify: `actions/update-group-member/index.ts`
- Modify: `actions/create-friend/index.ts`
- Modify: `actions/create-expense/index.ts`
- Modify: `actions/update-expense/index.ts`
- Modify: `actions/delete-expense/index.ts`
- Modify: `actions/create-settlement/index.ts`
- Modify: `actions/update-contact/index.ts`
- Test: `actions/update-group/index.test.ts`
- Test: `actions/create-expense/index.test.ts`
- Test: `actions/update-contact/index.test.ts`
- Modify: `app/(platform)/(app)/(forms)/expense/[id]/edit/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/friends/add/action.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/edit/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/[id]/settle/(form)/form.tsx`
- Modify: `app/(platform)/(app)/(forms)/groups/add/form.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/add-member/action.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-actions.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/[id]/settings/group-delete.tsx`
- Modify: `app/(platform)/(app)/layout.tsx`
- Delete: `app/(platform)/(app)/test.tsx`
- Delete: `lib/notification/service/index.ts`
- Delete: `app/api/push-notification/route.ts`
- Delete: `app/api/push-notification/create-expense/route.ts`
- Delete: `app/api/push-notification/create-friend/route.ts`
- Delete: `app/api/push-notification/create-group/route.ts`
- Delete: `app/api/push-notification/create-settlement/route.ts`
- Delete: `app/api/push-notification/delete-expense/route.ts`
- Delete: `app/api/push-notification/delete-group/route.ts`
- Delete: `app/api/push-notification/update-expense/route.ts`
- Delete: `app/api/push-notification/update-group/route.ts`
- Delete: `app/api/push-notification/update-group-member/route.ts`
- Modify: `types/api.d.ts`

**Interfaces:**
- Consumes: `isGroupMember`, `groupIdOfExpense`, `areGroupMembers`, `isFriendOf` from Task 1; existing `sendNotification` from `lib/onesignal.ts`; existing `APILogger` from `lib/logger.ts`; `after` from `next/server`.
- Produces:

```ts
// lib/notification/messages.ts: pure; text, URL and type exactly as the deleted routes build them today
export type ActivityMessage = { type: ActivityType; message: string; heading: string; content: string; url: string };
export function groupCreated(actorName: string, group: { id: string; title: string }): ActivityMessage;
export function groupUpdated(actorName: string, group: { id: string; title: string }): ActivityMessage;
export function groupDeleted(actorName: string, groupName: string): ActivityMessage;
export function memberAdded(actorName: string, memberName: string, group: { id: string; title: string }): ActivityMessage;
export function expenseCreated(actorName: string, expense: Expense): ActivityMessage;
export function expenseUpdated(actorName: string, expense: Expense): ActivityMessage;
export function expenseDeleted(actorName: string, expense: Expense): ActivityMessage; // SETTLEMENT_MINUS when expense.settlement
export function settlementCreated(actorName: string, expense: Expense): ActivityMessage;

// lib/notification/notify.ts: schedules the pushes with after(); never throws
export function notifyAfterResponse(externalIds: string[], msg: ActivityMessage): void;
```

- Action return shapes are unchanged. A failed check returns `{ error: "Not found" }` for a group or expense the caller can't see, and `{ error: "Only members of this group can be added to an expense" }` or `{ error: "You can only add your friends to a group" }` or `{ error: "You can't edit this contact" }` for the rules below.

**Spec:**
- §1 writes table: "`createExpense` | caller is a member of `groupId`; `createrId` is the caller, the input's value is ignored; every payer and split user is a member"
- §1 writes table: "`updateGroupMember` | caller is a member, and the person added is the caller's friend (the add-member screen offers only friends)"
- §1 writes table: "`updateContact` | the contact is the caller's friend and their `fromClerk` isn't `true`"
- §1: "Validation failures return the action's existing `{ error }` shape with a fixed message; they never include a"
- §2: "For each action below, the `Activity` row is written in the same `db.$transaction` as the change, with the session's"
- §2: "`next/server`, so the action neither waits for OneSignal nor fails when it does."
- §2: "`ActivityType` of each one stay exactly as the routes in `app/api/push-notification/*` have them today:"
- §2 table: "`deleteGroup` | `GROUP_MINUS`, written after the delete in the same transaction, naming the caller | the caller"

**Tags:** security, failure-paths

**Knowledge:**
- `findings/missing-authorization-on-writes`: fixed; every write checks group membership, `createExpense` takes the caller as creator, and `updateContact` edits only the caller's non-Clerk friends.
- `findings/push-notification-open-relay`: fixed; the routes are gone and pushes are built on the server from the session's user.
- `api/push-notification`: replaced by `lib/notification/messages.ts` and `lib/notification/notify.ts`, called from the server actions.
- `features/activity-feed`, `features/notifications`, `risks/debt`: activity is written in the action's transaction; pushes go out after the response.
- `api/server-actions`: each write's membership rule, and the activity it records.

**Acceptance:**
- Given each message builder and a fixed actor, group and expense, when it runs, then its `message`, `heading`, `content`, `url` and `type` equal what the matching deleted route built (one case per builder, eight in all, the expected strings copied from the route files before they are deleted).
- Given a member of `g1`, when `updateGroup` runs for `g1`, then the group and a `GROUP_UPDATE` activity naming the caller are written in one `db.$transaction`, and `notifyAfterResponse` is called with the caller's id.
- Given a non-member of `g1`, when `updateGroup` runs for `g1`, then it returns `{ error: "Not found" }` and neither `db.group.update` nor `db.activity.create` is called.
- Given a member of `g1` whose form sends `createrId: "someone-else"`, when `createExpense` runs, then the stored expense's `createrId` is the caller's id.
- Given a split user who isn't a member of `g1`, when `createExpense` runs, then it returns `{ error: "Only members of this group can be added to an expense" }` and nothing is written.
- Given OneSignal rejects, when `createExpense` succeeds, then the action still returns `{ data }`, and one `APILogger` line records the failure with the activity type and no body.
- Given a contact who is the caller's friend and not from Clerk, when `updateContact` runs, then it updates them.
- Given a user who is not the caller's friend, or whose `fromClerk` is `true`, when `updateContact` runs on them, then it returns `{ error: "You can't edit this contact" }` and `db.user.update` isn't called.
- Given the add-member screen submits someone who isn't the caller's friend, when `updateGroupMember` runs, then it returns `{ error: "You can only add your friends to a group" }`.
- Given a member deletes `g1`, when `deleteGroup` runs, then the delete and a `GROUP_MINUS` activity naming the caller run in one transaction, in that order.
- After the task, `git grep -n "push-notification\|NotificationService"` finds nothing outside `knowledge/` and `docs/`.

- [ ] **Step 1: Copy each deleted route's message text into the messages test's expected values**, then write the failing tests for each Acceptance case in the four test files, with `messages.ts` and `notify.ts` exporting their real signatures

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn vitest run lib/notification actions/update-group actions/create-expense actions/update-contact`
Expected: FAIL on the assertions.

- [ ] **Step 3: Implement `messages.ts` and `notify.ts`**, then the membership rules, transactions and notify calls in the ten actions

- [ ] **Step 4: Remove the push routes, `NotificationService`, its calls in the nine forms, `test.tsx` and its commented import in `layout.tsx`, and the route body types in `types/api.d.ts`**

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn vitest run lib/notification actions/update-group actions/create-expense actions/update-contact`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/notification/messages.ts lib/notification/messages.test.ts lib/notification/notify.ts actions/create-group/index.ts actions/update-group/index.ts actions/delete-group/index.ts actions/update-group-member/index.ts actions/create-friend/index.ts actions/create-expense/index.ts actions/update-expense/index.ts actions/delete-expense/index.ts actions/create-settlement/index.ts actions/update-contact/index.ts actions/update-group/index.test.ts actions/create-expense/index.test.ts actions/update-contact/index.test.ts "app/(platform)/(app)/(forms)/expense/[id]/edit/form.tsx" "app/(platform)/(app)/(forms)/expense/add/(form)/form.tsx" "app/(platform)/(app)/(forms)/friends/add/action.tsx" "app/(platform)/(app)/(forms)/groups/[id]/edit/form.tsx" "app/(platform)/(app)/(forms)/groups/[id]/settle/(form)/form.tsx" "app/(platform)/(app)/(forms)/groups/add/form.tsx" "app/(platform)/(app)/(screens)/groups/[id]/add-member/action.tsx" "app/(platform)/(app)/(screens)/groups/[id]/expense/[expenseId]/expense-actions.tsx" "app/(platform)/(app)/(screens)/groups/[id]/settings/group-delete.tsx" "app/(platform)/(app)/layout.tsx" "app/(platform)/(app)/test.tsx" lib/notification/service/index.ts app/api/push-notification/route.ts app/api/push-notification/create-expense/route.ts app/api/push-notification/create-friend/route.ts app/api/push-notification/create-group/route.ts app/api/push-notification/create-settlement/route.ts app/api/push-notification/delete-expense/route.ts app/api/push-notification/delete-group/route.ts app/api/push-notification/update-expense/route.ts app/api/push-notification/update-group/route.ts app/api/push-notification/update-group-member/route.ts types/api.d.ts
git commit -m "Check membership on every write, take the creator from the session, and have the actions record activity and send pushes themselves instead of the push-notification routes."
```

---

### Task 4: Verified Clerk webhook and the WebAuthn session and counter

**Files:**
- Modify: `app/api/webhook/clerk/route.ts`
- Test: `app/api/webhook/clerk/route.test.ts`
- Create: `lib/auth/session.ts`
- Test: `lib/auth/session.test.ts`
- Modify: `app/api/webauthn/generate-authentication-options/route.ts`
- Modify: `app/api/webauthn/generate-registration-options/route.ts`
- Modify: `app/api/webauthn/verify-authentication/route.ts`
- Modify: `app/api/webauthn/verify-registration/route.ts`
- Modify: `lib/auth/service/devices.ts`
- Test: `lib/auth/service/devices.test.ts`

**Interfaces:**
- Consumes: Vitest from Task 1; existing `verifyWebhook` from `@clerk/nextjs/webhooks`; existing `getIronSession` from `iron-session`; existing `getDevice` in `lib/auth/service/devices.ts`.
- Produces:

```ts
// lib/auth/session.ts
export type ChallengeSession = { currentChallenge?: string };
export function getChallengeSession(): Promise<IronSession<ChallengeSession>>; // throws when SESSION_PASSWORD is missing or under 32 characters

// lib/auth/service/devices.ts (added to the default export)
updateCounter(userId: string, credentialId: string, newCounter: number): Promise<void>;
```

| Route | Request | Response | Errors |
|---|---|---|---|
| `POST /api/webhook/clerk` | Clerk's signed event | `200 { message: "Event received" }` | `400 { message: "Invalid signature" }` |
| `POST /api/webauthn/verify-authentication` | `AuthenticationResponseJSON` | `200 { data: { verified } }` | `401`, `400` no challenge in the session, `500 { message: "Something went wrong" }` |
| `POST /api/webauthn/verify-registration` | `RegistrationResponseJSON` | as today | `401`, `400` no challenge in the session, `500 { message: "Something went wrong" }` |

- New env keys: `CLERK_WEBHOOK_SIGNING_SECRET` (read by `verifyWebhook`) and `SESSION_PASSWORD`. Both go in `.env.sample` (Task 5) and in the deployment's environment (the developer). There is no CI or Dockerfile to add them to.

**Spec:**
- §3: "and changes nothing; the failure is logged without the body."
- §4: "It reads `SESSION_PASSWORD` and throws when it is missing or shorter than 32 characters,
  which iron-session requires; the routes then answer `500` with a generic message. The cookie name stays
  `challenge`."
- §4: "The verify routes refuse a request whose session has no challenge (`400`), instead of comparing against the string"
- §4: "After a verified authentication, `verify-authentication` saves the new counter through a new
  `DevicesService.updateCounter(userId, credentialId, newCounter)`"

**Tags:** security

**Knowledge:**
- `findings/clerk-webhook-unverified`: fixed; the webhook is verified with `CLERK_WEBHOOK_SIGNING_SECRET` before anything is read.
- `findings/hardcoded-session-password`: fixed; the password is `SESSION_PASSWORD`, and the old value in git history must not be reused.
- `findings/webauthn-counter-not-saved`: fixed; the counter is written back after each verified authentication.
- `operations/environment`, `integrations/clerk`, `api/webauthn`: the two new env keys and where they are read.

**Acceptance:**
- Given `verifyWebhook` rejects, when Clerk's webhook is called, then it answers `400 { message: "Invalid signature" }` and no `db.user` method is called.
- Given `verifyWebhook` returns a `user.created` event, when the webhook is called, then the user is written as today and it answers `200 { message: "Event received" }`.
- Given `SESSION_PASSWORD` is unset, when `getChallengeSession()` runs, then it throws; given a 31-character value it throws; given 32 characters it returns a session whose cookie name is `challenge`.
- Given a session with no `currentChallenge`, when `verify-authentication` is called, then it answers `400` and `verifyAuthenticationResponse` isn't called.
- Given a stored credential with counter `3`, when `updateCounter(userId, thatId, 7)` runs, then the stored list holds that credential with counter `7` and every other credential unchanged.
- Given a verified authentication with `newCounter` `7`, when `verify-authentication` completes, then `updateCounter` is called with the user, the credential id and `7`.

- [ ] **Step 1: Write the failing tests** for each Acceptance case in the three test files, with `session.ts` and `updateCounter` present with their real signatures

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn vitest run app/api/webhook lib/auth/session.test.ts lib/auth/service`
Expected: FAIL on the assertions.

- [ ] **Step 3: Implement** the webhook verification, `getChallengeSession`, the challenge check, `updateCounter` and its call, and replace the four inline `getIronSession` calls

- [ ] **Step 4: Run them to verify they pass**

Run: `yarn vitest run app/api/webhook lib/auth/session.test.ts lib/auth/service`
Expected: PASS, and `git grep -n "password: \""` finds nothing under `app/`.

- [ ] **Step 5: Commit**

```bash
git add app/api/webhook/clerk/route.ts app/api/webhook/clerk/route.test.ts lib/auth/session.ts lib/auth/session.test.ts app/api/webauthn/generate-authentication-options/route.ts app/api/webauthn/generate-registration-options/route.ts app/api/webauthn/verify-authentication/route.ts app/api/webauthn/verify-registration/route.ts lib/auth/service/devices.ts lib/auth/service/devices.test.ts
git commit -m "Verify the Clerk webhook's signature, read the WebAuthn session password from SESSION_PASSWORD, refuse a missing challenge, and save the passkey counter."
```

---

### Task 5: Remove the logs page, the stale public route and the committed Firebase config

**Files:**
- Delete: `app/(admin)/layout.tsx`
- Delete: `app/(admin)/logs/page.tsx`
- Delete: `app/(admin)/logs/logs-list.tsx`
- Modify: `proxy.ts`
- Modify: `.gitignore`
- Delete: `packages/ios/src/Splitify/GoogleService-Info.plist` (from git only; the local file stays)
- Create: `packages/ios/src/Splitify/GoogleService-Info.sample.plist`
- Modify: `.env.sample`

**Interfaces:**
- Consumes: existing `proxy.ts`, `.gitignore` and `.env.sample`; nothing from an earlier task.
- Produces: `.env.sample` lists `SESSION_PASSWORD` and `CLERK_WEBHOOK_SIGNING_SECRET` with empty values, and `UPLOADTHING_TOKEN` in place of `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`.

**Spec:**
- §5: "Delete `app/(admin)/` (the `/logs` page and its layout)."
- §5: "matcher from `proxy.ts`; no such route exists."
- §5: "`git rm --cached packages/ios/src/Splitify/GoogleService-Info.plist`, add the path to `.gitignore`, and commit
  `GoogleService-Info.sample.plist` with the same keys and placeholder values."
- §5: "Editing it needs the
  developer's permission, since this session can't read it."

**Tags:** security

**Knowledge:**
- `findings/admin-logs-unprotected`: fixed; the page and its route group were removed.
- `findings/committed-firebase-config`: fixed in the working tree; the file is untracked and ignored, and the key in history still needs restricting in Google Cloud.
- `security/auth`, `security/roles`, `apps/ios`, `operations/logging`, `operations/environment`: the public routes no longer list `/api/test`; `/logs` is gone; the iOS app needs the plist from the Firebase console; `.env.sample`'s new keys.

**Acceptance:**
- Given the app is running, when a signed-in user opens `/logs`, then Next answers `404`.
- Given `proxy.ts`, when its public matcher is read, then it lists `/`, `/privacy`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhook/clerk`, `/api/uploadthing` and `/api/health-check(.*)`, and not `/api/test(.*)`.
- Given the commit, when `git ls-files packages/ios/src/Splitify` runs, then it lists `GoogleService-Info.sample.plist` and not `GoogleService-Info.plist`, and `git check-ignore packages/ios/src/Splitify/GoogleService-Info.plist` prints the path.
- Given the sample plist, when its keys are compared with the real file's, then they match and every value is a placeholder.
- Given `.env.sample`, when its key names are listed, then they include `SESSION_PASSWORD`, `CLERK_WEBHOOK_SIGNING_SECRET` and `UPLOADTHING_TOKEN`, and not `UPLOADTHING_SECRET` or `UPLOADTHING_APP_ID`. If the session's permissions refuse the edit, the task reports it and the developer makes it.

- [ ] **Step 1: Write the checks** for the Acceptance cases as a list of commands in the task report (this task has no code to unit-test: it deletes files and edits config)

- [ ] **Step 2: Run them to verify they fail** against the current tree

Run: `git ls-files packages/ios/src/Splitify` and `git grep -n "api/test" proxy.ts`
Expected: the plist is listed, and `/api/test(.*)` is found.

- [ ] **Step 3: Make the removals and config edits**

- [ ] **Step 4: Run the checks to verify they pass**

Run: `git ls-files packages/ios/src/Splitify` and `git check-ignore packages/ios/src/Splitify/GoogleService-Info.plist` and `git grep -n "api/test" proxy.ts`
Expected: only the sample plist is listed, the real path is ignored, and `api/test` is not found.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/layout.tsx" "app/(admin)/logs/page.tsx" "app/(admin)/logs/logs-list.tsx" proxy.ts .gitignore packages/ios/src/Splitify/GoogleService-Info.plist packages/ios/src/Splitify/GoogleService-Info.sample.plist .env.sample
git commit -m "Remove the logs page and the stale public test route, take the iOS Firebase config out of git with a sample in its place, and list the new env keys in the sample env file."
```
