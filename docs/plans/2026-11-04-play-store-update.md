# Play Store Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:implement-with-subagents by default, or ga:implement. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** complete

**Goal:** Make the Android app `in.spanion.splitify.twa` updatable on Google Play: target API 36, both signing keys in the asset links, a privacy policy and a public deletion page Play can read, and account deletion that anonymises the person.

**Architecture:** One shared function, `anonymiseUser`, holds the whole anonymisation rule and runs inside a Prisma interactive transaction. Two entry points call it: a `deleteAccount` server action behind a button on the profile page, and the Clerk webhook's `user.deleted` event. The privacy and deletion pages are static server pages, public in `proxy.ts`. The Android project is upgraded in place by editing its Gradle files and manifest.

**Tech Stack:** Next.js 16 App Router, Prisma (MySQL, client generated into `generated/prisma`), Clerk 7 (`@clerk/nextjs`), OneSignal REST API, Vitest, shadcn `Dialog` and `Button` from `components/ui/`; the Android Trusted Web Activity with Gradle, the Android Gradle Plugin and `androidbrowserhelper`. No CI in the repository.

**Spec:** [docs/specs/2026-11-04-play-store-update.md](../specs/2026-11-04-play-store-update.md)

## Global Constraints

- Host stays `splitify.spanion.in`; no host name changes anywhere ([decision](../../knowledge/decisions/keep-splitify-spanion-domain.md)).
- A deleted person's group memberships, expenses, payments and splits are never deleted or changed, except that a group whose only member is that person is deleted ([decision](../../knowledge/decisions/anonymise-deleted-accounts.md)).
- Server actions follow `knowledge/project/conventions.md`: a folder `actions/<verb>-<noun>/` with `index.ts`, `schema.ts` and `types.ts`; they return `{ error }` and never throw to the client.
- Prisma types come from `@/generated/prisma/browser`; only `lib/db.ts` imports `@/generated/prisma/client`.
- The upload keystore in `~/keys/splitify/` and its password never enter the repository or a command an agent runs; signing is the developer's step.
- Each test file is run alone, by name, with `yarn test <file>`.

## Checkpoints

None: the policy's `run.checkpoints` is `none`, and the spec asks for none.

---

### Task 1: The anonymiser and OneSignal user deletion

**Files:**
- Create: `lib/account/anonymise.ts`
- Test: `lib/account/anonymise.test.ts`
- Modify: `lib/onesignal.ts`
- Test: `lib/onesignal.test.ts`

**Interfaces:**
- Consumes: existing `db` from `lib/db.ts`; existing `Authorization` and `app_id` constants in `lib/onesignal.ts`.
- Produces (Tasks 2 and 3 rely on these names and types):

```ts
// lib/account/anonymise.ts
export const DELETED_NAME = "Deleted user";
export const DELETED_EMAIL_DOMAIN = "deleted.invalid";
export const PLACEHOLDER_AVATAR = "/images/placeholder/avatar.jpeg";

/** The client Prisma passes to an interactive `db.$transaction(async (tx) => …)` callback. */
export type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export function anonymiseUser(
  tx: TransactionClient,
  userId: string,
): Promise<{ anonymised: boolean }>;

// lib/onesignal.ts
export function deleteOneSignalUser(externalId: string): Promise<{ ok: boolean }>;
```

`anonymiseUser` returns `{ anonymised: false }` for a missing or already anonymised row, `{ anonymised: true }` after
changing one. `deleteOneSignalUser` sends `DELETE https://api.onesignal.com/apps/<app_id>/users/by/external_id/<externalId>`
(the id URL-encoded) with the module's existing `Authorization` header, and resolves `{ ok: true }` on a 2xx or a
`404`, `{ ok: false }` on any other status or a network error. It never throws.

**Spec:**
- §4: "Reads the row's `name` and the ids of its groups. A missing row, or one already anonymised (its email ends in
   `@deleted.invalid`), returns without changing anything, so running it twice is harmless."
- §4: "Deletes each group whose only member is this person (cascading its expenses and activity): nobody else's data is
   in it."
- §4: "replaces the person's `name` with `Deleted user` in `Activity.message`"
- §4: "Skipped when the name is empty."
- §4: "Deletes the person's `AuthnDevice` and `Feedback` rows."
- §4: "Clears `friends` and `symmetricFriends`, so the friendship goes in both directions."
- §4: "Group membership, expenses (including those the person created), payments and splits are not touched."
- §4: "It never
     throws; a failure is logged with `APILogger.error` and doesn't fail the deletion."
