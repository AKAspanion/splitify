# SDD ledger — plan: docs/plans/2026-11-04-sql-connect-foundation.md
Plugin: ga 2.15.0 (e989938)
Policy: git.commit=task; run.checkpoints=none; run.unattended=false; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=off; review.minors=defer; knowledge.update=after-finish
Run base: a6b62df9eda66acc29f85bf25155dcdbab5b614f
Pre-flight: Task 1 -> Tasks 2, 3, 4: signInTestUser, seed, seedUser, seedGroup, seedFriendship, resetDatabase named identically in every Consumes; the schema shape is consumed unchanged
Pre-flight: Task 1 -> Task 4: functions/src/index.ts created empty by Task 1 and modified by Task 4; firebase.json emulator ports consumed; dataconnect/admin/connector.yaml created by Task 1, Task 4 adds merge.gql beside it
Pre-flight: Task 1 vitest.rules.config.mts -> Task 4: Task 4's tests live in functions/src and lib/firebase, so the rules config must include them; Task 1's text names only the config file, not its include patterns
Task 1: Ruling: Task 1's vitest.rules.config.mts includes dataconnect/**/*.test.ts, functions/src/**/*.test.ts and lib/firebase/**/*.test.ts, and vitest.config.mts excludes the same three, so Task 4's tests run under yarn test:rules — Global Constraints say functions/ and lib/firebase/ tests run only through yarn test:rules — Task 4 edits a Task 1 config file
Pre-flight: Task 1 test:rules starts the functions emulator, which loads functions/lib/index.js and needs a build; no test in Tasks 1-4 exercises a function through the emulator (Task 4 calls mergeContactForUser directly)
Task 1: Ruling: Task 1's test:rules starts only auth and dataconnect emulators (--only auth,dataconnect), not functions; Task 4 tests mergeContactForUser directly and the trigger's options by inspection — the functions emulator needs a built functions/lib before every run and no case uses it — the trigger is not exercised end to end until spec 3 deploys it; the spec's test:rules line says auth,dataconnect,functions
Pre-flight: Task 2 vs Task 3: separate .gql and test files in dataconnect/app; both regenerate the git-ignored SDK in their own worktree; no shared file
Pre-flight: Task 4: lib/firebase/app.ts reads NEXT_PUBLIC_FIREBASE_PROJECT_ID; its tests must set it to demo-splitify to match the emulator project
Pre-flight: Task 1 self-consistency: Files list matches the commit step; acceptance cases match the CreateExpense/CreateSettlement table; the fallback to callables names functions/src/expense-writes.ts, which isn't in Files: allowed only under the recorded ruling
Pre-flight: Task 2, 3, 4 self-consistency: each Files list matches its commit step and its acceptance cases match its operation table
Note: dev servers not started: the worktree has no node_modules and no .env; the app is unchanged by this plan
Task 1: started 2026-11-04 21:08
Task 1: agent implementer ab7dfde1e41ddfc05
Task 1: Ruling: Accept a third connector, dataconnect/expense/, for CreateExpense and CreateSettlement, with no generated SDK; callers use mutationRef(dc, name, vars) — the generated web SDK rejects *_Data list variables that userPayment_insertMany needs, and the membership @check works there — spec 2 writes typed wrappers by hand for two mutations; the spec and data/sql-connect must name three connectors
Task 1: Ruling: Task 2, Task 3 and Task 4 write @auth as expr (auth != null and sign_in_provider != 'anonymous', plus limits) as Task 1 does, since @auth can't take level and expr together; no operation in connector app takes a *_Data list variable — Task 1 found both limits in SQL Connect — an operation written with level: USER plus expr fails to compile
Task 2: Ruling: Task 2's DeleteGroup deletes the group's Activity rows before the group, in its transaction, since Activity.group is optional and the delete only nulls it — the spec says a group's activity is deleted with it — orphan activity rows visible to their actor
Task 4: Ruling: Task 4 replaces Task 1's placeholder GetMyProfile (dataconnect/app/profile.gql) with GetMe in dataconnect/app/me.gql and deletes profile.gql — connector app needed one operation to compile; GetMe is the spec's — two operations returning the caller's row
Task 2: Ruling: Task 2, Task 3 and Task 4 tests compare UUIDs with hyphens stripped (or use the harness's normalisation), since UUIDs read back from SQL Connect have no hyphens — Task 1 found UUIDs return hyphenless — false test failures
Note: Task 1 test-first was mutation-checked rather than watched failing first: neutralising the membership, caller, limit and expenseId checks failed 6 tests
Task 1: complete (commits a6b62df..053c8e7, not reviewed)
Progress: 1/4 tasks — Task 1 Foundation: Firebase project files, the whole schema, dependencies, the emulator harness, and the expense writes — Schema, three connectors, the expense and settlement writes with in-transaction membership checks, and the emulator harness; 21 rule tests pass
Task 2: Ruling: Task 2, Task 3 and Task 4 run yarn test:rules only through the run's with-emulator-lock.sh, so the three worktrees take turns on the emulator ports 9099 and 9399 — parallel worktrees share fixed emulator ports from firebase.json — tasks wait on each other's test runs
Task 2: started 2026-11-04 21:25 (worktree from 053c8e7)
Task 3: started 2026-11-04 21:25 (worktree from 053c8e7)
Task 4: started 2026-11-04 21:25 (worktree from 053c8e7)
Task 3: agent implementer a69e6eed66403d8cb
Task 3: merged (19cc541..19cc541)
Task 3: Ruling: Search in ListGroupExpenses (and any later search) matches the text as a case-insensitive regular expression; spec 2's screens escape the person's input before sending it — SQL Connect has no case-insensitive contains — unescaped input such as ( errors or . over-matches
Task 3: minor (deferred): limit is unbounded in ListGroupExpenses and ListMyActivity; a member can page their own groups' data in one large page
Note: implementer could not write its report outside its worktree; the controller saved it to task-3-report.md
Task 3: complete (commits 19cc541..19cc541, not reviewed)
Progress: 2/4 tasks — Task 3 Expense reads and edits, activity and feedback — Expense reads, edits and deletes, the activity feed and feedback, each limited to group members; 14 rule tests
Task 4: agent implementer aa6ab6b162fccd55b
Task 4: merged (665c71e..665c71e)
Task 4: Ruling: User.email is indexed, not unique; CreateContact refuses a taken email with its own @check (sent to Task 2); the spec's User row now says so — a contact and the person who signs up with its email share the address until the merge; a unique constraint made UpsertMe fail — two users with one email if a check is missed; SearchUserByEmail can return the contact and the new account until the merge
Task 4: minor (deferred): lower-casing of a mixed-case token email and signInWithGoogle are untested on the emulators; the forced merge failure is a foreign-key failure on the first move, not mid-transaction
Note: implementer could not write its report outside its worktree; the controller saved it to task-4-report.md
Task 4: complete (commits 665c71e..665c71e, not reviewed)
Progress: 3/4 tasks — Task 4 Firebase Auth in the browser, UpsertMe, and the contact merge — Firebase Auth in the browser, UpsertMe and GetMe, and the verified-email contact merge function; 20 tests
Task 2: agent implementer a55c3eb05366176e7
Task 2: merged (ab4a718..3382dc0)
Task 2: Ruling: Accept Task 2's interface deviations: AddFriend takes withGroup: Boolean!, GetGroup returns a list of 0 or 1, DeleteGroup returns memberIds as objects, ListMyGroups search is an escaped case-insensitive regex — SQL Connect can't branch on a null variable, filter a key lookup, or search case-insensitively by substring — spec 2's callers adapt to these shapes
Task 2: complete (commits ab4a718..3382dc0, not reviewed)
Progress: 4/4 tasks — Task 2 Users, contacts, friends, groups and members — User, contact, friend, group and member operations with their access rules, and CreateContact's own taken-email check; 30 rule tests
Final review: agent implementer ac41df79567f14b92
Note: end checks: typecheck exit 0, lint exit 0 after the rename fix dae1be5; smoke 500 because this worktree has no .env (Clerk keys are missing from your environment); no file the app runs on changed on this branch
Note: merged origin/main (ddbb758) as f95dbfa; generated AGENTS.md, CLAUDE.md and decisions/index.md conflicts resolved by knowledge map; on the merged tree tsc exit 0, lint 0 errors, yarn test 102/102, yarn test:rules 85/85
