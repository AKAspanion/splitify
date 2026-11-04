# Play Store update: target API 36, asset links, privacy policy, account deletion

Date: 2026-11-04. Branch: `feat/play-store-update`.

## Goal

Ship an update of the Android app `in.spanion.splitify.twa` that Google Play will send for review. On 2026-11-04 Play
refused it for three reasons: an incomplete Data safety form, an incomplete Health apps declaration, and a privacy
policy URL whose host, `splitify.spanion.in`, didn't resolve. This work fixes what in the repository stands between the
app and those forms, and the other things that would block or fail the update:

- Since 31 Aug 2026, an update must target API 36; the project targets 33 on a toolchain that no longer builds.
- Play requires a way to delete an account, in the app and from a web link, and Splitify has none: Clerk can delete
  its own account record, but the database row stays.
- The privacy policy doesn't name the services that handle data, how long data is kept, or how to delete it.

## Decisions this rests on

- [Keep splitify.spanion.in](../../knowledge/decisions/keep-splitify-spanion-domain.md): the developer restores the
  missing DNS record; no host name changes in the apps.
- [Anonymise deleted accounts](../../knowledge/decisions/anonymise-deleted-accounts.md): the person's row, memberships,
  expenses, payments and splits stay; what identifies them goes.

## 1. Android project upgrade

All paths are under `packages/android/source/`. The project is upgraded in place, not regenerated with Bubblewrap:
only the build files change.

- `gradle/wrapper/gradle-wrapper.properties`: Gradle `8.13`.
- `build.gradle`: Android Gradle Plugin `8.13.0`; repositories `google()` and `mavenCentral()` (`jcenter()` is shut
  down).
- `app/build.gradle`:
  - `namespace 'in.spanion.splitify.twa'`, `compileSdk 36`, `targetSdk 36`, `minSdk 21` (`androidbrowserhelper`
    needs 21);
  - `versionCode 10`, `versionName "1.1.0"`. Play's live version code isn't known here; `10` is above anything
    PWABuilder sets. If Play rejects it as too low, raise it;
  - `buildFeatures { resValues true }`, since the build relies on `resValue`;
  - `lintOptions` becomes `lint { checkReleaseBuilds false }`; Java `17` source and target;
  - `com.google.androidbrowserhelper:androidbrowserhelper:2.7.4`.
- `app/src/main/AndroidManifest.xml`: remove the `com.google.android.gms.permission.AD_ID` element, which sits outside
  `<manifest>` and is not needed (ads, when shown, are the web page's, served in Chrome); remove the `package`
  attribute, which AGP 8 replaces with `namespace`.
- `packages/android/.gitignore`: add `build/` and `.gradle/`.

The `twaManifest` block (host, launch path, colours, shortcuts) is unchanged.

### Building and signing

`./gradlew bundleRelease` writes `app/build/outputs/bundle/release/app-release.aab`. The developer signs it in their own
terminal with `jarsigner` and the upload keystore in `~/keys/splitify/` (alias `my-key-alias`), typing the password at
the prompt. The keystore and its password never enter the repository or the session. The signed bundle is uploaded to
Play by hand.

## 2. Asset links

`public/.well-known/assetlinks.json` lists both certificates for `in.spanion.splitify.twa`:

- the upload key, `CC:62:1F:79:79:89:D1:A7:79:D8:91:87:40:43:53:A8:6E:A8:73:26:F4:95:E9:48:40:9D:2D:4E:89:79:D6:99`;
- the key already in the file, `B4:EB:FC:ED:F5:F7:69:3F:9C:25:9A:21:F0:B7:C4:11:1D:A7:80:0F:0A:01:8C:12:A4:2E:18:3A:4E:D6:67:C9`,
  taken to be Play's app signing key. The developer checks it against Play Console, Test and release, App integrity,
  App signing, and replaces it if it differs.

Without the key Play signs with, the installed app shows a browser address bar.

## 3. Privacy policy

`app/(platform)/privacy/page.tsx` is rewritten as headings and paragraphs instead of one `<pre>` block, with the same
`Header`. It stays public in `proxy.ts`. It says:

- **Effective date:** 4 November 2026.
- **Who:** Splitify, on the web at `splitify.spanion.in` and as Android and iOS apps.
- **What is collected:** name, email address and profile picture (from sign-up); the groups, expenses, payments,
  splits and settlements people enter; names and emails of contacts people add; feedback; a passkey's public key
  when biometric lock is turned on; a push subscription id when notifications are allowed; page views and
  performance measurements.
- **Why:** to run the app, to send the notifications people allow, and to understand use and performance. No data is
  sold.
- **Who handles it:** Clerk (accounts and sign-in), Vercel (hosting, analytics and performance), OneSignal (push
  notifications), UploadThing (image uploads), and Google AdSense, which may show ads and use cookies to do so.
- **Shared with other members:** what a person enters in a group is visible to that group's members.
- **How long it is kept:** while the account exists. When it is deleted, the account is anonymised as in section 4;
  expenses shared with others stay, under "Deleted user". The policy names no retention period for server logs,
  because nothing in the project sets one; see Open points.
- **Deleting an account:** in the app (Profile, Delete account), or as described at `/delete-account`.
- **Children:** not for under-13s.
- **Contact:** `panditankit1995@gmail.com`, the address the current policy gives.
- **Changes:** the date above changes when the policy does.

## 4. Account deletion

### Anonymising, in one place

A new module `lib/account/anonymise.ts` exports `anonymiseUser(tx, userId)`. Given a Prisma transaction client and a
`User.id`, it:

1. Reads the row's `name` and the ids of its groups. A missing row, or one already anonymised (its email ends in
   `@deleted.invalid`), returns without changing anything, so running it twice is harmless.
