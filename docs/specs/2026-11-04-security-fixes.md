# Security fixes: membership checks, server-side notifications, secrets out of code

Date: 2026-11-04. Branch: `feat/security-fixes`. Comes from the security audit of the same day.

## Goal

Close the eight open security findings and the hard-coded secret, and clear the high and critical dependency
advisories, without changing what a legitimate user sees. CI/CD and a wider test suite are separate work that
follows this.

## Decisions this rests on

- [Group member permissions](../../knowledge/decisions/group-member-permissions.md): any member of a group may read
  and change it, its members and its expenses; a contact is edited only by a friend; a Clerk user by nobody else.
- [Activity and notifications in actions](../../knowledge/decisions/activity-and-notifications-in-actions.md): the
  server actions write activity and send pushes; the `/api/push-notification` routes go.
- [Remove the admin logs page](../../knowledge/decisions/remove-admin-logs-page.md).
- [Untrack the iOS Firebase config](../../knowledge/decisions/untrack-ios-firebase-config.md).
- [Upgrade all dependencies](../../knowledge/decisions/upgrade-all-dependencies.md): the packages held below
  `latest` stay where that decision put them.

## 1. Group membership guard

A new module `lib/auth/membership.ts` is the single place the membership rule lives:

- `isGroupMember(userId, groupId): Promise<boolean>`: one query, `db.group.count({ where: { id: groupId, users: {
  some: { id: userId } } } })`.
- `groupIdOfExpense(expenseId): Promise<string | null>`: the expense's `groupId`.
- `areGroupMembers(groupId, userIds): Promise<boolean>`: true only when every distinct id is a member.
- `isFriendOf(userId, otherId): Promise<boolean>`: whether `otherId` is in `userId`'s `friends`.

Where possible the membership condition goes into the query itself (`where: { id, group: { users: { some: { id:
userId } } } }`), so the check and the read can't drift apart. A record the caller may not see is answered exactly as
a missing one: `404` from a route, `{ error: "Not found" }` from an action. Nothing tells a non-member that the id
exists.

### Reads that gain the check

- Routes: `GET /api/app/group/:id/expense`, `GET /api/app/group/:id/users`,
  `GET /api/app/group/:id/your-share/:expenseId`, `GET /api/app/expense/:id/who-paid`, and the exports
  `POST /api/generate/excel/expense`, `/csv/expense`, `/text/expense`.
- Actions: `getExpenses`, `getExpense`, `getGroupUsers`, `getShare`, `getWhoPaid`.
- `GET /api/app/group/:id` and `getGroup` already check; they stay as they are.

### Writes that gain the check

| Handler | Rule |
|---|---|
| `updateGroup`, `deleteGroup` | caller is a member of the group |
| `updateGroupMember` | caller is a member, and the person added is the caller's friend (the add-member screen offers only friends) |
| `updateExpense`, `deleteExpense` | caller is a member of the expense's group |
| `createExpense` | caller is a member of `groupId`; `createrId` is the caller, the input's value is ignored; every payer and split user is a member |
| `createSettlement` | caller is a member; both people settling are members |
| `createFriend` with `groupId` | caller is a member of the group |
| `updateContact` | the contact is the caller's friend and their `fromClerk` isn't `true` |

Validation failures return the action's existing `{ error }` shape with a fixed message; they never include a
Prisma error.

## 2. Activity and notifications move into the actions

For each action below, the `Activity` row is written in the same `db.$transaction` as the change, with the session's
user as the actor, and the pushes are sent after the transaction commits through Next's `after()` from
`next/server`, so the action neither waits for OneSignal nor fails when it does. Each failed push is logged with
`APILogger` (its status and the activity type only, no body). The message text, recipients, URLs and
`ActivityType` of each one stay exactly as the routes in `app/api/push-notification/*` have them today:

| Action | Activity | Pushed to |
|---|---|---|
| `createGroup`, `updateGroup` | `GROUP_PLUS`, `GROUP_UPDATE` | the caller |
| `deleteGroup` | `GROUP_MINUS`, written after the delete in the same transaction, naming the caller | the caller |
| `updateGroupMember`, `createFriend` with a group | `MEMBER_PLUS` | the person added and the caller |
| `createExpense`, `updateExpense`, `createSettlement` | `EXPENSE_PLUS`, `EXPENSE_UPDATE`, `SETTLEMENT_PLUS` | every member |
| `deleteExpense` | `EXPENSE_MINUS`, or `SETTLEMENT_MINUS` for a settlement | every member |

The message builders move out of the route files into `lib/notification/messages.ts` as pure functions, and the
sending into `lib/notification/notify.ts`. Removed: every file under `app/api/push-notification/`,
`lib/notification/service/index.ts`, the `NotificationService` calls in the nine forms that make them, the unused
`app/(platform)/(app)/test.tsx`, and the request-body types those routes used in `types/api.d.ts`.

