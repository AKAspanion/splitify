"use client";

import { AppProgressBar } from "next-nprogress-bar";
import { AuthProvider } from "./auth/auth-provider";
import ConfirmProvider from "./confirm/ConfirmContext";
import { Suspense, useEffect, useRef, useState } from "react";
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
import { followPersonCache } from "@/lib/offline/restore-cache";

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

  // Whose restore has settled. Reset during render when the person changes, so the first render for a new person
  // already says it is restoring, and queries wait for that person's saved cache.
  const [followed, setFollowed] = useState({ uid, restored: false });
  if (followed.uid !== uid) setFollowed({ uid, restored: false });
  // Signed out, or before sign-in is known, nothing is restored, so nothing is waited for.
  const restoring =
    uid !== null && !(followed.uid === uid && followed.restored);

  // Signed out, the in-memory cache of the person who was here is dropped too.
  useEffect(() => {
    if (status === "signed-out") queryClient.clear();
  }, [status, queryClient]);

  // The person last followed, so a switch straight from one person to another clears the first one's cache.
  const lastUid = useRef<string | null>(null);
  useEffect(() => {
    if (!uid) return;
    if (lastUid.current !== null && lastUid.current !== uid)
      queryClient.clear();
    lastUid.current = uid;
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
          current.uid === uid ? { uid, restored: true } : current,
        );
        void queryClient.resumePausedMutations();
      },
    );
  }, [uid, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={restoring}>{children}</IsRestoringProvider>
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
