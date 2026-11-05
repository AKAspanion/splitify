"use client";

import { AppProgressBar } from "next-nprogress-bar";
import { AuthProvider } from "./auth/auth-provider";
import ConfirmProvider from "./confirm/ConfirmContext";
import { Suspense, useEffect, useMemo, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  type Persister,
} from "@tanstack/react-query-persist-client";
import { useAuth } from "@/hooks/use-auth";
import { appVersion } from "@/lib/offline/version";
import { registerQueuedWrites } from "@/lib/offline/queued-writes";
import { syncOnlineState } from "@/lib/offline/online-state";
import { CACHE_MAX_AGE_MS, createPersister } from "@/lib/offline/persist";

// Signed out, nothing is saved or restored.
const NO_PERSISTER: Persister = {
  persistClient: async () => {},
  restoreClient: async () => undefined,
  removeClient: async () => {},
};

/** The query client, saved to IndexedDB for the signed-in person only. Sits under `AuthProvider`. */
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
  const persister = useMemo(
    () => (uid ? createPersister(uid) : NO_PERSISTER),
    [uid],
  );

  // Signed out, the in-memory cache of the person who was here is dropped too.
  useEffect(() => {
    if (status === "signed-out") queryClient.clear();
  }, [status, queryClient]);

  return (
    // Keyed by person: the provider restores once and reads its persister once, when it mounts (before sign-in is
    // known, that is no persister at all), so each person gets a fresh provider with their own.
    <PersistQueryClientProvider
      key={uid ?? "signed-out"}
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE_MS,
        buster: appVersion(),
      }}
      onSuccess={() => {
        void queryClient.resumePausedMutations();
      }}
    >
      {children}
    </PersistQueryClientProvider>
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
