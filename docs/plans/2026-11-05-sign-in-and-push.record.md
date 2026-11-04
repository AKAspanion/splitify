# SDD ledger — plan: docs/plans/2026-11-05-sign-in-and-push.md
Plugin: ga 2.15.0 (e989938)
Policy: git.commit=task; run.checkpoints=none; run.unattended=false; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=off; review.minors=defer; knowledge.update=after-finish
Run base: f3033b2bcff940e53955809a851d3141710ce011
Pre-flight: Task 1 -> Tasks 2-5: PushToken ops, DeleteGroup title, the five Firebase Variables consumed by name; Task 1 alone touches package.json, yarn.lock, schema and workflows
Pre-flight: Task 2 vs Task 3: Task 3 modifies lib/firebase/auth.ts signOut, which Task 2's navbar only calls; Task 2 doesn't edit lib/firebase/auth.ts
Pre-flight: Task 2 vs Task 3: both rely on the hosting check; only Task 2 edits scripts/check-hosting-build.mjs; Task 3 runs it after merging
Pre-flight: Task 4: functions tests run under yarn test:rules (rules config includes functions/src); Task 5's expense-writes test is emulator-based and must sit under the rules config's include (lib/data/ is not included today)
Task 5: Ruling: Task 5's lib/data/expense-writes.test.ts runs under yarn test:rules: Task 5 adds lib/data/**/*.rules.test.ts to vitest.rules.config.mts's include and excludes it in vitest.config.mts, naming the file lib/data/expense-writes.rules.test.ts — the emulator test can't run in yarn test, and the rules config includes only dataconnect/, functions/src and lib/firebase/ — Task 5 touches the two Vitest configs, which no other task touches
Pre-flight: Tasks 2-5 build in worktrees and share emulator ports: each runs yarn test:rules only through the run's with-emulator-lock.sh
Task 1: started 2026-11-05 00:39
Task 1: agent implementer a99a911838a0d451b
Task 1: Ruling: Accept Task 1's edit to dataconnect/test-utils/emulator.ts (pushToken cleared before user in resetDatabase); .env.sample is left for the developer, since the permission settings deny editing it — the harness can't reset with a PushToken row referencing a user; editing .env.sample is the developer's call — .env.sample lacks NEXT_PUBLIC_FIREBASE_VAPID_KEY until the developer adds it
Task 1: complete (commits f3033b2..7e8abcf, not reviewed)
Progress: 1/5 tasks — Task 1 Foundation: the PushToken table and its operations, DeleteGroup's title, dependencies and configuration — PushToken table with its app and admin operations, DeleteGroup returning the title, react-onesignal removed, the Firebase web config in CI and deploy; 106 rule tests pass
Task 2: started 2026-11-05 00:42 (worktree from 7e8abcf)
Task 3: started 2026-11-05 00:42 (worktree from 7e8abcf)
Task 4: started 2026-11-05 00:43 (worktree from 7e8abcf)
Task 5: started 2026-11-05 00:43 (worktree from 7e8abcf)
Policy: run.unattended=true; git.push=at-finish; git.merge-request=at-finish (developer, 2026-11-05: complete all remaining specs and tasks one after another without waiting; they review at the end)
Task 5: agent implementer a1fcc8abdf2cf385e
Task 5: merged (319b717..319b717)
Task 5: minor (deferred): lib/firebase/app.ts getFirebaseApp checks getApps().length, so getApp() throws when only named apps exist (tests that create named apps first); guard on the [DEFAULT] app's name
Note: createExpense adds expenseId to each payment and split row itself; queryKeys is an explicit list of the 12 app queries, guarded by a test that reads the .gql files; vitest.config.mts gained the @dataconnect/app alias
Task 5: complete (commits 319b717..319b717, not reviewed)
Progress: 2/5 tasks — Task 5 The data layer's core — lib/data client, query keys, error text, search escaping and the typed expense writes; 13 unit and 110 rule tests pass
Task 3: agent implementer a1e537c3eb28c672a
Task 3: merged (47a77a7..47a77a7)
Task 3: Ruling: Accept Task 3's own named Firebase app for messaging, with messagingSenderId taken from the web app id's project-number segment, in register.ts and the service worker — lib/firebase/app.ts doesn't carry messagingSenderId and Task 3 couldn't touch it; the app id holds the sender id — two Firebase app instances in the browser until 2b moves the sender id into app.ts
Task 3: minor (deferred): the real FCM token flow wasn't exercised in a browser (needs the VAPID key and a real project); register.ts is tested through fakes only
Task 3: complete (commits 47a77a7..47a77a7, not reviewed)
Progress: 3/5 tasks — Task 3 Push token registration in the browser and the iOS wrapper — lib/push/register.ts for browser and iOS tokens, the FCM service worker, launch and sign-out on Firebase, OneSignal workers removed; 16 unit tests
Task 4: agent implementer ab3320f04a1192d58
Task 4: merged (c701a39..c701a39)
Task 4: Ruling: Accept wildcard-operation triggers with an allowlist in the handler for sendActivityPushApp and sendActivityPushExpense; sendGroupDeletedPush filters exactly on DeleteGroup — onMutationExecuted takes one operation per trigger and its patterns have no alternation; one trigger per operation would break the three-export interface — the app trigger starts, then exits, for every other app mutation, such as UpsertMe
Task 4: minor (deferred): activityText has no viewer parameter, so MEMBER_PLUS reads 'Alice added Bob in group ...' for the added person too; messages.ts said 'You have been added'
Task 4: complete (commits c701a39..c701a39, not reviewed)
Progress: 4/5 tasks — Task 4 The push functions — activityText for all 12 types, the three push triggers with actor, mute and dead-token handling and a 10-second FCM deadline; 34 tests, 142 in the rules suite
Task 2: agent implementer a92f84f657f7f2cee
Task 2: merged (7035b44..7035b44)
Task 2: minor (deferred): on sign-in, if UpsertMe fails after Firebase sign-in succeeds, the form shows the error but the signed-in state still redirects to next
Task 2: minor (deferred): RequireAuth is type-checked only; no hosting page uses it until 2b
Task 2: complete (commits 7035b44..7035b44, not reviewed)
Progress: 5/5 tasks — Task 2 Auth state, the sign-in screens, the guard, and the landing page on Firebase Auth — auth provider and useAuth, the guard and safeNextPath, the sign-in, sign-up and forgot-password screens, and the landing page and navbar off Clerk; 24 unit tests, checked in the browser
Final review: agent implementer ab8a4f0b776c9f272
Ruling: Move app/(platform)/profile/notification-action.tsx onto registerWebPush (14b5144), outside every task's Files — it imported the removed react-onesignal, which resolved only from the parent checkout's node_modules, so a clean CI install would fail typecheck — the profile's notification control changes in 2a rather than 2b; its Turn off action is gone
Note: end checks on 14b5144: tsc 0, lint 0 errors, yarn test 155/155, test:rules 146/146, build:hosting 0 with demo Firebase values, check:hosting OK, both workflows validate, every imported package declared; smoke not run (the server app needs a .env this worktree lacks)
Run: finished 2026-11-05 01:10
