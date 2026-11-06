# SDD ledger — plan: docs/plans/2026-11-06-auth-screens-and-bug-fixes.md
Plugin: ga 2.16.0 (5660c9e)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=end-of-plan; review.minors=defer; knowledge.update=end-of-plan
Run base: c59babc813b70e65305995a1c907359c645e32b2
Provisional: plan approved on settled facts — the developer's four answers of 2026-11-06 — the developer confirms the plan
Note: no spec — a bug batch and one screen change settled by the developer's answers
Pre-flight: no shared interfaces: five tasks touch disjoint files; Task 3 links to / which Task 4 turns into a redirect, and works as a plain link before it
Task 1: started 2026-11-06 12:38 (worktree from c59babc)
Task 2: started 2026-11-06 12:38 (worktree from c59babc)
Task 3: started 2026-11-06 12:38 (worktree from c59babc)
Task 4: started 2026-11-06 12:38 (worktree from c59babc)
Task 5: started 2026-11-06 12:38 (worktree from c59babc)
Task 1: merged (ac12f19..ac12f19)
Task 1: complete (commits ac12f19..ac12f19, not reviewed)
Task 2: merged (63dd80d..63dd80d)
Task 2: complete (commits 63dd80d..63dd80d, not reviewed)
Task 4: merged (e2fa39c..e2fa39c)
Task 4: complete (commits e2fa39c..e2fa39c, not reviewed)
Task 5: merged (c1d9464..c1d9464)
Task 5: complete (commits c1d9464..c1d9464, not reviewed)
Ruling: Task 1: the brief's test command can't run (functions has no local vitest); the implementer ran the tests through the rules config — the root vitest config excludes functions tests — none: the tests ran
Ruling: Task 4: public.json expects 'Create your account' on /sign-up instead of 'Sign up' — the Sign up button renders client-side only — a hosting-check failure at the end
Task 3: merged (2eeee53..2eeee53)
Task 3: complete (commits 2eeee53..2eeee53, not reviewed)
Note: Production Google sign-in: repo variable NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN was splitify-416321.firebaseapp.com, overriding the code default; set to splitify.spanion.in with the developer's yes and redeployed main (run 42179563361); the live bundle now carries authDomain splitify.spanion.in
Final review: started 2026-11-06 12:48
Note: End checks on 2eeee53: typecheck pass, lint pass, build:hosting pass; smoke and check:hosting not run: ports 2140-2151 held by the local-dev-env-emulators-43b983 checkout's dev servers
Final review: minor (deferred): privacy and delete-account comment in app/adsense.tsx still names the landing page
Final review: minor (deferred): subtitle strings repeated in the sign-in and sign-up Suspense fallbacks
Final review: minor (deferred): the Go home link is written twice in the action page forms
Final review: minor (deferred): handleDelete has no guard against a second submit during the dialog's exit animation (server tolerates it)
Final review: minor (deferred): dialog and redirect tests stub hooks instead of driving a DOM; no e2e covers the DELETE dialog (checked by hand in the running app on 2026-11-06)
Final review: minor (deferred): public.json expects Splitify on /, which every page title holds
Final review: minor (deferred): guard verifyIdToken has no checkRevoked, so a pre-deletion ID token works on reports and webauthn for up to an hour (pre-existing)
Ruling: Developer correction mid-run: remove the theme toggle from the auth card; the screens follow the system or saved theme — the developer asked on 2026-11-06 — a person who wants a different theme on sign-in uses the device setting
Ruling: Sign-out and delete success go straight to /sign-in/ with a full page load instead of / — final review Important 2: / still saw signed-in and showed /groups/ first; a full load also drops any ad script — the knowledge that says sign-out lands on / is restated by the knowledge job
Final review: minor (deferred): nothing tests that sign-out and delete success sign out before leaving for /sign-in/ (re-review new Minor 1)
Final review: complete (6 findings (3 final Important, 1 security Important, 1 security Minor promoted, 1 developer request), 5 fixed, 0 parked; 8 Minors deferred)
Run: finished 2026-11-06 13:35
