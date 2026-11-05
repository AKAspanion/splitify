# SDD ledger — plan: docs/plans/2026-11-05-google-sign-in-redirect.md
Plugin: ga 2.16.0 (5660c9e)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=end-of-plan; review.minors=defer; knowledge.update=end-of-plan
Run base: 3576ae97e62615a574b2a141445ea6a304e62b1f
Provisional: The run branch feat/google-sign-in-redirect is cut from fix/google-sign-in-popup, not main, taking along 2be1686 and 6a911ca (open PR AKAspanion/splitify#19) — the redirect replaces the popup call that #19 fixes; cut from main it would conflict with #19 in lib/firebase/auth.ts and lib/auth/auth-errors.ts — the developer confirms building on #19, or merges #19 first and this branch rebases onto main
Provisional: .claude/launch.json stays out of every commit — it is this session's local preview config, pointing at a scratchpad script — the developer confirms it isn't wanted in the repository
Provisional: Plan approved on settled facts — both tasks come from the developer's chat request: popup to redirect, and splitify.spanion.in as the auth domain — the developer confirms the plan
Note: no spec — an everyday change asked for in chat; rulings rest on the plan alone
Pre-flight: Task 1 produces signInWithGoogle, googleRedirectPending, completeGoogleSignIn in lib/firebase/auth.ts; Task 2 consumes all three by those names and types — they match; no shared files
Pre-flight: Task 1: its tests (lib/firebase/google-redirect.test.ts) cover the Interfaces it produces; the authDomain fallback case reads lib/firebase/app.ts, which it modifies — consistent
Pre-flight: Task 2: finishGoogleReturn's cases use authErrorMessage's existing copy ('Something went wrong. Try again.', 'Couldn't reach Splitify. Check your connection.'), which lib/auth/auth-errors.ts holds today — consistent; the next=//evil.example case is manual, as the plan says
Note: dev servers: the developer's own pnpm dev already holds 2140, so run dev didn't start a second set; the run uses theirs
Task 1: started 2026-11-05 17:31
Task 1: agent implementer a92b8373e10af70d8
Provisional: Task 1: .env.sample still says NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=splitify-416321.firebaseapp.com — the permission settings deny agents reading or editing .env files, and the controller doesn't route around that — the developer sets it to splitify.spanion.in in .env.sample
Task 1: Ruling: Keep the two additions: concurrent completeGoogleSignIn calls share one in-flight result, and signInWithGoogle throws before redirecting without sessionStorage — both enforce the plan's rule that UpsertMe runs once for every completed Google sign-in (React runs effects twice in development; no marker means no UpsertMe on return) — an extra code path each, both tested
Task 1: complete (commits 3576ae9..829c17c, not reviewed)
Progress: 1/2 tasks — Task 1 Google sign-in by redirect, and the auth domain — signInWithGoogle redirects with a sessionStorage marker; completeGoogleSignIn runs UpsertMe on return; authDomain fallback is splitify.spanion.in
Task 2: started 2026-11-05 17:34
Task 2: agent implementer afa8afbbf04b909cf
Task 2: complete (commits 829c17c..a7e44eb, not reviewed)
Progress: 2/2 tasks — Task 2 The forms finish a Google redirect before they navigate — sign-in and sign-up forms finish a Google redirect on load via finishGoogleReturn, and go to next only after UpsertMe
Final review: started 2026-11-05 17:37
Note: End checks on a7e44eb: typecheck pass, lint pass (0 errors; 2 new react-hooks/set-state-in-effect warnings in sign-in-form.tsx:43 and sign-up-form.tsx:40), smoke pass by hand (run smoke couldn't bind 2140, held by the developer's dev server from another worktree; the session's next dev from this checkout on 2160 answered 200 on /, /sign-in/, /sign-up/, /forgot-password/, /groups/ with no compile errors)
Note: Manual on a7e44eb against production Firebase (localhost:2160, authDomain splitify-416321.firebaseapp.com locally): Continue with Google leaves the page for accounts.google.com via Firebase's handler (no popup); going back without signing in returns to /sign-in?next=/groups with the marker cleared, the button enabled, no error and no console errors. A completed Google sign-in is the developer's to try.
Ruling: The fix wave adds 'self' to firebase.json's frame-src, a file no task listed — with authDomain splitify.spanion.in Firebase frames /__/auth/iframe on the site's own origin, which the CSP blocks; both reviewers found it; curl shows Hosting sends no CSP or X-Frame-Options on /__/auth/iframe, so the site-wide DENY and frame-ancestors stay — one CSP source; the plan should have listed firebase.json
Final review: minor (deferred): auth-errors.ts keeps the unreachable popup codes and maps none of the redirect-only ones
Final review: minor (deferred): auth.ts comment says signInWithGoogle resolves only if the redirect fails to start; it rejects on failure and never settles on success
Final review: minor (deferred): the Google-return effect and google() handler are copied in both forms; a shared hook would hold them once
Final review: minor (deferred): no test covers each form's navigate / error / clear-pending outcome or next=//evil.example at the form level (no component-test tooling)
Final review: minor (deferred): a failed redirect start writes no log line
Final review: minor (deferred): remove localhost and stale preview domains from production's Authorized domains (console, the developer's)
Final review: agent final-reviewer a144f6475c8f18033
Final review: agent security-reviewer a9757ef6297ac8eba
Final fixes: agent fixer a5c9e4ebf4275bc3a
Final review: agent re-reviewer a03bc7c204015f67d
Final review: minor (deferred): if Firebase's own signOut also rejects after a failed UpsertMe, the session stays and the sign-in form sends the person on with no User row (lib/firebase/auth.ts:98-105)
Final review: minor (deferred): the forms' pageshow effect has no test and the back/forward restore is unchecked in a browser
Final review: minor (deferred): firebase.emulators.json frame-src has neither 'self' nor the emulator's auth origin; local Google sign-in on the emulator is unchecked
Task 2: fix round 1/1 (4 addressed, 1 open — the final fix wave's CSP edit joined two frame-src origins with no space; commits a7e44eb..695dbd1)
Note: End checks on 962da6c (after the fix wave): typecheck pass, lint pass (0 errors, the same 7 warnings), smoke pass by hand on the session's next dev (localhost:2160)
Final review: agent re-reviewer aa4005f1ff7baba34
Final review: complete (5 findings, 5 fixed, 0 parked)
Open finding: [findings/google-sign-in-signout-failure-keeps-session](../../knowledge/findings/google-sign-in-signout-failure-keeps-session.md) — a failed sign-out after a failed UpsertMe leaves a Google session with no User row
Open finding: [findings/emulator-csp-blocks-auth-iframe](../../knowledge/findings/emulator-csp-blocks-auth-iframe.md) — the Hosting emulator's frame-src may block Google sign-in locally
Run: finished 2026-11-05 17:55
