# SDD ledger — plan: docs/plans/2026-11-05-offline-first-pwa.md
Plugin: ga 2.15.0 (e989938)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=off; review.minors=defer; knowledge.update=after-finish
Run base: c7cc9bec35abc4fc438e3a944bae24301c14cd4b
Provisional: spec 4 approved on settled facts — decisions/offline-first-scope, sql-connect-database, firebase-auth, firebase-cloud-messaging — the developer confirms the spec
Provisional: spec 4's plan approved on settled facts — every task traces to the approved spec; run check passes — the developer confirms the plan
Provisional: the offline wording, the 7-day cache life and the 3-second navigation timeout — decisions/offline-first-scope names the behaviour but not these values — the developer confirms or changes them
Pre-flight: Task 1 -> Tasks 2-4: persist.ts, appVersion, useOnline, OfflineBanner, OnlineOnly, the postbuild stub are consumed by name; Task 1 alone edits package.json and yarn.lock
Pre-flight: Task 3 edits components/providers.tsx after Task 1 (one registerQueuedWrites call); Tasks 2 and 4 don't touch it
Pre-flight: Task 2 replaces the stub scripts/build-sw.mjs Task 1 creates; Tasks 2-4 browser checks run through the lock script with firebase.emulators.json
Task 1: started 2026-11-05 10:36
Task 1: agent implementer a266111d86c692e9d
Task 2: Ruling: Task 2 loads /sw-manifest.js before hydration (a script in app/layout.tsx or the worker posting its version) so appVersion() reads __SPLITIFY_SW_MANIFEST__ = { version, files }; app/layout.tsx joins Task 2's files — Task 1's appVersion returns dev until the manifest is loaded, and the cache's buster depends on it — Task 2 edits app/layout.tsx
Task 1: complete (commits c7cc9be..1a04864, not reviewed)
Progress: 1/4 tasks — Task 1 Foundation: the saved cache, useOnline, the banner and OnlineOnly — The query cache saved in IndexedDB per person (cleared on sign-out, 7 days, version buster), useOnline, the offline banner and OnlineOnly; 121 tests
Task 2: started 2026-11-05 10:40 (worktree from 1a04864)
Task 3: started 2026-11-05 10:40 (worktree from 1a04864)
Task 4: started 2026-11-05 10:40 (worktree from 1a04864)
Task 4: agent implementer ae1ca9e65ec0ea9d8
Task 4: merged (aa3c982..aa3c982)
Task 4: minor (deferred): signed-in controls weren't seen offline in a browser (sign-in screens were); the final integration pass covers them, especially the header popovers on expense delete and download report
Task 4: complete (commits aa3c982..aa3c982, not reviewed)
Progress: 2/4 tasks — Task 4 Online-only actions disabled offline — Every online-only control disabled offline with its message, and the sign-in screens saying Connect to sign in; checked in the browser for the sign-in screens
Task 3: merged (a62fb46..a62fb46)
Task 3: complete (commits a62fb46..a62fb46, review clean)
Task 3: minor (deferred): the browser check with the network off and the duplicate-id rules cases weren't run (emulator lock held by Task 2); the integration pass covers them
Task 3: Ruling: Provisional: queued writes retry network errors up to 3 times, and the offline save toasts read 'Expense saved. It will sync when you're back online.' — the implementer's choice, not in the spec — the developer confirms the retry and the wording — the spec gives no wording for a saved offline write and no retry rule — small: two strings and one option to change
Progress: 3/4 tasks — Task 3 Queued expenses and settlements — Queued writes — expenses and settlements made offline wait with Waiting to sync and are sent once on reconnect; unit tested, browser check pending
Task 2: merged (d309761..d309761)
Task 2: complete (commits d309761..d309761, review clean)
Task 2: Ruling: Provisional: the manifest global is __SPLITIFY_SW_MANIFEST__ (Task 1's name, not the plan's __SW_MANIFEST); sw-routing.js is a classic script copied to out/; pages precache by path and under their file URL — forced by importScripts and the Hosting emulator's redirects — the developer confirms — importScripts can't load an ES module, and Hosting redirects index.html URLs — small
Task 2: minor (deferred): a first / navigation right after going offline timed out once, then loaded; the integration pass re-checks it
Progress: 4/4 tasks — Task 2 One service worker — Service worker — the shell loads offline from one worker that also carries FCM, with an update toast; checked on the Hosting emulator
Run: finished 2026-11-05 12:37