## 3. Clerk webhook verification

`POST /api/webhook/clerk` calls `verifyWebhook(request)` from `@clerk/nextjs/webhooks` before reading anything. It
reads the signing secret from `CLERK_WEBHOOK_SIGNING_SECRET`. A request that fails verification gets `400` with
`{ message: "Invalid signature" }` and changes nothing; the failure is logged without the body. The handling of
`user.created` and `user.updated` after that is unchanged (the [contact sign-up id
bug](../../knowledge/findings/contact-signup-keeps-contact-id.md) is out of scope).

## 4. WebAuthn session and counter

- `lib/auth/session.ts` exports `getChallengeSession()`, used by all four WebAuthn routes in place of their inline
  `getIronSession` calls. It reads `SESSION_PASSWORD` and throws when it is missing or shorter than 32 characters,
  which iron-session requires; the routes then answer `500` with a generic message. The cookie name stays
  `challenge`.
- The verify routes refuse a request whose session has no challenge (`400`), instead of comparing against the string
  `"undefined"`.
- After a verified authentication, `verify-authentication` saves the new counter through a new
  `DevicesService.updateCounter(userId, credentialId, newCounter)`, which rewrites the stored credential list with
  the one counter changed, in the stored format the [WebAuthn API](../../knowledge/api/webauthn.md) already uses.
- The old literal password stays in git history, so the value deployed as `SESSION_PASSWORD` must be a new one.
  Rotating it only invalidates in-flight challenges, which last one sign-in attempt.

## 5. Removals and config

- Delete `app/(admin)/` (the `/logs` page and its layout).
- Remove the stale public `"/api/test(.*)"` matcher from `proxy.ts`; no such route exists.
- `git rm --cached packages/ios/src/Splitify/GoogleService-Info.plist`, add the path to `.gitignore`, and commit
  `GoogleService-Info.sample.plist` with the same keys and placeholder values.
- `.env.sample` gains `SESSION_PASSWORD` and `CLERK_WEBHOOK_SIGNING_SECRET`, and replaces `UPLOADTHING_SECRET` and
  `UPLOADTHING_APP_ID` with `UPLOADTHING_TOKEN`, all with empty or placeholder values. Editing it needs the
  developer's permission, since this session can't read it.
- 500 responses in the files this change touches return a fixed message, not `error.message`.

## 6. Dependencies

- Remove `web-push`, `memorystore` and `webpack`, which nothing imports. That drops the `jws` and `bn.js` advisories.
- Add `resolutions` to `package.json` pinning patched releases, within each package's current major, of the
  transitive packages `yarn audit` flags: `brace-expansion`, `minimatch`, `braces`, `micromatch`, `picomatch`,
  `tmp`, `uuid` and `effect`. Where `exceljs` or `uploadthing` has a newer release that already pulls the fix, take
  that instead of a resolution.
- Done when `yarn audit` reports no high or critical advisory. A moderate or low advisory that can't be pinned
  without breaking its parent is listed in the upgrade decision with its reason.

## Testing

Vitest is added as a dev dependency with a `test` script, and `checks.commands.test` is set to `yarn test`.

- `lib/auth/membership.test.ts`: `isGroupMember`, `areGroupMembers` and `isFriendOf` against a mocked `db`, including
  a second user who isn't a member, a list with one non-member, and an empty list.
- `lib/notification/messages.test.ts`: each message builder gives today's text for its activity type.
- `app/api/webhook/clerk/route.test.ts`: a request with a bad signature gets `400` and touches no `db` method.
- `lib/auth/session.test.ts`: a missing or short `SESSION_PASSWORD` throws.

Then typecheck, lint and smoke at the end, and a browser pass with the developer's dev `.env`: create a group, add a
friend, add, edit and delete an expense, settle up, check each shows in the activity feed, and check that a second
account gets `404` for the first account's group URL.

## Hostile input

- Auth before parsing: every route and action calls `auth()` and the membership check before reading a body beyond
  the ids it needs; the webhook verifies before parsing.
- Every lookup checks ownership: in the query where possible, and a non-member's answer equals a missing record's.
- Errors carry no internals: see section 5.
- Body size caps, outbound deadlines and rate limits are out of scope here: the remaining routes take small JSON
  bodies under Next's default limit, and OneSignal calls run after the response.

## Out of scope

- CI/CD, and tests beyond those above.
- The [contact sign-up id](../../knowledge/findings/contact-signup-keeps-contact-id.md) bug.
- The Android build outputs tracked under `packages/android/source/app/build/`.
- Restricting or rotating the Firebase key in Google Cloud, and setting the new env keys where the app is deployed:
  the developer does these.