- §4 Hostile input: "The `REPLACE` takes the name as a bound parameter, never spliced into SQL."

**Tags:** security, failure-paths

**Knowledge:** `features/account-deletion`: what anonymising removes and keeps; `integrations/onesignal`: a deleted
account's OneSignal user is deleted by external id; `security/data-protection`: deletion anonymises the row and keeps
shared expenses.

**Acceptance:**
- Given a user `user_1` named `Asha Rao` in groups `g1` (members `user_1`, `user_2`) and `g2` (only `user_1`), when
  `anonymiseUser(tx, "user_1")` runs, then `tx.group.deleteMany` deletes `g2` only, and it returns `{ anonymised: true }`.
- Given the same user, then the activity rewrite runs once through `tx.$executeRaw` as a tagged template whose bound
  values include `Asha Rao` and `g1`, and the SQL text contains neither `Asha Rao` nor `g2`.
- Given the same user, then `tx.authnDevice.deleteMany` and `tx.feedback.deleteMany` are called with
  `{ where: { userId: "user_1" } }`.
- Given the same user, then `tx.user.update` sets `name` `Deleted user`, `firstName` `Deleted`, `lastName` `user`,
  `email` `deleted-user_1@deleted.invalid`, `image_url` and `profile_image_url` `/images/placeholder/avatar.jpeg`,
  `fromClerk` `false`, `friends: { set: [] }` and `symmetricFriends: { set: [] }`.
- Given a user whose `name` is `""` or `"   "`, when it runs, then `tx.$executeRaw` isn't called and the row is still
  anonymised.
- Given a user whose email is `deleted-user_1@deleted.invalid`, when it runs, then nothing is deleted or updated and it
  returns `{ anonymised: false }`.
- Given no row for the id, when it runs, then nothing is deleted or updated and it returns `{ anonymised: false }`.
- Given a run, then no `expense`, `userPayment` or `userSplit` method is called, and `group` is never updated.
- Given OneSignal answers `200`, when `deleteOneSignalUser("user_1")` runs, then `fetch` was called once with method
  `DELETE` and URL `https://api.onesignal.com/apps/<app_id>/users/by/external_id/user_1`, and it resolves `{ ok: true }`.
- Given OneSignal answers `404`, then it resolves `{ ok: true }`; given `500`, `{ ok: false }`.
- Given `fetch` rejects, then `deleteOneSignalUser` resolves `{ ok: false }` and doesn't throw.
- Given an external id `a/b`, then the URL ends with `external_id/a%2Fb`.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `lib/account/anonymise.test.ts` (with a hand-made
  mock `tx`) and `lib/onesignal.test.ts` (with `fetch` stubbed by `vi.stubGlobal`). Create both functions first with
  their real signatures and bodies that do nothing, so the tests fail on behaviour.

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test lib/account/anonymise.test.ts`
Expected: FAIL on the assertions

- [x] **Step 3: Run the OneSignal tests to verify they fail**

Run: `yarn test lib/onesignal.test.ts`
Expected: FAIL on the assertions

- [x] **Step 4: Write the minimal implementation** to the Interfaces, until they pass. The group lookup reads each of
  the person's groups with its member count (`_count.users`); the activity rewrite is a single `tx.$executeRaw` using
  `Prisma.join` for the group ids.

- [x] **Step 5: Run the anonymiser tests to verify they pass**

Run: `yarn test lib/account/anonymise.test.ts`
Expected: PASS

- [x] **Step 6: Run the OneSignal tests to verify they pass**

Run: `yarn test lib/onesignal.test.ts`
Expected: PASS

- [x] **Step 7: Commit**

```bash
git add lib/account/anonymise.ts lib/account/anonymise.test.ts lib/onesignal.ts lib/onesignal.test.ts
git commit -m "Add anonymiseUser, which removes what identifies a person and keeps their shared expenses, and deleteOneSignalUser."
```

### Task 2: The Delete account action and button

**Files:**
- Create: `actions/delete-account/index.ts`
- Create: `actions/delete-account/schema.ts`
- Create: `actions/delete-account/types.ts`
- Test: `actions/delete-account/index.test.ts`
- Create: `app/(platform)/profile/delete-account-action.tsx`
- Modify: `app/(platform)/profile/page.tsx`

**Interfaces:**
- Consumes: `anonymiseUser`, `TransactionClient` from Task 1; `deleteOneSignalUser` from Task 1; existing
  `createSafeAction` from `lib/safe-actions.ts`; existing `useAction` from `hooks/use-action.ts`; existing `Dialog` and
  `Button` from `components/ui/`; existing `APILogger` from `lib/logger.ts`.
- Produces:

```ts
// actions/delete-account/schema.ts
export const DeleteAccount: z.ZodObject<{}>;

