import "fake-indexeddb/auto";
import { get, set } from "idb-keyval";
import { describe, expect, it } from "vitest";
import {
  cacheKey,
  CACHE_MAX_AGE_MS,
  clearSavedCache,
  createPersister,
} from "./persist";

const client = (n: number) => ({
  timestamp: Date.now(),
  buster: "dev",
  clientState: { mutations: [], queries: [{ queryKey: ["group", n] }] },
});

describe("saved cache", () => {
  it("keys the entry per person and keeps it 7 days", () => {
    expect(cacheKey("u1")).toBe("splitify-cache-u1");
    expect(CACHE_MAX_AGE_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("restores what it persisted", async () => {
    const persister = createPersister("u1");
    const saved = client(1);
    await persister.persistClient(saved as never);
    expect(await persister.restoreClient()).toEqual(saved);
  });

  it("clearSavedCache deletes that person's entry and leaves another's", async () => {
    await createPersister("u1").persistClient(client(1) as never);
    await createPersister("u2").persistClient(client(2) as never);
    await clearSavedCache("u1");
    expect(await get(cacheKey("u1"))).toBeUndefined();
    expect(await get(cacheKey("u2"))).toEqual(
      expect.objectContaining({ buster: "dev" }),
    );
  });

  it("clearSavedCache with nothing saved is not an error", async () => {
    await set("unrelated", 1);
    await expect(clearSavedCache("nobody")).resolves.toBeUndefined();
    expect(await get("unrelated")).toBe(1);
  });

  it("a write queued before sign-out does not bring the entry back", async () => {
    const persister = createPersister("u3");
    await persister.persistClient(client(3) as never);
    await clearSavedCache("u3");
    await persister.persistClient(client(3) as never);
    expect(await get(cacheKey("u3"))).toBeUndefined();
    await createPersister("u3").persistClient(client(3) as never);
    expect(await get(cacheKey("u3"))).toBeDefined();
  });
});
