# Spec: SQL Connect and Firebase Auth foundation

Date: 2026-11-04 · Branch: `feat/offline-pwa-firebase` · Spec 1 of 4

## Why

Splitify is being revived as an offline-first PWA on Firebase. The whole move is four specs, in order:

1. **This one, the foundation:** the SQL Connect schema and operations with their access rules, Firebase Auth, and
   the functions that must run on a server.
2. **Client data layer:** the screens read and write through the generated SQL Connect SDK and react-query, and
   sign in with Firebase Auth; server actions, `/api/app` and `actions/get-*` are removed.
3. **Static build on Firebase Hosting:** `output: "export"`, the remaining server routes as Cloud Functions, deploy,
   and the Android and iOS wrappers pointed at the new address.
4. **PWA offline-first:** service worker, a cache saved in IndexedDB, and the queue for offline expenses and
   settlements.

The decisions behind it: [SQL Connect](../../knowledge/decisions/sql-connect-database.md),
[Firebase Auth](../../knowledge/decisions/firebase-auth.md),
[static build](../../knowledge/decisions/static-build-on-firebase-hosting.md),
[offline scope](../../knowledge/decisions/offline-first-scope.md),
[Cloud Logging](../../knowledge/decisions/cloud-logging.md). The access rules are
[group member permissions](../../knowledge/decisions/group-member-permissions.md), unchanged.

## Scope

In:

- Firebase project files: `firebase.json`, `.firebaserc` (project `splitify-416321`), emulator settings.
- `dataconnect/`: the service (location `asia-south1`), the schema, connector `app` (operations the browser calls)
  and connector `admin` (`NO_ACCESS` operations only Cloud Functions call).
- The generated web SDK and admin SDK, produced by `firebase dataconnect:sdk:generate` on `postinstall` and
  ignored by git.
- `lib/firebase/`: Firebase app, Auth and SQL Connect set up in the browser, with emulator connection in
  development.
- `functions/`: its own package (Node, TypeScript, 2nd-gen functions, region `asia-south1`), with the contact-merge
  trigger.
- Tests of every access rule against the Auth and SQL Connect emulators.

Out (later specs): any screen change, the sign-in and sign-up screens, removing Prisma and Clerk from the app,
pushes, reports, UploadThing, WebAuthn functions, hosting and deploy, offline storage. The app keeps running on
Prisma and Clerk until spec 2 switches it over. App Check and rate limits are not in this spec.

## Schema

Every table from `prisma/schema.prisma` except `Log` ([Cloud Logging](../../knowledge/decisions/cloud-logging.md)).
The database starts empty, so ids need not match old data.

| Table | Key | Fields | Notes |
|---|---|---|---|
| `User` | `id: String` | `email` (unique, lower-case), `name`, `firstName`, `lastName`, `imageUrl`, `signedUp: Boolean`, `createdAt`, `updatedAt` | For a signed-up person `id` is the Firebase `auth.uid`. For a contact, `id` is `spuser_` plus a random id, and `signedUp` is false. `fromClerk` becomes `signedUp`; `uid` and `profile_image_url` are dropped (nothing reads them). |
| `Group` | `id: UUID` | `title`, `description`, `imageUrl`, `type`, `currency` (default `inr`), `mute`, timestamps | |
| `GroupMember` | (`group`, `user`) | `createdAt` | Replaces Prisma's implicit `User`–`Group` many-to-many. Cascades when the group is deleted. |
| `Friendship` | (`user`, `friend`) | `createdAt` | One row each way, as `createFriend` does today. |
| `Expense` | `id: UUID` | `amount: Float`, `currency`, `description`, `category`, `type` (`EQUAL`, `EXACT`, `PERCENT`), `tag` (`EXPENSE`, `SETTLEMENT`), `group`, `creator: User`, timestamps | Cascades when its group is deleted. |
| `UserPayment` | `id: UUID` | `amount: Float`, `user`, `expense` | Who paid. Cascades with the expense. |
| `UserSplit` | `id: UUID` | `amount: Float`, `percent: Float`, `user`, `expense` | Who owes. Cascades with the expense. |
| `Activity` | `id: UUID` | `type` (the `ActivityType` values), `actor: User`, `group: Group` (optional), `subject: User` (optional), `expenseId: UUID` (optional, no foreign key, since the expense may be deleted), `amount: Float` (optional), `title: String` (the group's or expense's name when it happened), `createdAt` | No stored message: screens and pushes build the text from these fields, so no text ever comes from the browser. Cascades with its group. |
| `Feedback` | `user` (one per user) | `title`, `description`, timestamps | |
| `AuthnDevice` | `user` (one per user) | `devices: Any` (JSON), timestamps | Read and written only through connector `admin`. |