// actions/delete-account/types.ts
export type InputType = z.infer<typeof DeleteAccount>;
export type ReturnType = ActionState<InputType, { deleted: true }>;

// actions/delete-account/index.ts
export const deleteAccount: (data: InputType) => Promise<ReturnType>;
```

The handler: `auth()`; finds the row by the session's `userId`, else by the primary email address of `currentUser()`;
then one `db.$transaction(async (tx) => …, { timeout: 15000 })` that runs `anonymiseUser` on the row found (skipped
when none) and, last, `(await clerkClient()).users.deleteUser(userId)`; after the commit, `deleteOneSignalUser(userId)`,
logging `{ ok: false }` with `APILogger.error`.

**Spec:**
- §4: "`auth()`; no session is"
- §4: "Finds the row: by the session's `userId`, or, when there is none, by the primary email of `currentUser()`."
- §4: "No row found still deletes the Clerk
     account."
- §4: "In one interactive transaction (timeout `15000` ms): `anonymiseUser`, then the Clerk account is deleted with
     `(await clerkClient()).users.deleteUser(userId)` as the last step."
- §4: "If Clerk refuses, the transaction rolls back"
- §4: "with nothing changed."
- §4: "Returns `{ data: { deleted: true } }`. The page then signs out and goes to `/`."
- §4: "The action takes no input: a person can only delete their own account."
- §4: "`app/(platform)/profile/page.tsx` gains a destructive **Delete account** button below the existing actions. It opens
  a `Dialog` that says what is removed and what other members keep, with **Cancel** and **Delete my account**."

**Tags:** security, failure-paths

**Knowledge:** `features/account-deletion`: the profile page's Delete account button runs `deleteAccount`, which
deletes the Clerk account in the same transaction; `domain/contact-identity`: deletion finds a merged contact's row by
the Clerk account's email.

**Acceptance:**
- Given no session, when `deleteAccount({})` runs, then it returns `{ error: "Unauthorized" }` and neither
  `db.$transaction` nor Clerk's `deleteUser` is called.
- Given a session `user_1` with a `User` row `user_1`, when it runs, then `anonymiseUser` gets `user_1`, Clerk's
  `deleteUser` gets `user_1` after it, `deleteOneSignalUser` gets `user_1`, and it returns `{ data: { deleted: true } }`.
- Given a session `user_1` with no row `user_1` and a Clerk primary email `asha@example.com` whose row is
  `spuser_9`, when it runs, then `anonymiseUser` gets `spuser_9` and Clerk's `deleteUser` gets `user_1`.
- Given a session with no row by id or by email, when it runs, then `anonymiseUser` isn't called, Clerk's `deleteUser`
  still gets the session id, and it returns `{ data: { deleted: true } }`.
- Given Clerk's `deleteUser` rejects, when it runs, then the error propagates out of the transaction callback, it
  returns `{ error: "Couldn't delete your account. Try again." }`, and `deleteOneSignalUser` isn't called.
- Given `deleteOneSignalUser` resolves `{ ok: false }`, when it runs, then `APILogger.error` is called and it still
  returns `{ data: { deleted: true } }`.
- Given an input with extra fields such as `{ userId: "user_2" }`, when it runs for session `user_1`, then only
  `user_1` is anonymised and deleted.
- Given the transaction call, then its options include `timeout: 15000`.

- [x] **Step 1: Write the failing tests** for each Acceptance case in `actions/delete-account/index.test.ts`, mocking
  `@clerk/nextjs/server` (`auth`, `currentUser`, `clerkClient`), `@/lib/db`, `@/lib/account/anonymise`,
  `@/lib/onesignal` and `@/lib/logger` the way `actions/create-expense/index.test.ts` does. Create the action files
  first with a handler that returns `{ error: "Unauthorized" }`, so the tests fail on behaviour.

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test actions/delete-account/index.test.ts`
Expected: FAIL on the assertions

