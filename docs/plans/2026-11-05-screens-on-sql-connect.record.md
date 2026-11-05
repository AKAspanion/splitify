# SDD ledger — plan: docs/plans/2026-11-05-screens-on-sql-connect.md
Plugin: ga 2.15.0 (e989938)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=off; review.minors=defer; knowledge.update=after-finish
Run base: c3a8c06b0bfb0863400f007c714a9c283088d737
Provisional: spec 2b approved on settled facts — decisions/static-build-on-firebase-hosting, group-member-permissions, expense-edit-description-only, your-share-shows-net-amount, firebase-auth, and spec 2a's lib/data — the developer confirms the spec
Provisional: spec 2b's plan approved on settled facts — every task traces to the approved spec; run check passes with no errors — the developer confirms the plan
Provisional: the group page hides Download report and the profile's Delete account links to /delete-account until 2c — reports and account deletion need a server, which 2c moves to Cloud Functions — the developer confirms the two stand-ins
Provisional: the verify-email banner's wording and its 60-second resend wait — decisions/firebase-auth names the banner but not its text — the developer confirms or rewrites the text
Pre-flight: Task 1 -> Tasks 2-5: useRouteIds, toLedgerExpenses, the shell, firebase.json rewrites and the hosting-pages manifests are consumed by name; Task 1 alone edits firebase.json, check-hosting-build.mjs and the navbars
Pre-flight: Tasks 2-5: each owns disjoint folders; groups/[id]/expense (the list) is Task 2's, groups/[id]/expense/[expenseId] Task 3's, groups/[id]/activity Task 5's; each adds its own hosting-pages json
Pre-flight: Tasks 2-5 each convert page.tsx to a thin client page and add page.hosting.tsx; the normal build must still type-check, so old components no longer used stay compiling or are left untouched
Pre-flight: Tasks 2-5 run browser checks against the emulators in worktrees: every emulator start and yarn check:hosting goes through the run's with-emulator-lock.sh
Task 1: started 2026-11-05 01:15
Task 1: agent implementer a816d3e8c23900c19
Task 1: Ruling: Accept Task 1's extra edits: GetGroupLedger returns each expense's type, lib/firebase/auth.ts gains sendVerificationEmail and reloadEmailVerified, utils/func.ts gains getAvatarLetters, and the navbars show initials — the split engine needs EQUAL vs EXACT, the banner needs both Firebase calls, and AuthUser carries no image — the navbar no longer shows a profile photo
Task 2: Ruling: Task 2, Task 3, Task 4 and Task 5 each include the signed-in shell (navbars and the verify-email banner) in their browser check, since Task 1 had no page to render it on — the shell renders only once a slice's page exists — the shell is first seen in the slices' checks
Task 1: complete (commits c3a8c06..aa4c5cd, not reviewed)
Progress: 1/5 tasks — Task 1 Foundation: the signed-in shell, id routes, the ledger adapter and the hosting check's manifests — The signed-in shell with the verify-email banner, useRouteIds, the Hosting rewrites, toLedgerExpenses, and the hosting check reading per-slice manifests; 13 tests
Task 2: started 2026-11-05 01:19 (worktree from aa4c5cd)
Task 3: started 2026-11-05 01:19 (worktree from aa4c5cd)
Task 4: started 2026-11-05 01:19 (worktree from aa4c5cd)
Task 5: started 2026-11-05 01:19 (worktree from aa4c5cd)
Task 5: agent implementer abdceec27d6ace67f
Task 5: merged (3c01cd4..3c01cd4)
Task 2: Ruling: Id-route page.hosting.tsx files for Task 2, Task 3 and Task 4 are server wrappers rendering the client page beside generateStaticParams, not a bare re-export — next build refuses generateStaticParams re-exported beside a use-client default (found by Task 5) — one small wrapper file per id route
Task 5: minor (deferred): useGroupActivity filters ListMyActivity client-side in 50-row chunks (up to 500 rows a page); a ListGroupActivity query filtered on the server would be cleaner
Task 5: minor (deferred): the profile pushes to / before signOut, so RequireAuth doesn't redirect to /sign-in first
Task 5: complete (commits 3c01cd4..3c01cd4, not reviewed)
Progress: 2/5 tasks — Task 5 Activity, feedback and the profile — The activity feed, group activity, feedback and the profile on SQL Connect and in the hosting build, with activityLine saying You; 8 tests, checked in the browser
Task 4: agent implementer a3dc7af94ecb862be
Task 4: merged (6b31d8c..6b31d8c)
Task 2: Ruling: Task 2 and Task 3 pass fetchPolicy SERVER_ONLY to every generated query and don't edit components/providers.tsx; after the merge, one fix centralises the fetch policy in lib/data/client.ts and applies it to Task 5's hooks too — the SDK's PREFER_CACHE returned stale results after writes, and providers.tsx made a new QueryClient each render (both found by Task 4, which fixed providers.tsx) — an extra fix commit after the slices
Task 4: Ruling: Accept Task 4's edit to components/providers.tsx (one QueryClient per mount, through useState), outside its Files — a QueryClient made on every render left invalidation reaching nobody — none known
Task 4: complete (commits 6b31d8c..6b31d8c, not reviewed)
Progress: 3/5 tasks — Task 4 Friends and contacts — Friends, contacts, adding a friend and the shared groups on SQL Connect and in the hosting build, with the QueryClient fix; 8 tests, checked in the browser
Task 2: agent implementer a527fb4af1b59e8ab
Task 2: merged (4a8e66d..4a8e66d)
Task 2: minor (deferred): the dashboard was a stub before and stays one, now a client page with a hosting entry
Task 2: minor (deferred): not-found for /settings, /edit and /add-member by a non-member, and the error and Try again states, weren't exercised in the browser (same pattern as the group page)
Task 2: complete (commits 4a8e66d..4a8e66d, not reviewed)
Progress: 4/5 tasks — Task 2 Groups and the dashboard — Groups, group details with balances from the ledger, edit, settings, add-member and the expense list on SQL Connect and in the hosting build; Download report hidden; 5 tests, checked in the browser
Task 3: agent implementer a26cefac5b7aa6b22
Task 3: merged (ef81fb3..ef81fb3)
Task 3: Ruling: Accept Task 3's change to app/(platform)/(app)/_utils/expense.ts: yourShareInExpense shows the net amount, as decisions/your-share-shows-net-amount says, and 'You are settled up' at zero — the spec's balances section requires the net amount — the settled-up wording is the implementer's
Task 3: minor (deferred): the expense flows weren't checked in the browser by Task 3; the integration fix after the slices runs them
Task 3: complete (commits ef81fb3..ef81fb3, not reviewed)
Progress: 5/5 tasks — Task 3 Expenses and settling up — Adding, viewing, editing and deleting expenses and settling up on SQL Connect and in the hosting build, with every id made in the browser; 14 tests
Final review: agent integrator a75a0e25d10e295f3
Ruling: Integration fixes after the slices: one shared FRESH fetch policy in lib/data/client.ts for every query (b971e64), and app/(platform)/(app)/(screens)/layout.hosting.tsx so the hosting build mounts AddExpenseFab (248aa3f) — the hosting build reads only layout.hosting.tsx, so (screens)/layout.tsx and its add-expense button were missing; three slices had their own copies of the fetch policy and two had none — none known
Note: integration browser check on the emulators, 390px dark then light: sign-up with the banner, group, friend and contact, members, equal and exact expenses, balances and totals, settle up, edit, delete, group and main activity, feedback, profile; screens refreshed after each write without a reload. Not covered: dashboard, group settings and edit, friend detail and edit
Final review: agent implementer a963c0d2291262901
Note: end checks on 989a534: tsc 0, lint 0 errors, yarn test 207/207, test:rules 146/146, build:hosting 0, check:hosting OK; sign-out redirect fix (989a534) not checked in a browser
Run: finished 2026-11-05 (after-finish: knowledge, record and log written)
