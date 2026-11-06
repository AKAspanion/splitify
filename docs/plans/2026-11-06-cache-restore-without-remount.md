# Cache Restore Without Remount Implementation Plan

**Status:** complete, commits df264f5..eaea848, 2026-11-06. Record: [2026-11-06-cache-restore-without-remount.record.md](2026-11-06-cache-restore-without-remount.record.md).

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:feature-build-team by default, or ga:feature-build. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

Plan, then build; tests with each task. Say 'test-first' or 'spec it first' to work that way.

**Goal:** Signing in no longer remounts every page. After email sign-up, the person sees "Check your inbox to verify
your email. You can start using Splitify now." and Continue, not an empty sign-up form.

**Architecture:** `QueryProvider` (`components/providers.tsx`) keys `PersistQueryClientProvider` by
`uid ?? "signed-out"`, because that provider reads its persister only when it mounts. So when sign-in sets the uid,
React throws away and rebuilds the whole page. The sign-up form loses its "created" state mid-flow and comes back
empty (confirmed in the browser: the form's DOM node is replaced after submit). The fix replaces the keyed provider
with one that never remounts. It is a plain `QueryClientProvider` with `IsRestoringProvider`, and its restore and save
are driven by an effect keyed by uid through `persistQueryClientRestore` and `persistQueryClientSubscribe`, the same
two functions `PersistQueryClientProvider` is built from (`@tanstack/query-persist-client-core`). The orchestration
lives in a plain module, so it can be tested in Node.

**Tech Stack:** Next.js 16 static export, `@tanstack/react-query` and `@tanstack/react-query-persist-client` (with
`@tanstack/query-persist-client-core`, already a dependency of it), idb-keyval persister (`lib/offline/persist.ts`),
Vitest (`vitest.config.mts`).

**Spec:** none. The behaviour comes from verified concepts: `knowledge/decisions/offline-first-scope.md` (saved
cache, one entry per signed-in person) and `knowledge/features/sign-in.md` (after email sign-up the person can use
the app at once; the screen tells them to check their inbox). The finding is
`knowledge/findings/sign-up-stays-on-empty-form.md`, with its cause in
`knowledge/findings/query-provider-remounts-pages-at-auth-restore.md`.

## Global Constraints

- The saved cache stays one entry per signed-in person (`createPersister(uid)`), with `maxAge: CACHE_MAX_AGE_MS` and
  `buster: appVersion()`. One person's cache is never restored into, or saved under, another person's entry.
- Signed out, nothing is saved or restored, and the in-memory cache is cleared (the existing effect stays).
- After a restore, paused mutations resume (`queryClient.resumePausedMutations()`), as `onSuccess` does today.
- While a restore runs, `useIsRestoring()` is true, so queries wait for it, as they do today.
- A restore failure never blocks the app: restoring ends, and the error's class is logged, never its message
  (`knowledge/operations/logging.md`).
- No new dependency: import `persistQueryClientRestore` and `persistQueryClientSubscribe` from
  `@tanstack/react-query-persist-client`, which re-exports `@tanstack/query-persist-client-core`.
- Files are kebab-case, and tests sit beside their file (`knowledge/project/conventions.md`).

## Checkpoints

None: `run.checkpoints` is `none`. The security task's checkpoint becomes a one-line summary in the ledger.

## Review Focus

- Switching straight from person A to person B (signing in as B on a device where A's session expired, with no
  signed-out render between): A's data must not appear for B, and nothing of B's may be saved under A.
- A save that A's subscription fires after the switch: it must not write A's entry with B's queries.
- Sign-out while a restore is still running: the late restore must not fill the cleared cache.
- Offline reload while signed in: the saved cache still restores, and paused writes resume.

---

### Task 1: Restore and save the cache per person without remounting the page

**Files:**
- Create: `lib/offline/restore-cache.ts`
- Test: `lib/offline/restore-cache.test.ts`
- Modify: `components/providers.tsx`

**Interfaces:**
- Consumes: existing `createPersister(uid)`, `CACHE_MAX_AGE_MS` (`lib/offline/persist.ts`), existing `appVersion()`
  (`lib/offline/version.ts`), existing `useAuth()` (`hooks/use-auth.ts`).
- Produces:

```ts
// lib/offline/restore-cache.ts
import type { QueryClient } from "@tanstack/react-query";
import type { Persister } from "@tanstack/react-query-persist-client";

export type CacheOptions = { persister: Persister; maxAge: number; buster: string };

/**
 * Restores the person's saved cache into the client, then saves the client under that person whenever it changes.
 * Calls onRestored once the restore settles (restored, expired or failed). Returns a stop function: after it is
 * called, nothing more is saved and a restore still running is ignored (its data is not kept, onRestored not called).
 */
export function followPersonCache(
  queryClient: QueryClient,
  options: CacheOptions,
  onRestored: () => void,
): () => void;
```

`QueryProvider` keeps one `QueryClient` for the page's life. It renders `QueryClientProvider` and
`IsRestoringProvider value={restoring}`, with no `key`. In an effect keyed by `uid`, it does three things:
- signed in: set `restoring` true, call `followPersonCache(client, { persister: createPersister(uid), maxAge, buster },
  …)`, and when it settles set `restoring` false and resume the paused mutations;
- signed out, or still loading: `restoring` false, and nothing followed;
- the cleanup calls the stop function, and on a change from one uid to another it clears the client before the new
  restore.

**Spec:** none

**Tags:** `security`, `failure-paths`

**Knowledge:** (written by the end-of-plan knowledge job)
- `decisions/offline-first-scope`: the cache provider is no longer keyed by uid. It follows the signed-in person's
  saved cache through `followPersonCache`, so signing in doesn't remount the page.
- `findings/sign-up-stays-on-empty-form`: Fixed. Its title and description move to the past tense.
- `findings/query-provider-remounts-pages-at-auth-restore`: Fixed. Its title and description move to the past tense.

**Acceptance:**
- Given a fake persister holding a saved client with one query, `followPersonCache` restores that query's data into
  the client, then calls `onRestored` once.
- After the restore, setting a query's data makes the persister's `persistClient` run with that data (it is saved).
- After the stop function, setting query data never calls `persistClient` again.
- Stop called while `restoreClient` is still pending: when it resolves, its data is not in the client, and
  `onRestored` is not called.
- `restoreClient` rejecting: `onRestored` is still called once, the client is unchanged, and the log carries the
  error's class, not its message.
- A saved client older than `maxAge`, or with another `buster`: nothing is restored, `onRestored` is called, and the
  stale entry is removed (`removeClient`), as the library does.
- Person A followed and then stopped, person B followed on the same client: B's persister restores, and A's persister
  sees no `persistClient` call after A's stop.
- In the browser, against the dev server on the Auth emulator: email sign-up shows "Check your inbox to verify your
  email. You can start using Splitify now." and Continue. The form's DOM node is the same before and after submit.
  Sign-in still goes to `/groups/`. A signed-in reload of `/groups/` shows the groups, with no second mount.

- [x] **Step 1: Write the failing tests** for each unit Acceptance case in `lib/offline/restore-cache.test.ts`, with an in-memory fake `Persister` and a real `QueryClient` (Node has no IndexedDB, and none is needed)

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run lib/offline/restore-cache.test.ts`
Expected: FAIL on the assertions. Create `lib/offline/restore-cache.ts` with its real export first

- [x] **Step 3: Write `followPersonCache`** over `persistQueryClientRestore` and `persistQueryClientSubscribe`

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run lib/offline/restore-cache.test.ts`
Expected: PASS

- [x] **Step 5: Rewrite `QueryProvider`** in `components/providers.tsx` to the Interfaces: no `key`, `IsRestoringProvider`, the uid effect

- [x] **Step 6: Commit**

```bash
git add lib/offline/restore-cache.ts lib/offline/restore-cache.test.ts components/providers.tsx
git commit -m "Follow the signed-in person's saved cache without remounting the page, so sign-up keeps its confirmation."
```