- [x] **Step 3: Write the minimal action implementation** to the Interfaces, until the tests pass.

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test actions/delete-account/index.test.ts`
Expected: PASS

- [x] **Step 5: Build the button.** `delete-account-action.tsx` is a `"use client"` component: a `Button` with
  `variant="destructive"` and the text `Delete account`, opening a `Dialog` titled `Delete your account?` whose
  description reads `Your name, email, picture, passkey, friends and feedback are removed. Expenses you share with
  others stay in their groups under "Deleted user". This can't be undone.`, with `Cancel` (closes) and
  `Delete my account` (runs `deleteAccount` through `useAction`, disabled while it runs). On success it calls Clerk's
  `signOut` and routes to `/`; on error it shows the error with a `sonner` toast and keeps the dialog open. Place it
  in `page.tsx` in the row with Biometrics and notifications.

- [x] **Step 6: Commit**

```bash
git add actions/delete-account/index.ts actions/delete-account/schema.ts actions/delete-account/types.ts actions/delete-account/index.test.ts "app/(platform)/profile/delete-account-action.tsx" "app/(platform)/profile/page.tsx"
git commit -m "Let a person delete their account from the profile page: the action anonymises their row and deletes the Clerk account in one transaction."
```

### Task 3: The webhook's user.deleted event

**Files:**
- Modify: `app/api/webhook/clerk/route.ts`
- Test: `app/api/webhook/clerk/route.test.ts`

**Interfaces:**
- Consumes: `anonymiseUser` from Task 1; existing `verifyWebhook` from `@clerk/nextjs/webhooks`; existing `db` from
  `lib/db.ts`.
- Produces: nothing new for other tasks. Route contract:

| Route | Request | Response | Errors |
|---|---|---|---|
| `POST /api/webhook/clerk` | Svix-signed Clerk event; `user.deleted` carries `data.id` | `200 { message: "Event received" }` | `400 { message: "Invalid signature" }`, `500 { message: "Something went wrong" }` |

**Spec:**
- §4: "`POST /api/webhook/clerk` handles `user.deleted`, for an account deleted from Clerk's dashboard. It runs"
- §4: "inside a transaction, before the existing email lookup (a `user.deleted` event carries"
- §4: "An event for an unknown or already anonymised id answers `200`, as any other handled event. The signature"
- §4: "check stays first."

**Tags:** security, failure-paths

**Knowledge:** `integrations/clerk`: the webhook handles `user.deleted` by anonymising the row with that id.

**Acceptance:**
- Given a verified `user.deleted` event with `data.id` `user_1`, when it is posted, then `anonymiseUser` runs on
  `user_1` inside `db.$transaction`, no `db.user.findUnique`, `create` or `upsert` is called, and it answers `200`.
- Given `anonymiseUser` resolves `{ anonymised: false }` (unknown or already anonymised), then it still answers `200`.
- Given `verifyWebhook` rejects, when any event is posted, then it answers `400` with `{ message: "Invalid signature" }`
  and `anonymiseUser` isn't called.
- Given a verified `user.deleted` event with no `data.id`, then `anonymiseUser` isn't called and it answers `200`.
- Given `anonymiseUser` rejects, then it answers `500` with `{ message: "Something went wrong" }`.
- Given a verified `user.updated` event, then the existing upsert path runs as before and `anonymiseUser` isn't called.

- [x] **Step 1: Write the failing tests** for each Acceptance case in `app/api/webhook/clerk/route.test.ts`, mocking
  `@clerk/nextjs/webhooks`, `@/lib/db` and `@/lib/account/anonymise`.

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test app/api/webhook/clerk/route.test.ts`
Expected: FAIL on the `user.deleted` assertions

- [x] **Step 3: Write the minimal implementation**: a `user.deleted` branch right after the signature check, before
  the email lookup, until the tests pass.

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test app/api/webhook/clerk/route.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add app/api/webhook/clerk/route.ts app/api/webhook/clerk/route.test.ts
git commit -m "Anonymise the user when Clerk's webhook reports the account deleted."
```

### Task 4: Privacy policy, deletion page and asset links

**Files:**
- Modify: `app/(platform)/privacy/page.tsx`
- Create: `app/(platform)/delete-account/page.tsx`
- Modify: `proxy.ts`
- Modify: `public/.well-known/assetlinks.json`
- Test: `proxy.test.ts`

