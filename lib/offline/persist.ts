import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

/** The saved cache is kept 7 days. */
export const CACHE_MAX_AGE_MS = 604800000;

/** One IndexedDB entry per signed-in person, so the next person on the device sees none of it. */
export function cacheKey(uid: string): string {
  return `splitify-cache-${uid}`;
}

// People whose entry was deleted by signing out: a write the cache had already queued must not bring it back.
const cleared = new Set<string>();

/** Saves react-query's cache to IndexedDB under the person's own key. */
export function createPersister(uid: string): Persister {
  const key = cacheKey(uid);
  cleared.delete(uid);
  return {
    persistClient: async (client: PersistedClient) => {
      if (!cleared.has(uid)) await set(key, client);
    },
    restoreClient: () => get<PersistedClient>(key),
    removeClient: () => del(key),
  };
}

/** Deletes that person's saved cache. Sign-out runs it before Firebase's own sign-out. */
export async function clearSavedCache(uid: string): Promise<void> {
  cleared.add(uid);
  await del(cacheKey(uid));
}
