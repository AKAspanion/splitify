# SDD ledger — plan: docs/plans/2026-11-06-open-findings-fixes.md
Plugin: ga 2.16.0 (5660c9e)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=end-of-plan; review.minors=defer; knowledge.update=end-of-plan
Run base: 7d850d8fa9404c9b1915eb9444d9b218d73c92ff
Provisional: plan approved on settled facts — the four findings and the developer's choice to fix them — the developer confirms the plan
Pre-flight: no shared interfaces: four one-file fixes with their own tests
Task 1: started 2026-11-06 13:46 (worktree from 7d850d8)
Task 2: started 2026-11-06 13:46 (worktree from 7d850d8)
Task 3: started 2026-11-06 13:46 (worktree from 7d850d8)
Task 4: started 2026-11-06 13:46 (worktree from 7d850d8)
Task 3: merged (c59de44..c59de44)
Task 3: complete (commits c59de44..c59de44, not reviewed)
Task 4: merged (0684a6f..0684a6f)
Task 4: complete (commits 0684a6f..0684a6f, not reviewed)
Task 2: merged (f10c5ff..f10c5ff)
Task 2: complete (commits f10c5ff..f10c5ff, not reviewed)
Task 1: merged (c777ffd..c777ffd)
Task 1: complete (commits c777ffd..c777ffd, not reviewed)
Final review: started 2026-11-06 13:52
Note: End checks on c777ffd: typecheck pass, functions tsc pass, lint pass, format-check fail (delete-account-action.test.tsx)
Final review: minor (deferred): a removal that times out or fails leaves the PushToken row and the browser's FCM subscription, so a shared device keeps showing the signed-out account's pushes (security M1, final Minor 1; accepted trade-off of the 5 s deadline)
Final review: minor (deferred): only the HTTP guard checks revocation; deleteMyAccount and SQL Connect still accept a revoked ID token until it expires, so another device can re-register a push token for the anonymised user (security M3)
Final review: minor (deferred): three helpers log an error's class three ways (guard, push register, verify-banner); the browser log format isn't stated in operations/logging (final Minor 3)
Ruling: A key-fetch failure stays a 401: firebase-admin maps it to auth/argument-error, the same code as a bad signature — telling them apart needs the error's message, which the guard must not read or log — during a Google key-endpoint outage people see 'Sign in again' instead of 'Something went wrong'
Final review: minor (deferred): guard.ts:12-14 comment says a key-fetch network failure is a server failure; the SDK reports it as auth/argument-error, so it answers 401 (re-review new Minor)
Final review: complete (3 findings, 3 fixed, 0 parked)
Run: finished 2026-11-06 14:04
