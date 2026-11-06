"use client";

import { AppProgressBar } from "next-nprogress-bar";
import { AuthProvider } from "./auth/auth-provider";
import ConfirmProvider from "./confirm/ConfirmContext";
import { Suspense, useEffect, useState } from "react";
import {
  IsRestoringProvider,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { appVersion } from "@/lib/offline/version";
import { registerQueuedWrites } from "@/lib/offline/queued-writes";
import { syncOnlineState } from "@/lib/offline/online-state";
import { CACHE_MAX_AGE_MS, createPersister } from "@/lib/offline/persist";
import {
  afterClear,
  followPersonCache,
  nextFollowed,
  type Followed,
} from "@/lib/offline/restore-cache";

/**
 * The query client, saved to IndexedDB for the signed-in person only. Sits under `AuthProvider`.
 * It is never remounted when the person changes: a remount at sign-in replaced the page under it, so a form lost
 * what it showed after its own submit (sign-up's confirmation). The person's saved cache is followed instead.
 */
function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client for the page's life: a client made on every render (the theme resolves after the first one)
  // leaves each query watching the old cache, so an invalidation after a write would reach nobody.
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        // Offline, a query answers from the cache (restored from IndexedDB) rather than waiting on the network.
        queries: { refetchOnWindowFocus: false, networkMode: "offlineFirst" },
        // A write made offline pauses, and resumes once the cache is restored and the device is online.
        mutations: { networkMode: "online" },
      },
    });
    // Before the cache is restored, so a write paused before a reload finds its send by key.
    registerQueuedWrites(client);
    syncOnlineState(globalThis.navigator);
    return client;
  });
  const { status, user } = useAuth();
  const uid = user?.uid ?? null;

  // Whose restore has settled, who was last signed in, and whether the cache may still hold someone else's queries.
  // Reset during render when the person changes, so the first render for a new person already says it is restoring,
  // and queries wait for that person's saved cache (`nextFollowed` has the rules).
  const [followed, setFollowed] = useState<Followed>({
    uid,
    restored: false,
    lastSignedIn: uid,
    hiding: false,
  });
  const next = nextFollowed(followed, uid, status);
  if (next !== followed) setFollowed(next);
  // Signed out, or before sign-in is known, nothing is restored, so nothing is waited for.
  const restoring =
    uid !== null && !(followed.uid === uid && followed.restored);
  // Straight from person A to person B, the cache still holds A's queries, and a paused query hands its cached data to
  // the render, so nothing under this provider renders until the clear below has run: one commit, never as long as
  // B's restore. The clear can't move into render: A's save subscription is live until the follow effect's cleanup,
  // and a clear before then would save an empty cache over A's, queued offline writes included.
  const hiding = followed.uid === uid && followed.hiding;

  // Signed out, the in-memory cache of the person who was here is dropped too.
  useEffect(() => {
    if (status === "signed-out") queryClient.clear();
  }, [status, queryClient]);

  // A switch straight from one person to another: React has run every cleanup of this commit first, so A's follow has
  // stopped saving, and A's queries can go. The children then render with restoring true, so they wait for B's
  // restore, and the shell stays usable however long IndexedDB takes. B's restore hydrates only after its read
  // resolves, so this clear never removes B's data.
  useEffect(() => {
    if (!hiding || !uid) return;
    queryClient.clear();
    // Ends a hide this effect owns, after the external clear: no render can do it, since rendering must not clear.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFollowed((current) => afterClear(current, uid));
  }, [hiding, uid, queryClient]);

  useEffect(() => {
    if (!uid) return;
    // The stop function is the cleanup: once the person changes, nothing more is saved under them, and a restore
    // of theirs still running is dropped.
    return followPersonCache(
      queryClient,
      {
        persister: createPersister(uid),
        maxAge: CACHE_MAX_AGE_MS,
        buster: appVersion(),
      },
      () => {
        setFollowed((current) =>
          current.uid === uid ? { ...current, restored: true } : current,
        );
        void queryClient.resumePausedMutations();
      },
    );
  }, [uid, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={restoring}>
        {hiding ? null : children}
      </IsRestoringProvider>
    </QueryClientProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <AppProgressBar
          height="3px"
          color="#32CD32"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </Suspense>
      <AuthProvider>
        <Suspense>
          <QueryProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </QueryProvider>
        </Suspense>
      </AuthProvider>
    </>
  );
}
