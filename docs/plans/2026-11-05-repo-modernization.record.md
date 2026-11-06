# SDD ledger — plan: docs/plans/2026-11-05-repo-modernization.md
Plugin: ga 2.16.0 (5660c9e)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=end-of-plan; review.minors=defer; knowledge.update=end-of-plan
Run base: f2d5db002e13fefac4e1051230be8b36ca14cf45
Note: no spec — maintenance and security sweep; each task cites the alert, finding or decision it closes
Pre-flight: Task 1 -> Task 5: Task 1 produces @playwright/test and the test:e2e script; Task 5 consumes both. Consistent.
Pre-flight: Task 1 -> Task 2..5: Task 1 formats code files and changes the lockfiles; every slice waits for it. No slice touches a Task 1 file.
Pre-flight: Task 2 / Task 3: both close parts of findings/react-compiler-lint-warnings; Task 2 fixes four components, Task 3 the two forms and eslint.config.mjs. No shared file. The end lint run checks the rules at error over all six.
Pre-flight: Task 5: setting checks.commands.e2e with workflow set rewrites CLAUDE.md and AGENTS.md, shared root files; moved to the controller after Task 5 merges.
Ruling: Task 5 does not run workflow set; the controller sets checks.commands.e2e after Task 5 is in — workflow set regenerates CLAUDE.md/AGENTS.md, which would collide with other worktrees — one extra controller commit
Pre-flight: Tasks 2,3,4: each self-consistent; Task 4's operation variables stay the same, so lib/data hooks and the generated SDK need no change.
Note: Dev servers and dashboard not started: ports 2140 and 4800 are already held by another process (another checkout's run). The end checks start what they need.
Task 1: started 2026-11-05 18:21
Task 1: agent implementer a0613b801a5b75ce3
Ruling: Task 1: keep the @opentelemetry/core ^2.8.0 override for @google-cloud/pubsub — a fourth advisory surfaced and the acceptance needs a clean audit; pubsub's one use of it works on core 2 — a pubsub runtime break in functions, caught by the functions build and the end checks
Ruling: Task 1: CI audits cover dev dependencies (no --prod) — the open Dependabot alerts were all in dev and transitive dependencies, so a prod-only audit would never have caught them — CI fails on dev-only advisories until Dependabot or an override fixes them
Ruling: Task 5: add playwright-report/ and test-results/ to .prettierignore as well as .gitignore — Task 1's report: Prettier would check generated report files — none
Task 1: complete (commits f2d5db0..0d17e77, not reviewed)
Progress: 1/5 tasks — Task 1 Dependencies, formatting and CI/CD (foundation) — 1/5 tasks — Task 1 Dependencies, formatting and CI/CD — audits clean in both workspaces, firebase-tools 15.35.0, Prettier and CI checks added
Task 2: started 2026-11-05 18:32 (worktree from 0d17e77)
Task 3: started 2026-11-05 18:32 (worktree from 0d17e77)
Task 4: started 2026-11-05 18:32 (worktree from 0d17e77)
Task 5: started 2026-11-05 18:32 (worktree from 0d17e77)
Task 2: agent implementer aca511981e783131e
Task 3: agent implementer a0cf21b98e2207464
Task 4: agent implementer abe94b354ecc872fe
Task 5: agent implementer aab54bee7dec530f2
Task 5: merged (ea18796..ea18796)
Note: Task 5: minor (deferred): local pnpm test:e2e writes its users and groups into the developer's .emulator-data, because dev.mjs imports and exports it; CI starts empty
Note: Task 5: browser tests not yet run (ports 2140-2151 held by another checkout); their first run is CI's e2e job or a developer-requested e2e run
Task 5: complete (commits 0d17e77..ea18796, not reviewed)
Progress: 2/5 tasks — Task 5 End-to-end harness and the main flow — 2/5 tasks — Task 5 End-to-end harness — Playwright main-flow and wrong-password tests on the emulators, with an emulator-only guard
Ruling: Task 2: the payment drawer's click is left to the e2e main flow, not a jsdom test — adding jsdom and Testing Library mid-run would change the root manifest and lockfile, a chokepoint; the e2e flow opens the drawer — a drawer regression is caught only by e2e
Ruling: Task 2: accept its edits to scripts/hosting-pages/webauthn.json, scripts/check-hosting-build.mjs, lib/offline/sw-routing.js, public/sw-routing.js and lib/offline/sw-routing.test.ts — deleting the test page required them, and no other task touches those files — none
Task 2: merged (6ed7361..6ed7361)
Task 2: complete (commits 0d17e77..6ed7361, not reviewed)
Progress: 3/5 tasks — Task 2 App bug fixes and debt — 3/5 tasks — Task 2 App bug fixes — nested drawer button, global error text, shipped WebAuthn test page and dead files gone, four React Compiler warnings cleared
Ruling: Task 3: accept its edits to scripts/emulator-firebase-config.mjs and packages/ios/src/Splitify/Settings.swift, and the double-failure tests in lib/firebase/google-redirect.test.ts — the emulator config is generated, the authOrigins typo would defeat exact host matching, and auth.test.ts runs only on the emulators — none
Provisional: The public pages reach the signed-in app with full page loads (plain a links in the landing navbar and Logo, location.replace in Launch), so the ad script never carries into the app — the decision says every other page loads no ad script, and client navigation from the landing page kept adsbygoogle.js running — the developer confirms the full reload when leaving the landing page
Note: Task 3: minor (deferred): if signOut fails before clearing the in-memory user, a token refresh could save it again
Note: Task 3: minor (deferred): iOS still allows any .other script navigation with a force-cast; predates the task
Task 3: merged (998f8b9..998f8b9)
Task 3: complete (commits 0d17e77..998f8b9, not reviewed)
Progress: 4/5 tasks — Task 3 Web and iOS security — 4/5 tasks — Task 3 Web and iOS security — sign-in double failure clears the session, off-site back links refused, ads on public pages, HSTS, iOS exact host matching
Ruling: Task 4: merge its commit without a report; accept dataconnect/expense/expense-writes.gql, functions/src/global-options.ts, functions/src/index.test.ts and lib/data/errors.ts beyond its Files — the implementer hit an API rate limit after committing, tree clean; CreateExpense lives in expense-writes.gql, and the new error message needs a user-facing mapping — unreported test results; the final review and end checks cover them
Task 4: merged (c691882..c691882)
Task 4: complete (commits 0d17e77..c691882, not reviewed)
Progress: 5/5 tasks — Task 4 Data and Cloud Functions security — 5/5 tasks — Task 4 Data and functions security — contact takeover closed, query inputs bounded, CSV formulas escaped, recent sign-in to delete an account
Note: Merged-branch check: tsc fails with 8 TS2741/TS2345 errors in tests/e2e/main-flow.spec.ts (object literals passed as NodeJS.ProcessEnv need NODE_ENV); lint fails on react-hooks/set-state-in-effect in components/auth/auth-provider.tsx:31, a seventh component the finding didn't list, surfaced once Task 3 restored the rule. One fix dispatch on the run branch.
Note: Merged-branch fix eb17663: tsc and lint clean (e2e fixtures take a narrow Env type; auth-provider sets SIGNED_OUT in a guarded microtask)
Final review: started 2026-11-05 23:36
Note: End checks on eb17663: typecheck pass, lint pass, prettier pass, smoke could not start (emulator hub port held by another checkout, environmental), next build pass, check:hosting see log
Note: End checks on eb17663: check:hosting could not start (Hosting emulator hub port held by .claude/worktrees/local-dev-env-emulators-43b983); smoke, check:hosting and e2e wait for those ports or run in CI
Task 5: agent final-security-reviewer a4dfd31be8753881b
Provisional: UpdateContact may change a contact's email only while the caller is the contact's only friend; a name change stays open to any friend — friendships made before the fix let a second friend point the contact at a fresh address they own, verify it, and inherit the contact on sign-up; the contact's creator is its first and usually only friend, so no schema change is needed — the developer confirms; a contact shared by several friends can't have its email corrected until the others unfriend it
Ruling: ListFriends is capped at 500, not 100 — 500 is what the app asks for, null is refused and the rows are the caller's own; the security review accepted it — none
Task 5: agent final-reviewer a5ebfc57f0521d911
Provisional: SearchUserByEmail returns only signed-up users and the caller's own friends, so search never offers an Add button for another person's offline contact — final review I3: Add answered Not found and CreateContact answered email in use, a dead end; hiding the row is the smallest change — the developer confirms; a person someone else added as a contact can't be added by others until they sign up
Provisional: When deleteMyAccount asks for a recent sign-in, the app signs the person out and sends them to sign-in with next set to the profile page, saying why — final review M2 graded Important: with a 5 minute auth_time rule and no reauthentication, most people could not delete their account — the developer confirms the sign-out round trip instead of a reauthentication dialog
Ruling: pnpm test:rules and pnpm test:e2e first run in CI on the pull request — ports 2140 to 2151 are held by .claude/worktrees/local-dev-env-emulators-43b983, which this run must not stop; CI's checks and e2e jobs run both — a rule or e2e failure is found on the PR, not before the push
Note: Final review list. Important: I1 e2e strict-mode duplicates; I2/Sec-I1 full page loads from public pages and Adsense only when signed out; Sec-I2 UpdateContact email by sole friend; I3 search dead end; M2 regraded Important, deletion reauth; I4 rule tests unrun. Minor fixed in the wave: Sec-M1 limit lower bounds and ListMyGroups cap, Sec-M2 text report escaping, Sec-M3/M5 search escape order, M1 drawer e2e click, M6 .gitignore mysql-db. Minor deferred: M3 stale unticks, M4 backHref placement, Sec-M4 in-memory user, Sec-M5 iOS force-cast, Sec-M6 ngrok domain in history, Task 5 local emulator data. Developer to confirm: M7 deploy gated on e2e and dev audits.
Note: Fix wave started from eb17663: web fixer ab36a84be2f800710, data/functions fixer aece99ea00ef4e7f3, e2e fixer a51112a86a156e93d, each in its own worktree
Note: Fix wave e2e area merged 42ee14f: strict-mode locators made unique, payment drawer clicked, mysql-db gitignore line removed; browser run still pending
Note: Fix wave data/functions area merged a7d0a47: sole-friend email rule, search filter, two-sided limit and offset bounds, text report escaping. pnpm test:rules ran on free ports (2152-2156): 23 files, 259 tests pass, covering Task 4's rule tests (closes I4).
Note: Fix wave: minor (deferred): a contact made before the fix with two friends can be renamed but not re-emailed by either; ListMyGroups without a limit now returns at most 200; text report cells with commas are now quoted like the CSV
Note: Fix wave web area merged c5b3038: full page loads from public pages, Adsense only when signed out, deletion sends a stale sign-in back through sign-in, search escaped before the cut
Note: Fix wave: minor (deferred): components/ui/button.tsx asChild throws (two children to Slot); toUserMessage doesn't map functions/unauthenticated; a /privacy/ document that loaded ads stays loaded if the visitor signs in from another tab
Note: End checks on c5b3038: typecheck pass, lint pass, prettier pass, pnpm test 34 files 275 tests pass; pnpm test:rules 259 pass in the data fixer's worktree; smoke, check:hosting and e2e blocked by another checkout's ports
Note: Final re-review r1: 11/11 findings ADDRESSED (I1 and M1 by reading; e2e browser run pending). New Important 1: offset upper bound 10000 leaves pagers stuck in an error. New Minor 1: a pre-fix second friend becomes sole friend when the creator deletes their account.
Ruling: Fix the new Important by dropping the 10000 offset upper bound and keeping offset >= 0 — the limit cap already bounds each page's work; a client-side MAX_PAGE_OFFSET would touch three pagers for a rare case — a client may request a very large offset, which costs the database a skip but returns at most 100 rows
Provisional: A second friend from before the fix who becomes a contact's sole friend when its creator deletes their account may then change the contact's email — final re-review New Minor 1; closing it needs a creator column or blocking email changes on contacts whose creator left, both schema-sized — the developer confirms this residual risk or asks for the creator column
Ruling: The offset fix 88dc63a is checked by the controller against its diff and its rule tests, with no second re-review — the change only removes the vars.offset <= 10000 clause from two @auth expressions; the RED then GREEN rule tests pin both directions — a defect in a two-clause removal goes unreviewed
Note: Final review settled at 88dc63a: all Important findings addressed; test:rules 259 pass; e2e browser run still blocked by another checkout's emulators on 2141-2151
Note: Open finding: [findings/ios-webview-allows-other-navigations](../../knowledge/findings/ios-webview-allows-other-navigations.md) — The iOS WebView allows any script-started navigation and force-casts a private key
Note: Open finding: [findings/button-as-child-throws](../../knowledge/findings/button-as-child-throws.md) — Button with asChild throws because it gives Radix Slot two children
Note: Open finding: [findings/unauthenticated-error-not-mapped](../../knowledge/findings/unauthenticated-error-not-mapped.md) — toUserMessage doesn't match the functions/unauthenticated code, so a callable's sign-in error shows the generic text
Note: Open finding: [findings/privacy-page-keeps-ad-script-after-sign-in](../../knowledge/findings/privacy-page-keeps-ad-script-after-sign-in.md) — A privacy page that loaded the ad script keeps it if the visitor signs in from another tab
Note: Open finding: [findings/expense-form-restores-stale-unticks](../../knowledge/findings/expense-form-restores-stale-unticks.md) — The expense form restores stale unticks when the group changes from A to B and back with no amount
Note: Open finding: [findings/e2e-writes-into-local-emulator-data](../../knowledge/findings/e2e-writes-into-local-emulator-data.md) — A local pnpm test:e2e writes its users and groups into the developer's .emulator-data
Note: Open finding: [findings/two-friend-contact-cannot-be-re-emailed](../../knowledge/findings/two-friend-contact-cannot-be-re-emailed.md) — A contact made before the fix with two friends can be renamed but not re-emailed by either
Note: Open finding: [findings/second-friend-becomes-sole-friend-on-creator-deletion](../../knowledge/findings/second-friend-becomes-sole-friend-on-creator-deletion.md) — A second friend from before the fix becomes a contact's sole friend when its creator deletes their account, and can then change its email
Note: Open finding: [findings/add-to-group-without-consent](../../knowledge/findings/add-to-group-without-consent.md) — Any member can add a signed-up person to their group without asking
Run: finished 2026-11-06 09:54
