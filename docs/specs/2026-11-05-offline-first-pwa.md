# Spec: offline-first PWA (spec 4)

Date: 2026-11-05 · Branch: `feat/offline-first-pwa`, stacked on spec 2c's

## Why

The last part of reviving Splitify: it works without a connection. What works offline is settled in
[offline scope](../../knowledge/decisions/offline-first-scope.md): everything seen can be read, adding an expense and
recording a settlement are queued and sent when the connection returns, and every other change is disabled offline
with a message. SQL Connect's own web cache is memory-only ([SQL Connect](../../knowledge/decisions/sql-connect-database.md)),
so the saved cache is the app's own, in IndexedDB. Firebase Auth restores the signed-in person with no network
([Firebase Auth](../../knowledge/decisions/firebase-auth.md)). The push service worker and the offline one share one
registration ([FCM](../../knowledge/decisions/firebase-cloud-messaging.md)).

## One service worker

- `public/sw.js` replaces `public/firebase-messaging-sw.js`: it keeps the FCM background handling as it is today and
  adds the offline caching. `lib/push/register.ts` registers `/sw.js` (with the same config query) and passes that
  registration to `getToken`; `app/launch.tsx` registers it for everyone, signed in or not, so the shell is cached
  from the first visit.
- `scripts/build-sw.mjs` runs after `next build` (`postbuild`) and writes `out/sw-manifest.js`: the list of every file
  in `out/` (pages, `/_next/static/**`, icons, the manifest) and a version from their contents' hash. `sw.js` imports
  it.
- **Install:** precaches the manifest's files under a cache named with the version. **Activate:** deletes every other
  `splitify-` cache and takes control.
- **Fetch:** `/_next/static/**` and images cache-first; page navigations network-first with a 3-second timeout, then
  the cached page for that path, then the cached placeholder page the Hosting rewrites name for an id route (for
  example `/groups/_/index.html` for `/groups/abc`); `/api/**` and anything cross-origin (Firebase, Google) is never
  cached by the worker.
- A new version shows a toast "A new version of Splitify is ready." with "Reload", which tells the waiting worker to
  take over and reloads.

## The saved cache

- react-query's cache is persisted to IndexedDB with `@tanstack/react-query-persist-client` and an IndexedDB
  persister over `idb-keyval`, as one entry per signed-in person (`splitify-cache-<uid>`), kept for 7 days
  (`maxAge`), and thrown away on a new app version (`buster` = the service worker's version).
- Queries run `networkMode: "offlineFirst"`: offline they answer from the saved cache; online they refetch as today.
- Signing out deletes that person's entry, so the next person on the device sees none of it.

## Writing offline

- `CreateExpense` and `CreateSettlement` are react-query mutations with defaults registered by key
  (`queryClient.setMutationDefaults`), so paused ones survive a reload in the saved cache and are resumed
  (`resumePausedMutations`) when the browser is back online and the person is signed in.
- Offline, the mutation pauses: the expense or settlement is added to the group's cached expense list and ledger at
  once (optimistic), marked "Waiting to sync", and the form returns to the group as it does online.
- When it is sent: success replaces the optimistic row with the server's; an "already exists" answer for its id (a
  retry after a write that went through but never answered) counts as success; any other rejection removes the row,
  restores the cache, and shows "An expense you added offline couldn't be saved: <reason>" with `toUserMessage`'s
  text, which for a person removed from the group is "Not found".
- Every id is made when the person saves, so a retry never records it twice.

## Offline in the screens

- `hooks/use-online.ts` `useOnline()` follows `navigator.onLine` and the `online`/`offline` events.
- A banner in the signed-in shell while offline: "You're offline. Showing what was saved on this device." and, when
  any are waiting, "<n> changes waiting to sync"; back online with changes waiting, "Syncing <n> changes…" until they
  finish.
- Online-only actions are disabled while offline, each with "You're offline. This needs a connection." beside or
  under it: create, edit or delete a group; add a member; edit or delete an expense; add or edit a friend or a
  contact; send feedback; delete an account; download a report; the biometric lock's register and remove.
- The sign-in screens offline say "You're offline. Connect to sign in." and disable their buttons.

## Testing

- Unit: the manifest writer (every file listed, the version changing when a file does), the navigation fallback's
  choice of cached page for each rewrite, the duplicate-id-as-success rule, the optimistic insert and the rollback
  on rejection, and `useOnline`.
- Browser check against the emulators with the network turned off (Playwright's `context.setOffline`):
  1. Load the app online, open a group, go offline, reload: the group, its expenses, balances and activity show from
     the saved cache, with the offline banner.
  2. Offline, add an expense and a settlement: both show "Waiting to sync", the balances include them, and "2
     changes waiting to sync" shows.
  3. Reload while still offline: they are still waiting. Go online: they sync, the marks go, and the server has each
     exactly once.
  4. Offline, every online-only action is disabled with its message.
  5. Remove the person from the group in another session while they're offline with a queued expense; go online: the
     rejection message shows and the row goes.
  6. Sign out and in as someone else on the same device: none of the first person's data shows.
- `yarn tsc --noEmit`, `yarn lint`, `yarn test`, `yarn test:rules`, `yarn build` and `yarn check:hosting` pass.

## Done when

- The checks above pass, and Chrome's Lighthouse PWA audit (or its successor's installability check) reports the
  site installable with a service worker that answers offline.
