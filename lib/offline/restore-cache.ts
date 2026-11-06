import type { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
  type PersistQueryClientOptions,
  type Persister,
} from "@tanstack/react-query-persist-client";

export type CacheOptions = {
  persister: Persister;
  maxAge: number;
  buster: string;
};

/**
 * Whether the signed-in person is now someone other than the last person signed in, with no sign-out between (sign-out
 * clears the cache itself). The cache still holds that last person's queries until it is cleared.
 */
export function switchesPerson(
  lastSignedIn: string | null,
  uid: string | null,
): boolean {
  return lastSignedIn !== null && uid !== null && lastSignedIn !== uid;
}

/** What the query provider knows about the person whose saved cache it follows. */
export type Followed = {
  /** The signed-in person, null when signed out or before sign-in is known. */
  uid: string | null;
  /** Whether that person's restore has settled. */
  restored: boolean;
  /** The last person signed in, forgotten at sign-out (which clears the cache itself). */
  lastSignedIn: string | null;
  /** Whether the cache may still hold the previous person's queries, so nothing under the provider may render. */
  hiding: boolean;
};

/**
 * The provider's state for this render's auth state: unchanged (the same object) when neither the person nor
 * `lastSignedIn` moved, otherwise reset, hiding when the person switched straight from someone else.
 */
export function nextFollowed(
  followed: Followed,
  uid: string | null,
  status: string,
): Followed {
  const lastSignedIn =
    uid ?? (status === "signed-out" ? null : followed.lastSignedIn);
  if (followed.uid === uid && followed.lastSignedIn === lastSignedIn)
    return followed;
  const samePerson = followed.uid === uid;
  return {
    uid,
    restored: samePerson && followed.restored,
    lastSignedIn,
    hiding: samePerson
      ? followed.hiding
      : switchesPerson(followed.lastSignedIn, uid),
  };
}

/**
 * Once the previous person's queries are cleared, the hide ends for `uid`, whether or not their restore has settled:
 * the children render with restoring true and their queries wait, so the page stays usable however long it takes.
 */
export function afterClear(followed: Followed, uid: string): Followed {
  return followed.uid === uid && followed.hiding
    ? { ...followed, hiding: false }
    : followed;
}

/** Logs the cause class only: the saved cache is personal data, and an IndexedDB message may quote it. */
function logFailure(what: string, error: unknown): void {
  console.error(
    `[cache] ${what} failed: ${error instanceof Error ? error.name : "unknown"}`,
  );
}

/**
 * Restores the person's saved cache into the client, then saves the client under that person whenever it changes.
 * Calls onRestored once the restore settles (restored, expired or failed). Returns a stop function: after it is
 * called, nothing more is saved and a restore still running is ignored (its data is not kept, onRestored not called).
 */
export function followPersonCache(
  queryClient: QueryClient,
  options: CacheOptions,
  onRestored: () => void,
): () => void {
  let stopped = false;
  let unsubscribe: (() => void) | undefined;
  const { persister, maxAge, buster } = options;

  // The library hydrates whatever restoreClient answers, so a restore that ends after the stop answers nothing:
  // the person it was for has gone, and their data must not land in the client the next person uses.
  // Failures are caught here rather than in the library, which logs the error itself (message and all) outside
  // production. An entry that can't be read is discarded, as the library would.
  const removeClient = async () => {
    try {
      await persister.removeClient();
    } catch (error) {
      logFailure("discarding the saved cache", error);
    }
  };
  const guarded: Persister = {
    persistClient: (client) => persister.persistClient(client),
    removeClient,
    restoreClient: async () => {
      try {
        const saved = await persister.restoreClient();
        return stopped ? undefined : saved;
      } catch (error) {
        logFailure("restoring the saved cache", error);
        await removeClient();
        return undefined;
      }
    },
  };
  const persistOptions: PersistQueryClientOptions = {
    // The persist package resolves its own, newer @tanstack/query-core (package.json allows each its own minor), and
    // a QueryClient's private fields make the two versions' types differ. The library's provider took this same
    // client at runtime before; only the type needs the bridge.
    queryClient:
      queryClient as unknown as PersistQueryClientOptions["queryClient"],
    persister: guarded,
    maxAge,
    buster,
  };

  persistQueryClientRestore(persistOptions)
    // Hydrating a malformed entry can still throw; the app goes on without the saved cache.
    .catch((error: unknown) => logFailure("restoring the saved cache", error))
    .then(() => {
      if (stopped) return;
      unsubscribe = persistQueryClientSubscribe(persistOptions);
      onRestored();
    });

  return () => {
    stopped = true;
    unsubscribe?.();
    unsubscribe = undefined;
  };
}