Every `UUID` key is made in the browser (`crypto.randomUUID()`) and passed in, so an offline queue in spec 4 can
retry without creating a row twice. An insert with an existing key fails and changes nothing.

Amounts stay `Float`, as today, so `lib/splitify/` keeps working unchanged.

## Access rules

Every operation in connector `app` has `@auth(level: USER)`. Ids and emails of the caller always come from the token
(`auth.uid`, `auth.token.email`), never from variables. A record the caller may not see answers exactly as a missing
one does: `null` from a query, and the same `@check` message ("Not found") from a mutation.

Group-scoped mutations are `@transaction` and begin with a hidden lookup (`query @redact`) of the caller's
`GroupMember` row by key `{ groupId: $groupId, userId_expr: "auth.uid" }`, with `@check(expr: "this != null",
message: "Not found")`. Group-scoped queries filter on membership in the `where` with `userId: { eq_expr: "auth.uid" }`.

| Operation | Rule |
|---|---|
| `UpsertMe` | Writes the caller's `User` row from `auth.uid`, `auth.token.email` (lower-cased) and `auth.token.name`, with `signedUp: true`. |
| `GetMe` | The caller's own row. |
| `SearchUserByEmail` | Exact match on a lower-cased email; returns id, name and image only. |
| `CreateContact` | Inserts a `User` with `signedUp: false` and an `spuser_` id, and a `Friendship` both ways with the caller. Fails if the email is already taken. |
| `UpdateContact` | Only when the caller has a `Friendship` with the target and the target's `signedUp` is false. |
| `ListFriends`, `GetFriend` | Only users the caller has a `Friendship` with. |
| `AddFriend` | Inserts both `Friendship` rows; with a `groupId`, also adds the friend as a member, which needs the caller's membership. Records `Activity`. |
| `CreateGroup` | Inserts the group, the caller's `GroupMember` row and `Activity` (`GROUP_PLUS`), in one transaction. |
| `UpdateGroup` | Members only. Records `Activity` (`GROUP_UPDATE`). |
| `DeleteGroup` | Members only. Records no `Activity`, since a group's activity is deleted with it; it returns the member ids it read before deleting, which spec 2's push uses. |
| `AddGroupMember` | Members only; the new member must be the caller's friend. Records `Activity` (`MEMBER_PLUS`). |
| `ListMyGroups` | Groups the caller is a member of, newest first, with a title search and a limit. |
| `GetGroup`, `ListGroupMembers`, `ListGroupExpenses`, `GetGroupLedger` | Members only. `ListGroupExpenses` pages by limit and offset with a description search; `GetGroupLedger` returns every expense with its payments and splits, for balances. |
| `CreateExpense` | Members only. Every user named in a payment or split must be a member of the group, checked in the same transaction. `creator` is `auth.uid`. Inserts the expense, payments, splits and `Activity` (`EXPENSE_PLUS`) together. |
| `CreateSettlement` | As `CreateExpense`, with `tag: SETTLEMENT`, one payment and one split. Records `SETTLEMENT_PLUS`. |
| `UpdateExpense` | Members of the expense's group; changes the description only, as today. Records `EXPENSE_UPDATE`. |
| `DeleteExpense` | Members of the expense's group. Records `EXPENSE_MINUS`. |
| `GetExpense` | Members of the expense's group; with its payments and splits. |
| `ListMyActivity`, `GetActivity` | Activity in groups the caller is a member of, or where the caller is the actor or subject. Paged, newest first. |
| `UpsertMyFeedback` | The caller's one feedback row. |

