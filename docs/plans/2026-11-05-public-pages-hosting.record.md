# SDD ledger — plan: docs/plans/2026-11-05-public-pages-hosting.md
Plugin: ga 2.15.0 (e989938)
Policy: git.commit=task; run.checkpoints=none; run.unattended=false; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=off; review.minors=defer; knowledge.update=after-finish
Run base: 0360169e678f73d9b09f97b5fe17638b2ee5173b
Pre-flight: Task 1 -> Task 2: build:hosting, check:hosting, out/ and the firebase.json hosting block are consumed by name; the test-format Clerk key Task 1 uses is the fallback Task 2 puts in ci.yml
Pre-flight: Task 1 self-consistency: the re-export entries must not change any page.tsx or layout.tsx; if a route handler, server action or proxy.ts still trips the export, the spec allows the smallest workaround as a ruling
Pre-flight: Task 2 self-consistency: deploy.yml must install root deps (--ignore-scripts) before build:hosting, which it doesn't do today, and keep the functions-only install
Task 1: started 2026-11-05 00:14
Task 1: agent implementer aec1b744b811998ab
Task 1: Ruling: In the hosting build only, @clerk/nextjs resolves to lib/clerk-hosting.tsx, which re-exports the client-only @clerk/react with the publishable key from env; @clerk/react becomes a direct dependency at the range the lockfile already has — @clerk/nextjs's ClerkProvider imports a server action, which a static export refuses — the public pages use Clerk's React package, not its Next one, until Clerk is removed in spec 2
Task 1: minor (deferred): Biometric in the platform layout fetches /api/webauthn/devices on /privacy and /delete-account; on Hosting it gets the coming-soon HTML and the parse error is caught silently
Task 1: complete (commits 0360169..c231390, not reviewed)
Progress: 1/2 tasks — Task 1 The hosting build, the coming-soon page and the Hosting config — The hosting build exporting the landing, privacy, delete-account and coming-soon pages, the Hosting config with the headers, and yarn check:hosting passing against the emulator
Task 2: started 2026-11-05 00:17
Task 2: Ruling: The hosting build needs no Clerk key: lib/clerk-hosting.tsx becomes a stub with no Clerk package (signed out, ClerkLoaded renders its children), @clerk/react comes out of package.json, and neither workflow reads NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY — the developer no longer has a Clerk account; decisions/firebase-auth already replaces Clerk, and spec 2 removes it from the app — the landing page always shows its signed-out view on Hosting, which is all it can show until the app moves
Task 2: agent implementer ae59d1b597d3f094e
Note: the implementer's validator run was refused by the permission classifier; the controller ran @action-validator/cli on both workflows
Task 2: complete (commits c231390..b31f954, not reviewed)
Progress: 2/2 tasks — Task 2 Build in CI, deploy from deploy.yml, and the domain steps — CI builds and checks the hosting target, deploy.yml deploys it before the functions, the README lists the optional Variables, the domain steps and Firebase Hosting Admin
Final review: agent implementer a7ae98ddf68953c1b
Note: Clerk stub 0b60323: the implementer returned no report; the controller verified frozen install 0, build:hosting with no Clerk key 0, check:hosting OK, no Clerk SDK in out/_next/static, landing links /sign-up/, tsc 0, lint 0 errors. Smoke not run: the server app has no .env here and this branch doesn't change it
Run: finished 2026-11-05 00:26
