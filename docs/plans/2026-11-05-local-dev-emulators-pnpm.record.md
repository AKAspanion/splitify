# SDD ledger — plan: docs/plans/2026-11-05-local-dev-emulators-pnpm.md
Plugin: ga 2.16.0 (5660c9e)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=end-of-plan; review.minors=defer; knowledge.update=end-of-plan
Run base: 2844bcc0aa0bc9f970b138ab3494bcddda04b592
Provisional: The plan approved on settled facts — it rests on the developer's ports (2140 dev, 2141 hub, 2142 auth, then one by one), their choice of demo-splitify and of plan-then-build — the developer confirms the plan
Ruling: Build on feat/local-dev-emulators, renamed in place from the app's worktree branch, which was cut from main at 701d880 — the session runs in this worktree; main holds .ga — none; same base as a fresh cut
Ruling: Start the dev servers after Task 3, not before Task 1 — Task 1 replaces node_modules and Task 3 creates the dev command; servers started now would run yarn's tree on the old ports — no live reload during Tasks 1-2
Pre-flight: firebase.json: Task 1 changes functions[0].predeploy, Task 2 the emulators block; chained 1 then 2, no conflict
Pre-flight: package.json scripts: Task 1 writes dev, dev:web, emulators, functions:*; Task 3 consumes them by name and does not edit package.json
Task 1: started 2026-11-05 14:20
Task 1: agent implementer ae16661d526d330ac
Task 1: complete (commits 2844bcc..d0599f5, not reviewed)
Progress: 1/3 tasks — Task 1 Move from yarn to pnpm — 1/3 tasks — Task 1 Move from yarn to pnpm — root and functions on pnpm 11 with their own lockfiles, CI and checks switched
Task 2: started 2026-11-05 14:36
Task 2: agent implementer a68929bd63b476039
Ruling: Task 2 also edited lib/firebase/auth.test.ts (a hardcoded 9099) and vitest.config.mts (narrowed the lib/firebase exclude so the new test runs in pnpm test); accepted — both carried the old ports or hid the new test — Task 3 starts from Task 2's vitest.config.mts
Task 2: complete (commits d0599f5..472272f, not reviewed)
Progress: 2/3 tasks — Task 2 Emulator ports in the 2140 series, from one place — 2/3 tasks — Task 2 Emulator ports — emulators on 2141-2150 from firebase.json, browser copy held equal by a test, rule tests green
Task 3: started 2026-11-05 14:39
Task 3: agent implementer ae9f34aea17df24d3
Task 3: Ruling: Accept Task 3 with the SQL Connect-triggered functions (mergeContactOnSignUp, sendActivityPush*, sendGroupDeletedPush) not loading in the Functions emulator; record it as a finding — firebase-tools 15.34.2's functionsEmulator.js has no case for SQL Connect mutation triggers and logs them as Unsupported trigger; nothing in this repo can load them — locally, sign-up won't merge a contact and no push is sent; the developer may want a newer firebase-tools later
Task 3: Ruling: Task 3 also added /functions/.secret.local to .gitignore; accepted — otherwise the generated emulator secret shows as untracked and could be committed — none
Task 3: complete (commits 472272f..2505d0d, not reviewed)
Progress: 3/3 tasks — Task 3 `pnpm dev` runs the app against the emulators — 3/3 tasks — pnpm dev runs functions watcher, emulators as demo-splitify and next dev on 2140, api routes rewritten to the Functions emulator
Final review: started 2026-11-05 14:46
Note: End checks on 2505d0d: typecheck pass, lint pass (0 errors, 5 existing warnings), smoke pass
Task 3: agent final-security-reviewer a7fa90e2996cce340
Task 3: agent final-reviewer aa6a40fdc26bf5ff8
Ruling: Fix I1 (dev.mjs shutdown): add firebase-tools 15.34.2 as an exact devDependency and spawn its bin directly, every child in its own process group, one SIGINT per child from dev.mjs, wait for every child (firebase up to 120 s for the export) before exiting, SIGKILL only after that, second Ctrl+C forces, exit non-zero when a child fails or exits unexpectedly — pnpm wrappers exit before firebase finishes its export, so ports stay held and the export can fail unseen; covers Minor 7 too — a bigger dev install; scripts switch from pnpm dlx to the local bin
Provisional: Cloud Tasks emulator, which always starts with Functions, goes on 2151; the port test covers 2141-2151 — it took 9499, outside the 2140 series; 2151 is next in the developer's one-by-one order — the developer confirms 2151 for Cloud Tasks
Provisional: pnpm test:rules runs its own emulators on 2152 hub, 2153 auth, 2154 SQL Connect, 2155 its Postgres, 2156 logging, from a generated config, and the rule-test helpers refuse to run without the emulator env instead of falling back to the dev ports — on the dev ports the rule tests fail while pnpm dev runs, and a stray run would empty the dev database and export it — the developer confirms separate test ports 2152-2156
Ruling: pnpm dev leaves out the Hosting emulator; check:hosting keeps starting it on 2148 — in dev it serves whatever out/ holds under the production CSP, possibly a build with real keys (Minor 8) — none; next dev on 2140 is the dev site
Ruling: Fix the security Minors: next dev binds 127.0.0.1 (ngrok script points at 127.0.0.1:2140), and packageManager carries pnpm 11.0.8's sha512 in both package.json files — the dev rewrites expose two functions to the LAN; the deploy job runs the pnpm binary with credentials — a phone on the LAN can't open the dev server; it couldn't reach the 127.0.0.1 emulators anyway
Ruling: Fix Minors 4-6 in the same wave: README to pnpm and pnpm dev, yarn comments and .prettierignore entries, check-hosting-build on the local firebase bin with the config generator's exit status checked — cheap, in files the wave already touches — none
Ruling: Accept the fix wave's dataconnect/test-utils/emulator-ports.ts and the vitest.rules alias of @/lib/firebase/emulators to it — the app code under test imported the dev ports, so the env-only change still reached the dev emulators — the rule tests see the app's emulator module through an alias
Note: Final review fix wave: commits 2505d0d..2c5a486; deploy.yml still runs pnpm dlx firebase-tools@15.34.2 (same pinned version), left as is
Task 3: agent implementer a956e6b29cfc27fc0
Note: End checks on 2c5a486: typecheck pass, lint pass (0 errors, 5 existing warnings), smoke pass; fix wave also ran pnpm test 192/192 and pnpm test:rules 204/204 beside pnpm dev
Note: Open finding: [findings/sql-connect-triggers-not-run-locally](../../knowledge/findings/sql-connect-triggers-not-run-locally.md) — SQL Connect-triggered functions don't run in firebase-tools 15.34.2's Functions emulator
Run: finished 2026-11-05 15:08