Input limits, checked in each mutation with `@check` on `vars`: titles and names at most 100 characters,
descriptions at most 500, emails at most 254, amounts greater than 0 and at most 10,000,000, and at most 50
payments and 50 splits per expense. Whether the splits add up to the amount stays checked in the browser by the
existing zod schemas: a member who bypasses it can only write a wrong expense into a group whose expenses they may
already edit.

Connector `admin` (all `NO_ACCESS`): `FindContactByEmail`, `MergeContactIntoUser`, `GetDevices`, `SaveDevices`.

## Firebase Auth

- Sign-in methods enabled in the project: Google, and email and password.
- `lib/firebase/` uses browser persistence in IndexedDB (`indexedDBLocalPersistence`), so the user is restored with
  no network.
- After every sign-in the browser runs `UpsertMe`. Nothing else writes a signed-up person's row.

## Contact merge

A Cloud Function `mergeContactOnSignUp`, `onMutationExecuted` for operation `UpsertMe` in connector `app`, region
`asia-south1`:

1. Reads `authId` from the event and loads the Firebase user with the admin SDK. Stops unless `emailVerified` is
   true.
2. Looks for a `User` with the same email, `signedUp: false` and a different id. Stops if there is none.
3. Runs `MergeContactIntoUser` in one transaction: moves the contact's group memberships, payments, splits,
   friendships, created expenses and activity (as actor or subject) onto the new id, drops rows that would become
   duplicates (a group or friendship both already share), and deletes the contact row.

It runs again on every `UpsertMe`, so a person who verifies their email later is merged at their next sign-in, and a
second run finds nothing to do. It calls only connector `admin`, which has no trigger, so it can't trigger itself.
Failures log the cause class to Cloud Logging, without the email, and the event is retried.

## Errors

- A failed `@check` or `@auth` comes back as SQL Connect's error with the rule's message; nothing internal (SQL,
  stack) reaches the browser.
- Functions log with `firebase-functions/logger`: the operation, the cause class, and no token, email or body.

## Testing

- `yarn test:rules` runs `firebase emulators:exec --only auth,dataconnect,functions --project demo-splitify` around `vitest run --config vitest.rules.config.mts`, which covers `dataconnect/`, `functions/` and `lib/firebase/`.
- Tests sign in real emulator users (Alice, Bob, Carol) with the web SDK and call the generated operations, so
  each rule is exercised as the browser would.
- For every row of the access-rules table: a member succeeds, a non-member gets "Not found" or `null`, and the
  caller can't name another user as actor or creator.
- `CreateExpense` with a non-member in a split is rejected, and nothing from that call is written.
- Input limits: one test per limit, just over it.
- Contact merge: an unverified sign-up with a contact's email is not merged; a verified one is, every moved row
  points at the new id, a shared group leaves one membership, and a second run changes nothing.
- First task proves that a `@check` can test "every user in `vars.payments` and `vars.splits` is in this group's
  members" inside one mutation. If SQL Connect can't express it, `CreateExpense` and `CreateSettlement` become
  callable Cloud Functions that check membership and run admin mutations, and the ruling is recorded in the plan's
  ledger.

## Done when

- `firebase emulators:exec` runs every rule test, and they pass.
- `yarn tsc --noEmit` and `yarn lint` pass, with `functions/` and `dataconnect/` included.
- Nothing in the app changes behaviour: it still runs on Prisma and Clerk.
- Knowledge: a new concept `data/sql-connect` describes the schema, the two connectors and where each rule lives,
  and `domain/contact-identity` gains the verified-email merge, each with the new files under Sources.
  `data/model`, `security/auth` and `integrations/clerk` describe the running app, so they change in spec 2, when
  it switches over.
