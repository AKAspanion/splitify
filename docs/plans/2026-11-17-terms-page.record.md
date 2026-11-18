# SDD ledger — plan: docs/plans/2026-11-17-terms-page.md
Plugin: ga 2.20.0 (afcdea0)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=ask; review.minors=defer; knowledge.update=end-of-plan
Run base: ad646deb39267d0aa743da7b2cbe9b5d5861d25d
Note: no spec — a single public content page mirroring the privacy page; rulings rest on the plan
Pre-flight: Task 1 vs Task 2: no shared file; Task 2 links to /terms/ by string, consumes nothing of Task 1
Pre-flight: Task 1: tests (page render, sw-routing /terms/) match its files; agrees with itself
Pre-flight: Task 2: tests in privacy/page.test.tsx cover privacy and delete-account links; sign-in/up footer links untested by unit test, checked in the browser at the end
Task 1: started 2026-11-18 10:10
Ruling: dev servers not started: ports 2140-2150 belong to another worktree's running stack — stopping another session's servers is outside this run — verification runs next dev alone on another port; the emulator-backed flows aren't exercised, which these static pages don't need
Task 1: agent implementer a73a09d12bbac38c1
Note: Task 1: implementer returned its report inline, no report file
Task 1: complete (commits ad646de..ab8f2c3, not reviewed)
Task 2: started 2026-11-18 10:11
Progress: 1/2 tasks — Task 1 The /terms page — 1/2 tasks — Task 1 The /terms page — public /terms page, in the hosting check and the service worker's page list
Task 2: agent implementer a1af48627e5a1e6ef
Task 2: complete (commits ab8f2c3..89b0a14, not reviewed)
Progress: 2/2 tasks — Task 2 Link the terms beside the privacy policy — Task 2 Link the terms — sign-in, sign-up, privacy and delete-account link /terms/ with plain anchors
Ruling: smoke and check:hosting's emulator phase replaced by next build, a page-by-page check of out/ against every hosting manifest, and a signed-out browser check of /terms, /privacy and /sign-in on next dev — another worktree's dev stack holds ports 2140-2150 — the Hosting emulator's 200 and headers for /terms aren't checked locally; CI's hosting check is the first run of that phase
Run: finished 2026-11-18 10:16
Note: Final review: yes, this time (developer: 'Yes, review it')
Final review: Ruling: Final Important 2 (no e2e for the screen tasks) is fixed: one Playwright spec walks sign-in → Terms → privacy as full page loads — CI runs test:e2e, and it also covers the footer half of security Minor 1 — the spec's first run is CI's, since local ports are taken
Final review: Ruling: Minors 1-4 promoted to the fix wave — each misleads a reader of the policy, the terms or the knowledge base — a small extra diff
Final review: minor (deferred): delete-account links /privacy without and /terms/ with a trailing slash (final Minor 5)
Final review: minor (deferred): unit tests named 'plain anchors' can't tell <a> from next/link <Link> (security Minor 1); the new e2e spec covers the sign-in footer
Final review: minor (deferred): e2e 'no ad script on /terms' step can't fail under next dev, where Adsense renders null (re-review Minor 1)
Final review: minor (deferred): e2e never clicks the sign-in 'Privacy policy' link to the ad page (re-review Minor 2)
Final review: minor (deferred): security/roles.md: blank line splits its History list (re-review Minor 3)
Note: Open for the developer: privacy page still says ads show on 'the public pages' while the terms now name only privacy and delete-account (legal wording, left as is)
Note: CI fix: .mcp.json, rewritten by the ga plugin refresh, failed prettier --check .; formatted it. End checks on the fixed tree: prettier --check . pass, lint pass, tsc pass, pnpm test 483/483 pass; test:rules and e2e not run locally (ports taken)
Final review: complete (8 findings (2 Important, 6 Minor), 6 fixed, 0 parked, 2 deferred; re-review: all addressed, 3 new Minors deferred)
