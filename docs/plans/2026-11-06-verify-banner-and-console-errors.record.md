# SDD ledger — plan: docs/plans/2026-11-06-verify-banner-and-console-errors.md
Plugin: ga 2.16.0 (5660c9e)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=end-of-plan; review.minors=defer; knowledge.update=end-of-plan
Run base: 3b3ab155bffc1c307334e38e3534396c83d618a4
Provisional: plan approved on settled facts — the developer's answers of 2026-11-06 — the developer confirms the plan
Note: no spec — a small change settled by the developer's answers
Pre-flight: no shared interfaces: Task 1 owns the banner, layout, Groups and Profile; Task 2 owns dialog.tsx and the action handler
Task 1: started 2026-11-06 13:11 (worktree from 3b3ab15)
Task 2: started 2026-11-06 13:11 (worktree from 3b3ab15)
Task 1: merged (12be27b..12be27b)
Task 1: complete (commits 12be27b..12be27b, not reviewed)
Task 2: merged (0e99d32..0e99d32)
Task 2: complete (commits 0e99d32..0e99d32, not reviewed)
Final review: started 2026-11-06 13:17
Note: End checks on 0e99d32: smoke pass (on 3b3ab15 stack, reloaded), typecheck pass, lint pass, format-check pass; checked by hand in the running app: banner placement, dismiss, 7-day return, one dialog close button, no render warning on /auth/action/
Ruling: A dismissal dated in the future is invalid and shows the banner; the snooze holds only for 0 <= now - dismissed < 7 days — Task 1's acceptance case contradicted the plan's Review Focus (never hide more than 7 days from now); the Review Focus states the developer's 7 days — someone whose clock jumps back sees the banner again after dismissing
Final review: minor (deferred): storage catch blocks in verify-banner-dismissal log nothing
Final review: minor (deferred): openActionLink stays exported for tests only and cleans synchronously without the once guard
Final review: minor (deferred): no test fails if the banner's key={user.uid} remount is removed
Final review: minor (deferred): if replaceState and location.replace both throw, the finally's error hides the first (re-review Minor)
Final review: complete (4 findings, 4 fixed, 0 parked)
Run: finished 2026-11-06 13:35