**Interfaces:**
- Consumes: existing `Header` from `components/container/header`.
- Produces: the public routes `GET /privacy` and `GET /delete-account`; nothing other tasks import. To test the public
  list, `proxy.ts` exports it:

```ts
// proxy.ts
export const isPublicRoute: (req: NextRequest) => boolean;
```

**Spec:**
- §2: "`public/.well-known/assetlinks.json` lists both certificates for `in.spanion.splitify.twa`"
- §3: "`app/(platform)/privacy/page.tsx` is rewritten as headings and paragraphs instead of one `<pre>` block, with the same"
- §3: "It stays public in `proxy.ts`."
- §3: "**Effective date:** 4 November 2026."
- §3: "**Who handles it:** Clerk (accounts and sign-in), Vercel (hosting, analytics and performance), OneSignal (push
  notifications), UploadThing (image uploads), and Google AdSense, which may show ads and use cookies to do so."
- §3: "**Contact:** `panditankit1995@gmail.com`, the address the current policy gives."
- §4: "A new page `app/(platform)/delete-account/page.tsx`, public in `proxy.ts` as `/delete-account`, laid out like the"
- §4: "the URL Play's Data safety form asks for: `https://splitify.spanion.in/delete-account`."

**Tags:** security

**Knowledge:** `features/privacy-policy`: `/privacy` names Clerk, Vercel, OneSignal, UploadThing and Google AdSense,
and the public `/delete-account` page explains deletion for people outside the app.

**Acceptance:**
- Given a request for `/delete-account`, then `isPublicRoute` is true; given `/privacy`, true; given
  `/delete-account-x`, `/groups` or `/profile`, false.
- Given `public/.well-known/assetlinks.json`, then it parses as JSON with one statement for `in.spanion.splitify.twa`
  whose `sha256_cert_fingerprints` are exactly
  `CC:62:1F:79:79:89:D1:A7:79:D8:91:87:40:43:53:A8:6E:A8:73:26:F4:95:E9:48:40:9D:2D:4E:89:79:D6:99` and
  `B4:EB:FC:ED:F5:F7:69:3F:9C:25:9A:21:F0:B7:C4:11:1D:A7:80:0F:0A:01:8C:12:A4:2E:18:3A:4E:D6:67:C9`.
- Given the privacy page, then it has no `<pre>`, and its text includes `4 November 2026`, `Clerk`, `Vercel`,
  `OneSignal`, `UploadThing`, `Google AdSense`, `Deleted user`, `/delete-account` and `panditankit1995@gmail.com`,
  covering every bullet of spec §3 in that order, and states no retention period for server logs.
- Given the deletion page, then its text says how to delete in the app (`Profile`, then `Delete account`), what is
  removed and what other members keep, and that someone who can't sign in can email `panditankit1995@gmail.com` from
  the account's email address.

- [x] **Step 1: Write the failing tests** in `proxy.test.ts` for the `isPublicRoute` cases and the asset links file
  (read with `fs`, parsed, compared). Export `isPublicRoute` first, so the tests fail on behaviour.

- [x] **Step 2: Run them to verify they fail**

Run: `yarn test proxy.test.ts`
Expected: FAIL on `/delete-account` and the fingerprints

- [x] **Step 3: Add `/delete-account` to the public routes and both fingerprints to the asset links**, until the tests
  pass.

- [x] **Step 4: Run them to verify they pass**

Run: `yarn test proxy.test.ts`
Expected: PASS

- [x] **Step 5: Rewrite the privacy page** as server-rendered headings and paragraphs following spec §3 bullet by
  bullet, with the existing `Header` (`backTo="/"`, title `Privacy Policy`).

- [x] **Step 6: Write the deletion page** at `app/(platform)/delete-account/page.tsx`, laid out like the privacy page,
  with the title `Delete your account`.

- [x] **Step 7: Commit**

```bash
git add "app/(platform)/privacy/page.tsx" "app/(platform)/delete-account/page.tsx" proxy.ts proxy.test.ts public/.well-known/assetlinks.json
git commit -m "Rewrite the privacy policy, add a public account deletion page, and list both signing keys in the asset links."
```

### Task 5: Android project upgrade to API 36

**Files:**
- Modify: `packages/android/source/gradle/wrapper/gradle-wrapper.properties`
- Modify: `packages/android/source/gradle/wrapper/gradle-wrapper.jar`
- Modify: `packages/android/source/gradlew`
- Modify: `packages/android/source/gradlew.bat`
- Modify: `packages/android/source/build.gradle`
- Modify: `packages/android/source/app/build.gradle`
- Modify: `packages/android/source/app/src/main/AndroidManifest.xml`
- Modify: `packages/android/.gitignore`

