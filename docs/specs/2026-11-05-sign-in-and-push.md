# Spec: Firebase sign-in and FCM push (spec 2a)

Date: 2026-11-05 · Branch: `feat/sign-in-data-layer`

## Why

Spec 2 moves the signed-in app onto SQL Connect and Firebase Auth, in three parts, each its own pull request into
`main` and live on Firebase Hosting when it merges:

- **2a (this):** signing in with Firebase Auth, the data layer's core, and push notifications through FCM.
- **2b:** the screens (groups, members, expenses, settle up, balances, friends, contacts, activity, feedback,
  profile) on the data layer, each joining the hosting build.
- **2c:** reports, WebAuthn and uploads as Cloud Functions, account deletion as a callable function, and removing
  server actions, `/api/app`, Prisma, Clerk and `proxy.ts`.

Decisions: [Firebase Auth](../../knowledge/decisions/firebase-auth.md) (an unverified account gets in, with a
banner), [FCM](../../knowledge/decisions/firebase-cloud-messaging.md),
[public pages first](../../knowledge/decisions/public-pages-on-firebase-hosting-first.md).

## Scope

In: the auth state in the browser, the sign-in, sign-up and forgot-password screens in the hosting build, the landing
page and its navbar on Firebase Auth, the guard the signed-in routes will use, the data layer's core in `lib/data/`,
FCM token registration (browser and iOS wrapper), the push function, and the `PushToken` table.

