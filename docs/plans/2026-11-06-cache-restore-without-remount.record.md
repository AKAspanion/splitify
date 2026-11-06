# SDD ledger — plan: docs/plans/2026-11-06-cache-restore-without-remount.md
Plugin: ga 2.16.0 (5660c9e)
Policy: git.commit=task; run.checkpoints=none; run.unattended=true; run.on-conflict=stop; run.on-plan-defect=rule; run.max-fix-rounds=2; review.when=end-of-plan; review.minors=defer; knowledge.update=end-of-plan
Run base: df264f549d3bce2548de2f5e1c7c2227bfde3bb8
Note: no spec — the plan rests on decisions/offline-first-scope, features/sign-in and the two open findings; root cause confirmed in the browser (form DOM node replaced after sign-up submit)
Pre-flight: one task; it changes components/providers.tsx, which every page sits under; nothing else in flight
Task 1: started 2026-11-06 10:11
Task 1: agent implementer aec93079a3968d18c
Task 1: Ruling: Keep the commented cast in restore-cache.ts for the two query-core copies; bumping @tanstack/react-query to ^5.106.0 is left out of this plan — the library's own provider already passed this same client to these functions, so nothing changes at runtime; a dependency bump touches package.json and the lockfile, outside the task — the cast hides a real type mismatch if the two copies ever diverge in shape
Task 1: Ruling: restoring is derived from state reset during render on a uid change, not set inside the effect — same behaviour, no set-state-in-effect warning, and the first render for a new person already holds queries back — none known
Note: Browser at 259fe40: sign-up shows Check your inbox and Continue with one form mount; Continue goes to /groups/; a signed-in reload of /groups/ keeps its root; the saved cache is written per person; sign-in goes to /groups/
Task 1: complete (commits df264f5..259fe40, not reviewed)
Progress: 1/1 tasks — Task 1 Restore and save the cache per person without remounting the page — QueryProvider follows the person's saved cache without a key, so sign-in no longer remounts the page
Final review: started 2026-11-06 10:19
Final review: agent security-reviewer ad4799563b416de43
Final review: minor (deferred): on a direct A to B switch, A's cached lists stay on screen until B's restore settles (not new; reachable only from a throttled background tab)
Final review: minor (deferred): between Firebase switching to B and React committing, A's save subscription can save a B response under A's entry for a few ms (not new); fix: persistClient writes only when currentUser uid matches
Final review: minor (deferred): save and hydrate failures go through the library's own handling, so production logs nothing for a save that keeps failing
Final review: minor (deferred): a one-microtask gap between the stopped check and the library's hydrate; auth updates can't land in it today
Final review: minor (deferred): QueryProvider's logic has no test; removing the switch clear or lastUid tracking passes every test
Final review: minor (deferred): PRE-EXISTING: another tab that hasn't seen a sign-out can write the signed-out person's saved cache back after it was deleted (cleared set is per tab)
Final review: minor (deferred): PRE-EXISTING: delete-account-action never calls clearSavedCache, so a deleted person's data stays in IndexedDB on the device
Final review: agent final-reviewer aed7e0ffdd1fb85a1
Final review: minor (deferred): nothing guarantees restoring ends if the read never settles; the hydrate-throw branch has no test
Final review: minor (deferred): restore-cache.ts:38-40 comment says the library no longer logs restore failures, but a hydrate throw still does outside production
Final review: minor (deferred): the cast covers an unmet peer dependency: persist-client 5.106.0 wants react-query ^5.106.0; follow-up: bump react-query and remove the cast
Ruling: On a direct A to B switch, render nothing under the query provider until B's restore settles, rather than clearing during render — A's save subscription is live during that render, and a clear there would write an empty client over A's entry and lose A's queued offline writes — a blank page for the length of B's IndexedDB read on a rare cross-tab switch
Note: Browser at 622c8da: sign-out then sign-up in the same document keeps one form mount and shows the confirmation; a direct A to B switch could not be staged (the sign-in form sends a signed-in person on, and clearing auth in another tab renders signed-out first), so it rests on switchesPerson's unit tests and the re-review
Task 1: agent re-reviewer acfb6d4a4c299a2e3
Task 1: fix round 1/2 (1 addressed, 1 open — new Important: the A to B hide has no deadline, so a restore that never settles leaves the page blank; commits 259fe40..622c8da)
Note: Browser at eafc4f9: sign-out then sign-up in the same document keeps one form mount and shows Check your inbox and Continue
Task 1: agent re-reviewer a5d14ca0d592fc24d
Task 1: fix round 2/2 (2 addressed, 0 open — the A to B hide ends after the clear; B never sees A's data; commits 622c8da..eafc4f9)
Final review: minor (deferred): the provider's effect order (the clear after A's cleanup) has no component test; only nextFollowed and afterClear are covered
Final review: complete (18 findings, 2 fixed, 0 parked)
Note: Merged origin/main (b5aee8d) as dbd7e83: conflicts in app/adsense.tsx (kept main's public-pages-only component plus the first-page guard, with a test), lib/security/csp.test.ts (both blocks, plus HSTS on the action page), firebase.emulators.json (regenerated) and 7 knowledge files (History lines both kept; google-adsense merged by hand; indexes and CLAUDE.md regenerated)
Note: End checks on dbd7e83: typecheck pass, lint pass (0 errors, 0 warnings), unit tests 416/416, prettier pass; browser on the merged code: reset (signed out) then sign-in with the new password, signed-in verify clears the banner, sign-up after sign-out shows the confirmation with one form mount, privacy links present; smoke, check:hosting and test:e2e not run (ports 2140-2145 held by the local-dev-env-emulators checkout, and Playwright would reuse its server); CI runs the e2e on the PR
Open finding: [findings/other-tab-rewrites-signed-out-saved-cache](../../knowledge/findings/other-tab-rewrites-signed-out-saved-cache.md) — Another tab can write a signed-out person's saved cache back after it was deleted
Open finding: [findings/deleted-account-leaves-saved-cache-on-device](../../knowledge/findings/deleted-account-leaves-saved-cache-on-device.md) — Deleting an account leaves the person's saved cache in IndexedDB on the device
Final review: minor (deferred): record-only: adsAllowedFor in lib/ads/ads-allowed.ts is now unused by the app after the merge
Final review: minor (deferred): record-only: follow-up to bump @tanstack/react-query to ^5.106.0 and drop the cast in restore-cache.ts
Run: finished 2026-11-06 10:49