**Interfaces:**
- Consumes: existing Gradle build files and manifest in `packages/android/source/`.
- Produces: `packages/android/source/app/build/outputs/bundle/release/app-release.aab`, unsigned, for the developer to
  sign.

```groovy
// app/build.gradle, the values that change
android {
    namespace 'in.spanion.splitify.twa'
    compileSdk 36
    defaultConfig { minSdk 21; targetSdk 36; versionCode 10; versionName "1.1.0" }
    buildFeatures { resValues true }
    lint { checkReleaseBuilds false }
    compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 }
}
dependencies { implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.7.4' }
```

**Spec:**
- §1: "`gradle/wrapper/gradle-wrapper.properties`: Gradle `8.13`."
- §1: "`build.gradle`: Android Gradle Plugin `8.13.0`; repositories `google()` and `mavenCentral()` (`jcenter()` is shut
  down)."
- §1: "`versionCode 10`"
- §1: "`com.google.androidbrowserhelper:androidbrowserhelper:2.7.4`."
- §1: "remove the `com.google.android.gms.permission.AD_ID` element"
- §1: "remove the `package`
  attribute, which AGP 8 replaces with `namespace`."
- §1: "`packages/android/.gitignore`: add `build/` and `.gradle/`."
- §1: "The `twaManifest` block (host, launch path, colours, shortcuts) is unchanged."

**Tags:** security

**Knowledge:** `apps/android`: the project targets API 36 with AGP `8.13.0` and Gradle `8.13`, and drops the `AD_ID`
permission; `operations/android-release`: build with `bundleRelease`, sign with `jarsigner` and the upload key, upload
by hand.

**Acceptance:**
- Given the upgraded project and `ANDROID_HOME` set to `$HOME/Library/Android/sdk`, when `./gradlew bundleRelease`
  runs from `packages/android/source` on JDK 21, then it succeeds and writes
  `app/build/outputs/bundle/release/app-release.aab`.
- Given that build, then the release merged manifest under `app/build/intermediates/` declares
  `android:targetSdkVersion="36"`, `android:versionCode="10"` and `android:versionName="1.1.0"`, and contains no
  `AD_ID`.
- Given that build, then `git status --short` lists no file under `packages/android/source/app/build/` or
  `packages/android/source/.gradle/`.
- Given `app/build.gradle`, then the `twaManifest` block is byte-for-byte as before the task.

- [x] **Step 1: Check the build fails today**

Run: `cd packages/android/source && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew bundleRelease`
Expected: FAIL (Gradle 6.5 can't run on JDK 21)

- [x] **Step 2: Point the wrapper at Gradle 8.13** by editing `distributionUrl` in `gradle-wrapper.properties` (the old
  Gradle can't run the `wrapper` task on JDK 21), then refresh the wrapper's jar and scripts:

Run: `cd packages/android/source && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew wrapper --gradle-version 8.13`
Expected: BUILD SUCCESSFUL

- [x] **Step 3: Upgrade the build files and manifest** to the Interfaces and Spec lines above, and add `build/` and
  `.gradle/` to `packages/android/.gitignore`.

- [x] **Step 4: Build the bundle**

Run: `cd packages/android/source && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew bundleRelease`
Expected: BUILD SUCCESSFUL, with `app/build/outputs/bundle/release/app-release.aab` written

- [x] **Step 5: Check the merged manifest and the working tree** against the Acceptance cases

Run: `grep -rl 'targetSdkVersion="36"' packages/android/source/app/build/intermediates --include=AndroidManifest.xml`
Expected: at least one release manifest listed; the same files contain `versionCode="10"` and no `AD_ID`

- [x] **Step 6: Commit**

```bash
git add packages/android/source/gradle/wrapper/gradle-wrapper.properties packages/android/source/gradle/wrapper/gradle-wrapper.jar packages/android/source/gradlew packages/android/source/gradlew.bat packages/android/source/build.gradle packages/android/source/app/build.gradle packages/android/source/app/src/main/AndroidManifest.xml packages/android/.gitignore
git commit -m "Upgrade the Android app to target API 36 on AGP 8.13, drop the AD_ID permission and set version 1.1.0 (10)."
```