Out: every signed-in screen (2b), the verify-email banner (it lives in the signed-in app's shell, 2b), the profile
page's "allow notifications" button (2b), removing Clerk and Prisma from the server code (2c).

## Auth state

- `components/auth/auth-provider.tsx` holds the Firebase user from `onUserChanged` (`lib/firebase/auth.ts`) and is
  mounted by `components/providers.tsx` in both builds. `hooks/use-auth.ts` reads it:
  `{ status: "loading" | "signed-out" | "signed-in", user: { uid, email, name, emailVerified } | null }`.
- `components/auth/require-auth.tsx` renders its children when signed in, a full-page spinner while loading, and
  otherwise sends the person to `/sign-in?next=<the current path>`. 2b wraps the signed-in layout in it.
- `lib/auth/next-path.ts` `safeNextPath(raw)` returns `raw` only when it starts with a single `/` and isn't `//` or
  `/\`, so a `next` from the address bar can't send someone to another site; otherwise `/groups`.

## Screens

Built from the app's own components (`components/ui/`, the public pages' `Header`), light and dark, at phone width.
Each is a hosting entry (`page.hosting.tsx`) under `app/(platform)/(auth)/`.

- **`/sign-in/`**: "Continue with Google", then email and password with "Sign in", links "Forgot password?" and
  "Create an account". A signed-in person is sent on to `next`.
- **`/sign-up/`**: name, email, password (at least 8 characters, "Use at least 8 characters."), "Create account". It
  sends Firebase's verification email, then shows "Check your inbox to verify your email. You can start using
  Splitify now." with "Continue".
- **`/forgot-password/`**: email, "Send reset link"; whatever the outcome, "If an account exists for that email, a
  reset link is on its way." so the page doesn't tell who has an account.
- After any sign-in or sign-up, `UpsertMe` runs (`lib/firebase/auth.ts` already does), then the person goes to
  `safeNextPath(next)`. Until 2b, `/groups` is the coming-soon page.
- Errors, mapped from Firebase's codes, never Firebase's own text: wrong password or no such user "That email and
  password don't match."; email already in use "An account with that email already exists. Sign in instead.";
  invalid email "Enter a valid email address."; too many requests "Too many attempts. Try again in a few minutes.";
  network "Couldn't reach Splitify. Check your connection."; Google not available in this browser (popup blocked,
  operation not supported, which the iOS WebView gives) "Google sign-in isn't available here. Use email and
  password."; anything else "Something went wrong. Try again." Buttons show a spinner and are disabled while waiting.
- Emails are trimmed before they're sent to Firebase.

## Landing page and navbar

`app/(landing)/page.tsx` and `app/(landing)/_components/navbar.tsx` read `useAuth()` in place of Clerk's `useUser`,
`ClerkLoading`, `ClerkLoaded` and `UserButton`: while loading a skeleton; signed out "Sign in" and "Sign up"; signed in
"Go to app" (`/groups`) and a "Sign out" button, which removes this device's push token, then signs out.

## Data layer core

`lib/data/` is what 2b's per-screen hooks build on:

- `lib/data/client.ts`: the SQL Connect handle (`getDataConnectClient()`), and `queryKeys`, one function per query
  operation name, so invalidation and spec 4's saved cache agree on keys.
- `lib/data/errors.ts`: `toUserMessage(error)` maps a SQL Connect error to text: a `@check` message from our rules
  ("Not found", "Only members of this group can be added to an expense", "That email is already in use",
  "You can only add your friends to a group") passes through; unauthenticated "Sign in again to continue."; network
  "Couldn't reach Splitify. Check your connection."; anything else "Something went wrong. Try again."
- `lib/data/search.ts`: `escapeSearch(text)` escapes every regular-expression character and caps the text at 100
  characters, because SQL Connect search is a case-insensitive regular expression.
- `lib/data/expense-writes.ts`: typed `createExpense(vars)` and `createSettlement(vars)` over the `expense`
  connector with `mutationRef`, since that connector has no generated SDK; their variable types match
  `dataconnect/expense/expense-writes.gql`.

## Push: tokens

- Schema: `PushToken @table(key: "token")` with `token: String!`, `user: User!`, `platform: String!` (`"web"` or
  `"ios"`), `createdAt`, `updatedAt`. Deleting a user deletes their tokens.
- Connector `app`: `RegisterMyPushToken(token, platform)` upserts the row with `user` from `auth.uid`, moving a token
  another account registered on this device to the caller; `RemoveMyPushToken(token)` deletes it only when it is the
  caller's. Token at most 4096 characters; platform only `"web"` or `"ios"`.
- Connector `admin`: `ListPushTokens(userIds)` and `DeletePushTokens(tokens)`.
- `lib/push/register.ts`:
  - `registerWebPush()`: asks for notification permission, gets a token with `getToken` from `firebase/messaging`
    using `NEXT_PUBLIC_FIREBASE_VAPID_KEY` and the service worker `public/firebase-messaging-sw.js`, and runs
    `RegisterMyPushToken(token, "web")`. Does nothing where messaging isn't supported.
  - `listenForIosToken()`: on the iOS wrapper's `push-token` event, runs `RegisterMyPushToken(detail, "ios")`,
    ignoring the wrapper's `"ERROR GET TOKEN"` detail.
  - `unregisterThisDevice()`: removes this device's token, used by sign-out.
- `app/launch.tsx` drops OneSignal: when someone is signed in, it starts `listenForIosToken()` and, if notification
  permission is already granted, `registerWebPush()`. The permission prompt itself comes with 2b's profile button.
- `react-onesignal`, `public/OneSignalSDK.sw.js` and `public/OneSignalSDKWorker.js` are removed;
  `lib/onesignal.ts` stays for the server actions until 2c removes them.
- `public/firebase-messaging-sw.js` initialises messaging from the public web config and shows the notification's
  title, body and link.

## Push: the function

- `functions/src/activity-text.ts`, free of SDK imports so 2b's activity feed can import it too:
  `activityText(activity, names)` returns `{ title, body, link }` for each `ActivityType`, from the activity's actor,
  subject, title and amount (rupee amounts as `₹ 300`). The wording follows `lib/notification/messages.ts`.
- `functions/src/push-activity.ts`, `sendActivityPush` triggered (`onMutationExecuted`, region `asia-south1`) by
  `CreateGroup`, `UpdateGroup`, `AddGroupMember`, `AddFriend`, `UpdateExpense` and `DeleteExpense` in connector `app`,
  and `CreateExpense` and `CreateSettlement` in connector `expense`:
  1. Reads the activity named by the mutation's `activityId` with the admin SDK, and stops unless its actor is the
     event's `authId`.
  2. Recipients: the group's members, or for a friend's activity without a group the subject; never the actor; none
     when the group has `mute` set.
  3. Sends the text from `activityText` to each recipient's tokens with `sendEachForMulticast`, the link as the web
     push link and the data payload; deletes tokens FCM reports `registration-token-not-registered` or
     `invalid-registration-token`.
- `DeleteGroup` also returns the group's `title`; `sendGroupDeletedPush`, triggered by it, sends `GROUP_MINUS` text to
  the `memberIds` it returned, except the actor.
- Every FCM call has a 10-second deadline. A failure logs the operation, the activity type and the count, never a
  token or text, and doesn't retry a push already sent.

## Configuration

- New public key `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (the project's Web Push certificate), in `.env.sample`; the hosting
  build reads it and the Firebase web config from repository Variables. `deploy.yml`'s configuration check requires
  `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
  `NEXT_PUBLIC_FIREBASE_APP_ID` and `NEXT_PUBLIC_FIREBASE_VAPID_KEY`; `ci.yml` falls back to demo values so pull
  requests build.
- The schema change needs a manual deploy run with `deploy_dataconnect` ticked before the functions that read
  `PushToken` work.

## Testing

- Rules (emulators): a person can register a token only as themselves, can't remove another's, re-registering a
  token moves it, the limits refuse a 4097-character token and a platform `"android"`.
- `activityText`: every `ActivityType`, with and without names.
- `sendActivityPush` and `sendGroupDeletedPush` against the emulators with a fake messaging client: recipients
  exclude the actor; a muted group sends nothing; an activity whose actor isn't the caller sends nothing; invalid
  tokens are deleted; a messaging failure is logged and doesn't throw.
- `safeNextPath`, `toUserMessage`, `escapeSearch` and the Firebase error mapping: unit tests.
- Screens: checked in the hosting build in the browser, in light and dark at 390 pixels, including each error.

## Done when

- `yarn tsc --noEmit`, `yarn lint`, `yarn test`, `yarn test:rules`, `yarn build:hosting` and `yarn check:hosting`
  pass, with `/sign-in/`, `/sign-up/` and `/forgot-password/` in the hosting output.
- On the deployed site, someone can sign up, sign in with Google and with email, reset a password and sign out.
