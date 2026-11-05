# Spec: the screens on SQL Connect (spec 2b)

Date: 2026-11-05 · Branch: `feat/screens-on-sql-connect`, stacked on spec 2a's

## Why

Spec 2 moves the signed-in app onto SQL Connect and Firebase Auth in three parts. 2a (PR #12) added signing in, the
data layer's core and FCM push. This part moves every signed-in screen onto them and into the hosting build, so the
app works on Firebase Hosting with no server. 2c moves what still needs a server (reports, WebAuthn, uploads, account
deletion) into Cloud Functions and removes the server code.

Settled facts it rests on: [static build](../../knowledge/decisions/static-build-on-firebase-hosting.md) (one
prebuilt page per route with an id, reading the id in the browser), [group member
permissions](../../knowledge/decisions/group-member-permissions.md), [expense edits are description-only](../../knowledge/decisions/expense-edit-description-only.md),
[your share shows the net amount](../../knowledge/decisions/your-share-shows-net-amount.md),
[Firebase Auth](../../knowledge/decisions/firebase-auth.md) (the verify-email banner), and spec 2a's
`lib/data/`, `RequireAuth`, `useAuth`, `activityText` and `registerWebPush`.

## Scope

In: every route under `app/(platform)/(app)/` except `/webauthn/*`, and `/profile`, as hosting entries reading and
writing through SQL Connect; the signed-in shell; the verify-email banner; the routes with an id; the balances from
SQL Connect's ledger.

Out (2c): report downloads, the WebAuthn lock and its pages, image uploads, deleting an account, and removing the
server actions, `/api/app`, `actions/get-*`, Prisma and Clerk. The old `page.tsx` files stay untouched for the
normal build until 2c deletes them.

## The signed-in shell

- `app/(platform)/(app)/layout.hosting.tsx` wraps its pages in `RequireAuth`, the existing `Navbar` and
  `NavbarBottom` (moved off Clerk to `useAuth`), and the verify-email banner.
- **Verify-email banner:** shown when the signed-in person's `emailVerified` is false: "Verify your email to keep
  your account safe. Contacts others added with this email join your account once you do." with "Resend email"
  (Firebase's `sendEmailVerification`; then "Sent. Check your inbox.", the button disabled for 60 seconds) and
  "I've verified" (reloads the user and hides the banner once verified).
- The coming-soon page stays for anything not built (the WebAuthn pages until 2c).

## Routes with an id

- Each route with an id segment (`/groups/[id]`, `/groups/[id]/expense/[expenseId]`, `/friends/[id]`,
  `/activity/[id]`, `/expense/[id]/edit`, `/groups/[id]/edit`, `/groups/[id]/settle`, `/groups/[id]/settings`,
  `/groups/[id]/add-member`, `/groups/[id]/activity`, `/groups/[id]/expense`, `/friends/[id]/edit/contact`) is
  exported once, with the placeholder id `_` (`generateStaticParams` returns `[{ id: "_" }]`).
- `firebase.json` rewrites each pattern to its placeholder page before the coming-soon catch-all, for example
  `/groups/*/expense/*` → `/groups/_/expense/_/index.html` and `/groups/*` → `/groups/_/index.html`, most specific
  first.
- `hooks/use-route-ids.ts` `useRouteIds()` reads the real ids from `usePathname()` by the route's pattern, never from
  the placeholder params, and returns `null` for any id that isn't a 32-hex-digit or dashed UUID (or, for
  `/friends/[id]`, a user id of at most 128 characters).

## Reads and writes

- Each area has its hooks file in `lib/data/`: `groups.ts`, `expenses.ts`, `people.ts`, `activity.ts`,
  `feedback.ts`. A query hook wraps the generated `@dataconnect/app` operation in `useQuery` with `queryKeys`; a
  mutation hook wraps it in `useMutation`, makes its `UUID` ids with `crypto.randomUUID()`, invalidates the keys the
  change affects, and turns errors into text with `toUserMessage`.
- Search text goes through `escapeSearch` before it's sent.
- A record that comes back `null` (missing, or not the caller's) shows the screen's not-found state: "We couldn't
  find that. It may have been deleted, or you may not be a member." with a link back to `/groups`.
- Every list screen shows a skeleton while loading, an empty state, and an error state with "Try again" (refetch).
- Every form disables its submit button while sending, shows the error text above it and keeps what was typed.

## Balances

- `lib/data/ledger.ts` `toLedgerExpenses(result)` turns `GetGroupLedger`'s expenses into the
  `ExpenseWithPaymentWithSplit` shape `calcGroupSplits`, `calcExpenseSplits` and `evaluateTotals` read
  (`app/(platform)/(app)/_utils/calculation.ts`), so the split engine in `lib/splitify/` runs unchanged.
- "You owe" and "You get back" on an expense follow `yourShareInExpense`, showing the net amount.

## Screens

What each shows and does stays as today; only where its data comes from changes.

- **Groups:** `/groups` (`ListMyGroups`, search), `/groups/add` (`CreateGroup`), `/groups/[id]` (`GetGroup`,
  `GetGroupLedger` for balances, `ListGroupExpenses` paged), `/groups/[id]/edit` (`UpdateGroup`),
  `/groups/[id]/settings` (`ListGroupMembers`, `DeleteGroup` after a confirm), `/groups/[id]/add-member`
  (`ListFriends`, `AddGroupMember`), `/groups/[id]/activity` and `/groups/[id]/expense` (the group's activity and
  expense lists).
- **Expenses:** `/expense/add` (`createExpense` from `lib/data/expense-writes.ts`), `/groups/[id]/expense/[expenseId]`
  (`GetExpense`, `DeleteExpense` after a confirm), `/expense/[id]/edit` (`UpdateExpense`, description only),
  `/groups/[id]/settle` (`createSettlement`).
- **Friends:** `/friends` (`ListFriends`), `/friends/[id]` (`GetFriend`, the groups you share, "Verification pending"
  for a contact), `/friends/add` (`SearchUserByEmail` with a lower-cased email, `AddFriend`), `/friends/add/contact`
  (`CreateContact` with an `spuser_` id), `/friends/[id]/edit/contact` (`UpdateContact`).
- **Activity:** `/activity` (`ListMyActivity`, paged) and `/activity/[id]` (`GetActivity`), text from
  `activityText`.
- **Dashboard:** `/dashboard`, as today, from the groups and ledgers above.
- **Feedback:** `/feedback/add` (`UpsertMyFeedback`).
- **Profile:** `/profile`, from `useAuth()` and `GetMe`, with the notification control 2a moved to FCM, the theme
  toggle and "Sign out". Its "Delete account" button links to `/delete-account` until 2c builds the callable function.
- The group page's "Download report" button is hidden until 2c moves reports to a function.

## Testing

- Unit: `useRouteIds` for every pattern, including a placeholder `_`, a bad id and a path with extra segments;
  `toLedgerExpenses` against a ledger whose balances are known (the same expenses through the old shape and the new
  give the same `calcGroupSplits` result); each mutation hook's invalidated keys.
- Rules tests stay as 2a left them; the screens' reads and writes run against the emulators in the browser check.
- `yarn check:hosting` gains each placeholder page and a request per rewrite (`/groups/abc` serves the group page,
  `/groups/abc/expense/def` the expense page, `/webauthn/register` still the coming-soon page).
- Browser check against the emulators, light and dark at 390 pixels: sign up, create a group, add a contact and a
  friend, add them to the group, add an equal expense and an exact one, see balances, settle up, edit an
  expense's description, delete an expense, see activity, send feedback, and each screen's loading, empty,
  not-found and error states once.

## Done when

- `yarn tsc --noEmit`, `yarn lint`, `yarn test`, `yarn test:rules`, `yarn build:hosting` and `yarn check:hosting`
  pass.
- The browser check passes end to end on the emulators.
