# SDD ledger — plan: docs/plans/2026-11-05-password-reset-flow.md
Plugin: ga 2.16.0 (5660c9e)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=end-of-plan; review.minors=defer; knowledge.update=end-of-plan
Run base: 644076799b87bb2a71868c013b4b784741756ec9
Note: no spec — the plan rests on the verified sign-in, firebase-auth and deploy-setup concepts
Pre-flight: Task 1 → Task 2: parseActionLink, ActionLink, ACTION_PATH, readPasswordResetEmail, resetPassword, verifyEmailWithCode and the new authErrorMessage copy; Task 2's consumes match Task 1's produces
Pre-flight: Task 3 shares no file with 1 or 2; it writes /auth/action/ as its own literal, which matches ACTION_PATH; run ready holds it behind Task 1 from its Consumes wording, harmless
Pre-flight: Task 1 self-consistent: unit tests via pnpm vitest run, emulator tests via pnpm test:rules, matching vitest.rules.config.mts includes lib/firebase/**
Pre-flight: Task 2 self-consistent: no component test runner, so states are walked by hand in the dev server; logic tested in Task 1
Pre-flight: Task 3 self-consistent: sw-routing.test.ts exists; ads-allowed.ts new
Note: dashboard not started: port 4800 is held by another dashboard; dev servers not started: the local-dev-env-emulators worktree's emulators hold ports 2141-2143
Task 2: Ruling: Task 2 skips its Step 4 walk-through in the dev server; it builds and checks out/auth/action/index.html, and the controller walks each state in the browser at the end — another checkout's emulators hold the dev ports, and stopping them is not this run's call — a state's copy or layout is caught at the end instead of in the task
Task 1: started 2026-11-05 18:23
Provisional: Task 4: Task 4 approved on settled facts — the developer asked for the link; it is plain, with no consent line, since none is decided — the developer confirms Task 4, or asks for consent wording on sign-up
Task 4: started 2026-11-05 18:25 (worktree from 3f9f4bd)
Task 4: agent implementer a62fedc3601634190
Task 4: Ruling: Task 4's prerendered-HTML check is replaced by the link being in each form's client chunk — both forms read useSearchParams inside Suspense, so the static export renders them client-only; Forgot your password is absent from the HTML too, and moving the link into page.hosting.tsx would leave the form — crawlers reading the static HTML don't see the link; the privacy page itself is still prerendered and reachable from the landing page
Note: a worktree build needs pnpm install in functions/ too; the end checks run in the main checkout, which has both
Task 4: merged (a3f1d7c..a3f1d7c)
Task 4: complete (commits 3f9f4bd..a3f1d7c, not reviewed)
Progress: 1/4 tasks — Task 4 A privacy policy link on the sign-in and sign-up screens — a plain Privacy policy link to /privacy/ ends the sign-in and sign-up forms
Task 1: agent implementer aedb25473354c1f96
Task 1: Ruling: verifyEmailWithCode resolves when the code was applied but the reload after it fails, logging the error class only — the code is spent once applied, so a rejection would make a retry say the link expired — a signed-in person's banner stays until they press I've verified
Task 1: complete (commits 6440767..33c1a4a, not reviewed)
Progress: 2/4 tasks — Task 1 Action link parsing and the Auth calls behind it — parseActionLink, readPasswordResetEmail, resetPassword, verifyEmailWithCode and four new error messages, tested on the Auth emulator
Task 2: started 2026-11-05 18:30 (worktree from a3f1d7c)
Task 3: started 2026-11-05 18:30 (worktree from a3f1d7c)
Task 3: agent implementer a79b92278785c0796
Task 3: Ruling: AdSense loaded on an earlier page is not unloaded by a client-side navigation to /auth/action/; left as is — reset and verify links arrive from email as a full page load, and the app never links to /auth/action/ with a code — a future in-app link to /auth/action/ with a code would expose it to the ad script; the final review weighs it
Task 3: merged (03526d5..03526d5)
Task 3: complete (commits a3f1d7c..03526d5, not reviewed)
Progress: 3/4 tasks — Task 3 Keep the one-time code out of the cache and away from ads — the service worker bypasses /auth/action and AdSense isn't loaded there
Task 2: agent implementer aff3b3f9a3d4b0bb3
Task 2: Ruling: Accept Task 2's additions beyond its Files: authErrorCode and isSpentActionCode in lib/auth/auth-errors.ts, the Header rendered by the handler, and three logic test files beside the page — both flows need the spent-code check, the header's title depends on the link, and with no DOM test library the exported logic is what can be tested — the final review may want the helpers elsewhere
Task 2: minor (deferred): scripts/hosting-pages/public.json doesn't list auth/action/index.html, so the hosting-build check doesn't require the page
Task 2: merged (a6ffe12..a6ffe12)
Task 2: complete (commits a3f1d7c..a6ffe12, not reviewed)
Progress: 4/4 tasks — Task 2 The `/auth/action/` page — the /auth/action/ page resets a password, verifies an email, and forwards other modes to Firebase's handler
Final review: started 2026-11-05 18:41
Note: End checks on a6ffe12: typecheck pass, lint pass (0 errors, 7 warnings, all in files this branch didn't add; the React Compiler finding), smoke could not run (ports 2140-2143 held by the local-dev-env-emulators worktree), pnpm build pass with out/auth/action/index.html, check:hosting could not run (same ports)
Note: Walk-through at 390 and 1280: reset form, 8-character rule, success, used link, incomplete and unknown links, privacy links all as planned; FINDING Important: a valid verifyEmail link opened while signed in shows This link isn't complete. Likely cause, not confirmed: ActionHandler's ref is per instance, so a remount when auth state settles re-reads the cleaned URL; the fix wave must keep the parsed link across a remount. Run paused here at the usage limit; final reviews were still running
Final review: agent final-reviewer a2849e3e1f71e3910
Final review: agent security-reviewer aa11fb98129b6d87c
Provisional: After a network failure on this page, a retry that finds the code spent says the change may already have gone through, not that the link expired — a lost reply makes the first attempt look failed while Firebase applied it; saying expired would tell someone whose password is set that it isn't — the developer confirms the copy: Your password may already be changed. Try signing in with your new password, or ask for a new link. And: Your email may already be verified. Continue to Splitify to check.
Final review: minor (deferred): the reset page's offline note says Connect to sign in
Final review: minor (deferred): the 8-character rule and its message are written in three places
Final review: minor (deferred): Try again is the only action for errors a retry can't fix, such as auth/user-disabled
Final review: minor (deferred): lib/auth/auth-errors.ts:50 comment still says for a failed sign-in
Final review: minor (deferred): lib/firebase/auth.ts:175 logs error.name where the other new logs record the auth code
Final review: minor (deferred): the biometric lock isn't exempt on /auth/action, as on /forgot-password/ and /sign-up/ today
Final review: minor (deferred): the action page's header has no back link
Ruling: Only the calls that spend the code (save, apply) count as an earlier lost reply; a failed link check does not — a failed verifyPasswordResetCode leaves the code unspent, so a later spent answer can't come from it — none known
Final fixes: agent fixer ad3c78fddf8ad58d9
Final review: Ruling: Finding 1 is only half addressed: in the browser a signed-in verify link now shows This link has expired or was already used, while the emulator shows the email verified; one targeted fix round goes to the same fixer — QueryProvider's remount on auth restore also remounts VerifyEmailResult, whose per-instance ref lets it apply the spent code a second time; the verify link, the feature's second purpose, is broken without it — one more round beyond the wave
Note: Final fix round 1 (a6ffe12..24ef9e1): 8 findings, re-review ADDRESSED 2-8, NOT ADDRESSED 1, new Important no-referrer; round 2 a8259bc (verify call and save kept per page load), round 3 d7ad71f (strict-origin)
Note: Browser walk-through at d7ad71f: signed-in verify link shows Your email is verified and the banner is gone after Continue; signed-out reset saves and shows the success state
Note: End checks on d7ad71f: typecheck pass, lint pass (0 errors, 7 warnings in files this branch didn't add), branch unit tests 215/215; smoke and check:hosting still can't run here (ports held by another checkout)
Final review: agent re-reviewer af079d96755556b4d
Final review: agent re-reviewer ab74914607c5d9957
Final review: minor (deferred): action-handler getSnapshot replaces the URL during render when the page is mounted by a soft navigation; no in-app link does that today
Final review: minor (deferred): csp.test.ts headersFor matches block sources by exact string, so the /auth/action glob isn't proven on production Hosting; check with curl -I after deploy
Final review: minor (deferred): a remount after a reset save that lost its reply checks the link without the saved attempts, so it can say expired where may already be changed is right
Final review: minor (deferred): no test mounts VerifyEmailResult or ResetPasswordForm twice; only their module functions are tested
Final review: minor (deferred): reloadEmailVerified reads currentUser without awaiting authStateReady, so a verify reply that lands before auth restore may leave the banner until the next reload (inferred)
Final review: minor (deferred): QueryProvider keys by uid ?? signed-out, so every page remounts at auth restore when signed in and one-shot mount effects run twice
Final review: minor (deferred): after email sign-up the page stayed on an empty sign-up form though the account was created and signed in (seen in the dev server, before and after the fix wave; not checked on main)
Final review: complete (18 findings, 10 fixed, 0 parked)
Open finding: [findings/reset-offline-note-says-sign-in](../../knowledge/findings/reset-offline-note-says-sign-in.md) — The reset page's offline note says "Connect to sign in."
Open finding: [findings/action-page-failures-have-no-way-back](../../knowledge/findings/action-page-failures-have-no-way-back.md) — The action page offers only "Try again" for errors a retry can't fix
Open finding: [findings/biometric-lock-covers-action-page](../../knowledge/findings/biometric-lock-covers-action-page.md) — The biometric lock isn't exempt on /auth/action/
Open finding: [findings/action-page-header-has-no-back-link](../../knowledge/findings/action-page-header-has-no-back-link.md) — The /auth/action/ page's header has no back link
Open finding: [findings/reset-remount-after-lost-reply-says-expired](../../knowledge/findings/reset-remount-after-lost-reply-says-expired.md) — A remount after a reset save that lost its reply can say "expired"
Open finding: [findings/reload-email-verified-skips-auth-restore](../../knowledge/findings/reload-email-verified-skips-auth-restore.md) — reloadEmailVerified doesn't wait for auth to restore
Open finding: [findings/query-provider-remounts-pages-at-auth-restore](../../knowledge/findings/query-provider-remounts-pages-at-auth-restore.md) — QueryProvider remounts every page at auth restore, so one-shot mount effects run twice
Open finding: [findings/sign-up-stays-on-empty-form](../../knowledge/findings/sign-up-stays-on-empty-form.md) — After email sign-up the page stayed on an empty sign-up form
Run: finished 2026-11-06 03:51