2. Deletes each group whose only member is this person (cascading its expenses and activity): nobody else's data is
   in it.
3. In the remaining groups, replaces the person's `name` with `Deleted user` in `Activity.message`, with one raw
   `UPDATE … SET message = REPLACE(message, ?, 'Deleted user') WHERE groupId IN (…)`. Skipped when the name is empty.
4. Deletes the person's `AuthnDevice` and `Feedback` rows.
5. Clears `friends` and `symmetricFriends`, so the friendship goes in both directions.
6. Updates the row: `name` `Deleted user`, `firstName` `Deleted`, `lastName` `user`, `email`
   `deleted-<id>@deleted.invalid` (the column is unique), `image_url` and `profile_image_url`
   `/images/placeholder/avatar.jpeg`, `fromClerk` `false`.

Group membership, expenses (including those the person created), payments and splits are not touched. Contacts the
person added are other people's records and stay.

### The Delete account button

- `app/(platform)/profile/page.tsx` gains a destructive **Delete account** button below the existing actions. It opens
  a `Dialog` that says what is removed and what other members keep, with **Cancel** and **Delete my account**.
- A new server action `actions/delete-account/` (the repo's `createSafeAction` shape, an empty input schema) does:
  1. `auth()`; no session is `{ error: "Unauthorized" }`.
  2. Finds the row: by the session's `userId`, or, when there is none, by the primary email of `currentUser()`. A
     contact who signed up keeps their `spuser_` id, so the session id alone can't find them
     ([finding](../../knowledge/findings/contact-signup-keeps-contact-id.md)). No row found still deletes the Clerk
     account.
  3. In one interactive transaction (timeout `15000` ms): `anonymiseUser`, then the Clerk account is deleted with
     `(await clerkClient()).users.deleteUser(userId)` as the last step. If Clerk refuses, the transaction rolls back
     and the action returns `{ error: "Couldn't delete your account. Try again." }`, with nothing changed. If Clerk
     deletes the account but the commit then fails, Clerk's `user.deleted` event anonymises the row through the
     webhook below (for a merged contact, whose row id isn't Clerk's, it can't: that row is left as it was).
  4. After the commit, the person's OneSignal user is deleted (`DELETE` on OneSignal's
     `/apps/<app id>/users/by/external_id/<userId>`), as a new `deleteOneSignalUser` in `lib/onesignal.ts`. It never
     throws; a failure is logged with `APILogger.error` and doesn't fail the deletion.
  5. Returns `{ data: { deleted: true } }`. The page then signs out and goes to `/`.
- The action takes no input: a person can only delete their own account.

### The webhook backstop

`POST /api/webhook/clerk` handles `user.deleted`, for an account deleted from Clerk's dashboard. It runs
`anonymiseUser` on `data.id` inside a transaction, before the existing email lookup (a `user.deleted` event carries
no email). An event for an unknown or already anonymised id answers `200`, as any other handled event. The signature
check stays first.

The developer turns off "Allow users to delete their accounts" in the Clerk dashboard, so `UserProfile` shows no
delete of its own and every deletion from the app goes through the button.

### The public deletion page

A new page `app/(platform)/delete-account/page.tsx`, public in `proxy.ts` as `/delete-account`, laid out like the
privacy page. It says how to delete the account in the app, what is removed and what other members keep, and that
someone who can't sign in can ask by email at the policy's contact address, from the email the account uses. This is
the URL Play's Data safety form asks for: `https://splitify.spanion.in/delete-account`.

### Hostile input

- The action has no input to tamper with, and acts on the session's own account.
- The webhook trusts only a body whose Svix signature checks.
- The `REPLACE` takes the name as a bound parameter, never spliced into SQL.
- A second deletion, from a retried request or the webhook after the button, finds the row already anonymised and
  does nothing.

## 5. Tests

Written first, with Vitest, mocking `@/lib/db` and Clerk as `actions/create-expense/index.test.ts` does:

- `lib/account/anonymise.test.ts`: the row update's values; the device, feedback and friendship removals; a sole-member
  group deleted and a shared one kept; activity rewritten only when the name isn't empty; an already anonymised or
  missing row changes nothing.
- `actions/delete-account/index.test.ts`: no session is refused; the row is found by email when the session id finds
  none; Clerk's refusal returns the error; OneSignal's failure doesn't fail the deletion.
- `app/api/webhook/clerk/route.test.ts`: `user.deleted` anonymises by `data.id`; a bad signature still answers `400`.

The Android change is checked by `./gradlew bundleRelease` succeeding.

## Done outside the repository

These are the developer's, and the update isn't reviewable until they are done:

1. Restore the `splitify` DNS record at the `spanion.in` provider, and add the domain to the web app's deployment.
2. Deploy this branch's web changes, so `/privacy`, `/delete-account` and the asset links are live before the review.
3. Turn off self-deletion in the Clerk dashboard.
4. In Play Console, App content:
   - **Privacy policy:** `https://splitify.spanion.in/privacy`.
   - **Health apps:** "My app doesn't provide any health features".
   - **Advertising ID:** No.
   - **Ads:** Yes if `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` is set in production, otherwise No.
   - **Financial features:** none, if the form is still open.
   - **Data safety:** as in the table below; deletion URL `https://splitify.spanion.in/delete-account`.
5. Upload the signed bundle and send the release for review.

### Data safety answers

All data is encrypted in transit. Users can ask for their data to be deleted. Clerk, Vercel and OneSignal process data
for Splitify and so don't count as sharing.

| Data type | Collected | Shared | Purposes | Optional |
|---|---|---|---|---|
| Name, Email address, User IDs | Yes | No | App functionality, Account management | No |
| Photos (profile picture) | Yes | No | Account management | Yes |
| Other financial info (expenses, splits, settlements) | Yes | No | App functionality | No |
| Other user-generated content (groups, feedback) | Yes | No | App functionality | Yes |
| App interactions | Yes | No | Analytics | No |
| Diagnostics | Yes | No | Analytics | No |
| Device or other IDs (push id) | Yes | No | App functionality | Yes |
| Device or other IDs, only if AdSense runs in production | Yes | Yes | Advertising or marketing | No |

## Knowledge to update

`apps/android` (target SDK, release steps), a new `operations/android-release` runbook, a new
`features/account-deletion`, `integrations/clerk` (the `user.deleted` event), `integrations/onesignal` (user
deletion), `security/data-protection` (deletion and retention), `domain/contact-identity` (deletion finds a merged
contact by email).

## Open points

- **Log retention:** `Log` rows (when `ENABLE_DB_LOGGING` is `YES`) and the host's request logs have no retention
  period set anywhere in the project. The policy says nothing specific until the developer chooses one.
- **AdSense:** whether it runs in production decides the Ads answer and the last Data safety row; the policy names it
  either way, since the code loads it whenever its id is set.

## Out of scope

- The iOS app's App Store listing.
- Fixing [contact sign-up keeps the contact's id](../../knowledge/findings/contact-signup-keeps-contact-id.md); this
  work only finds such a row by email.
- Deleting expenses or activity text a person wrote other than their name.
