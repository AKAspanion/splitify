# SDD ledger — plan: docs/plans/2026-11-05-server-to-functions.md
Plugin: ga 2.15.0 (e989938)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=off; review.minors=defer; knowledge.update=after-finish
Run base: d2958835ab0a60e548ab4f4e293f96940aac2ebd
Provisional: spec 2c approved on settled facts — decisions/static-build-on-firebase-hosting, anonymise-deleted-accounts, firebase-auth, firebase-cloud-messaging, cloud-logging — the developer confirms the spec
Provisional: spec 2c's plan approved on settled facts — every task traces to the approved spec; run check passes with no errors — the developer confirms the plan
Provisional: UploadThing is removed rather than moved to a function — no screen uses its components — the developer confirms no upload is wanted
Provisional: spec 3 (the static build on Firebase Hosting) is folded into 2c — 2c's removals and the static-only build are what spec 3 still had to do — the developer confirms nothing else was meant for spec 3
Provisional: the CSP's host list — checked against what the pages load in the browser on the emulators; production may load more (AdSense) — the developer watches for CSP violations after the first deploy
Pre-flight: Task 1 -> Tasks 2-4: guard, callFunction, the admin operations and the stub files in functions/src/{reports,webauthn,account} are consumed by name; Task 1 alone edits functions/src/index.ts, package manifests and lockfiles
Pre-flight: Task 1 modifies components/biometric/biometric.tsx and authn-devices.tsx to drop Prisma imports; Task 3 modifies them again after Task 1 merges
Pre-flight: Tasks 2-4 port code from git show 866468a:<path>; Tasks 2-4 run emulator tests in worktrees through the run's with-emulator-lock.sh
Task 1: started 2026-11-05 09:36
Task 1: agent implementer ad12293d632f4173a
Provisional: Task 1: the CSP allows 'unsafe-inline' in script-src and style-src, img-src https: data: blob:, font-src data:, base-uri and form-action 'self', beyond the spec's list — Next's static export inlines its hydration scripts and styles; zod's eval probe is turned off with z.config({ jitless: true }) — the developer accepts unsafe-inline, or asks for script hashes later
Task 1: Ruling: Accept Task 1's cleanups beyond its Files: the OneSignal script out of app/layout.tsx, UploadThing styles out of globals.css, lib/onesignal.test.ts and scripts/hosting-pages/shell.json deleted, the zustand stores' server fetchers removed, lib/zod-config.ts, the exceljs resolutions moved to functions/, and provisional WebAuthn client edits that Task 3 reworks — each was needed for the server code's removal to build — Task 3 starts from Task 1's provisional WebAuthn client edits
Note: .env.sample keys to remove, for the developer (editing it is denied): the Clerk six, DATABASE_URL, UPLOADTHING_SECRET, UPLOADTHING_APP_ID, the three OneSignal, the three logging flags, NEXT_PUBLIC_HOST_URL if unused; AUTHN_RP_ID and AUTHN_EXPECTED_ORIGIN become function params
Task 1: complete (commits d295883..faac2f1, not reviewed)
Progress: 1/4 tasks — Task 1 Foundation: remove the server, one static build, the function guard, rewrites and CSP — The server code and 14 packages removed, one static build, the ID-token guard, callFunction, the admin operations, function stubs, rewrites, the 404 page and the CSP; 111 unit and 162 rule tests
Task 2: started 2026-11-05 09:55 (worktree from faac2f1)
Task 3: started 2026-11-05 09:55 (worktree from faac2f1)
Task 4: started 2026-11-05 09:55 (worktree from faac2f1)
Task 4: agent implementer a095e4874983c3746
Task 4: merged (64f1cd9..64f1cd9)
Task 4: Ruling: The integration pass after Tasks 2 and 3 adds two things to account deletion: deleting each group whose only member is the person (as the Play Store update spec's anonymiseUser did), and https://*.cloudfunctions.net in the CSP's connect-src so the callable can be reached — docs/specs/2026-11-04-play-store-update.md step 2 deletes sole-member groups; the callable client calls the function's own URL, which connect-src blocked — an extra commit; the activity-text rewrite isn't needed, since activity stores the actor's id and reads the anonymised name
Task 4: complete (commits 64f1cd9..64f1cd9, not reviewed)
Progress: 2/4 tasks — Task 4 Deleting an account — deleteMyAccount anonymises, deletes the person's own data and their Auth user, retry-safe; the profile confirms and signs out; 6 tests, checked in the browser
Task 2: agent implementer a4c2476f1ff3cbd69
Task 2: merged (70bbfc1..70bbfc1)
Task 2: Ruling: Accept the reports' deviations from the old routes: CSV is a real .csv (the old csv route sent an xlsx), the text file starts with the group's title, sheet names are cleaned to Excel's rules, and Content-Disposition carries a sanitised filename — the spec's acceptance asks for a CSV header line and a text title; a group title must not inject headers — anyone relying on the old csv route's xlsx gets a csv
Task 2: minor (deferred): the download button wasn't clicked in a browser; the Hosting rewrite to the function was checked with a real emulator token
Task 2: complete (commits 70bbfc1..70bbfc1, not reviewed)
Progress: 3/4 tasks — Task 2 The reports function and the download button — The reports function for members only (excel, csv, text) behind the guard, and the download button back on the group page; 15 tests, rewrite checked on the emulators
Task 3: agent implementer acf0d9ea97600ced6
Task 3: merged (5d80f05..5d80f05)
Task 3: Ruling: Accept WebAuthn's __session cookie name, 400 for failed verifications, and the param defaults read with value() || DEFAULT — Hosting forwards only __session to functions; a failed verification is the caller's error, not the server's — the cookie surviving the Hosting rewrite in production is untested until the first deploy
Task 3: minor (deferred): no real browser passkey ceremony was run (no virtual authenticator); a software ES256 authenticator covers registration and authentication in the tests
Task 3: minor (deferred): read-modify-write race on the device array between concurrent verifications, as in the old code
Task 3: complete (commits 5d80f05..5d80f05, not reviewed)
Progress: 4/4 tasks — Task 3 The WebAuthn function and the biometric lock — The webauthn function behind the guard with an iron-session __session challenge cookie and the counter saved, and the lock and its pages on callFunction; 14 tests with a software authenticator, checked in the browser
Final review: agent integrator af7783d55154d35b1
Note: end checks on 62519ef after merging 2b's knowledge: tsc 0, lint 0 errors; the integrator's run on d12aa29+: yarn test 111/111, test:rules 198/198, yarn build 0, check:hosting OK, functions build 0, no removed-package imports, CSP clean in the browser
Run: finished 2026-11-05 10:46
