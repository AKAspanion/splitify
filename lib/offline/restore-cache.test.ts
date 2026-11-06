import { dehydrate, QueryClient } from "@tanstack/react-query";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  afterClear,
  followPersonCache,
  nextFollowed,
  switchesPerson,
  type Followed,
} from "./restore-cache";

const MAX_AGE = 60_000;
const BUSTER = "v1";

/** A saved client holding one query, `["group", n]`, whose data is `data`. */
function savedClient(
  data: unknown,
  { timestamp = Date.now(), buster = BUSTER, n = 1 } = {},
): PersistedClient {
  const source = new QueryClient();
  source.setQueryData(["group", n], data);
  return { timestamp, buster, clientState: dehydrate(source) };
}

/** An in-memory persister whose restore can be held open until the test lets it go. */
function fakePersister(saved?: PersistedClient) {
  let release: (value: PersistedClient | undefined) => void = () => {};
  let fail: (error: unknown) => void = () => {};
  const pending = new Promise<PersistedClient | undefined>((res, rej) => {
    release = res;
    fail = rej;
  });
  const persister = {
    persistClient: vi.fn<Persister["persistClient"]>(async () => {}),
    removeClient: vi.fn<Persister["removeClient"]>(async () => {}),
    restoreClient: vi.fn<Persister["restoreClient"]>(async () => saved),
  };
  return {
    persister,
    /** Makes the next restore wait for `release` or `fail`. */
    hold() {
      persister.restoreClient.mockImplementationOnce(() => pending);
    },
    release: (value: PersistedClient | undefined) => release(value),
    fail: (error: unknown) => fail(error),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** An `onRestored` spy, and a wait that fails on its assertion when it isn't called within a second. */
function restoredSignal() {
  const onRestored = vi.fn();
  const settled = () =>
    vi.waitFor(() => expect(onRestored).toHaveBeenCalled(), { timeout: 1000 });
  return { onRestored, settled };
}

describe("followPersonCache", () => {
  const stops: Array<() => void> = [];
  afterEach(() => {
    stops.splice(0).forEach((stop) => stop());
    vi.restoreAllMocks();
  });

  function follow(
    client: QueryClient,
    persister: Persister,
    onRestored: () => void,
  ) {
    const stop = followPersonCache(
      client,
      { persister, maxAge: MAX_AGE, buster: BUSTER },
      onRestored,
    );
    stops.push(stop);
    return stop;
  }

  it("restores the saved query into the client, then calls onRestored once", async () => {
    const client = new QueryClient();
    const { persister } = fakePersister(savedClient({ name: "Trip" }));
    const { onRestored, settled } = restoredSignal();

    follow(client, persister, onRestored);
    await settled();
    await flush();

    expect(client.getQueryData(["group", 1])).toEqual({ name: "Trip" });
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it("saves the client after the restore whenever its data changes", async () => {
    const client = new QueryClient();
    const { persister } = fakePersister(undefined);
    const { onRestored, settled } = restoredSignal();

    follow(client, persister, onRestored);
    await settled();
    client.setQueryData(["group", 2], { name: "Flat" });

    expect(persister.persistClient).toHaveBeenCalled();
    const last = persister.persistClient.mock.lastCall?.[0];
    expect(last?.buster).toBe(BUSTER);
    expect(
      last?.clientState.queries.find((q) => q.queryKey[1] === 2)?.state.data,
    ).toEqual({ name: "Flat" });
  });

  it("saves nothing after the stop function is called", async () => {
    const client = new QueryClient();
    const { persister } = fakePersister(undefined);
    const { onRestored, settled } = restoredSignal();

    const stop = follow(client, persister, onRestored);
    await settled();
    stop();
    client.setQueryData(["group", 3], { name: "Office" });
    await flush();

    expect(persister.persistClient).not.toHaveBeenCalled();
  });

  it("ignores a restore still running when stopped: its data is not kept and onRestored is not called", async () => {
    const client = new QueryClient();
    const fake = fakePersister();
    fake.hold();
    const onRestored = vi.fn();

    const stop = follow(client, fake.persister, onRestored);
    stop();
    fake.release(savedClient({ name: "Old person" }));
    await flush();
    await flush();

    expect(client.getQueryData(["group", 1])).toBeUndefined();
    expect(onRestored).not.toHaveBeenCalled();
    client.setQueryData(["group", 4], { name: "After" });
    await flush();
    expect(fake.persister.persistClient).not.toHaveBeenCalled();
  });

  it("still calls onRestored when the restore fails, leaves the client unchanged, and logs the class only", async () => {
    const client = new QueryClient();
    client.setQueryData(["group", 9], { name: "Kept" });
    const fake = fakePersister();
    fake.hold();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { onRestored, settled } = restoredSignal();

    follow(client, fake.persister, onRestored);
    fake.fail(new TypeError("secret detail from IndexedDB"));
    await settled();
    await flush();

    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(client.getQueryCache().getAll()).toHaveLength(1);
    expect(client.getQueryData(["group", 9])).toEqual({ name: "Kept" });
    const logged = [...error.mock.calls, ...warn.mock.calls]
      .flat()
      .map((part) => (part instanceof Error ? part.message : String(part)))
      .join(" ");
    expect(logged).toContain("TypeError");
    expect(logged).not.toContain("secret detail");
    // An entry that can't be read is discarded, as the library does.
    expect(fake.persister.removeClient).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["older than maxAge", { timestamp: Date.now() - MAX_AGE - 1000 }],
    ["saved under another buster", { buster: "v0" }],
  ])(
    "restores nothing from a saved client %s, removes it, and calls onRestored",
    async (_, saved) => {
      const client = new QueryClient();
      const { persister } = fakePersister(
        savedClient({ name: "Stale" }, saved),
      );
      const { onRestored, settled } = restoredSignal();

      follow(client, persister, onRestored);
      await settled();
      await flush();

      expect(client.getQueryData(["group", 1])).toBeUndefined();
      expect(persister.removeClient).toHaveBeenCalledTimes(1);
      expect(onRestored).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ["a stale entry", false],
    ["an entry that could not be read", true],
  ])(
    "still calls onRestored when removing %s fails, and logs the class only",
    async (_, readFails) => {
      const client = new QueryClient();
      const { persister } = fakePersister(
        savedClient({ name: "Stale" }, { buster: "v0" }),
      );
      if (readFails)
        persister.restoreClient.mockRejectedValueOnce(new Error("read detail"));
      persister.removeClient.mockRejectedValueOnce(
        new DOMException("quota detail", "QuotaExceededError"),
      );
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { onRestored, settled } = restoredSignal();

      follow(client, persister, onRestored);
      await settled();
      await flush();

      expect(onRestored).toHaveBeenCalledTimes(1);
      expect(client.getQueryData(["group", 1])).toBeUndefined();
      const logged = [...error.mock.calls, ...warn.mock.calls]
        .flat()
        .map((part) => (part instanceof Error ? part.message : String(part)))
        .join(" ");
      expect(logged).toContain("QuotaExceededError");
      expect(logged).not.toContain("quota detail");
      expect(logged).not.toContain("read detail");
    },
  );

  it("follows person B on the same client after person A is stopped, and saves nothing more under A", async () => {
    const client = new QueryClient();
    const a = fakePersister(savedClient({ name: "A's group" }, { n: 1 }));
    const b = fakePersister(savedClient({ name: "B's group" }, { n: 2 }));
    const signalA = restoredSignal();
    const stopA = follow(client, a.persister, signalA.onRestored);
    await signalA.settled();
    stopA();
    a.persister.persistClient.mockClear();

    client.clear();
    const signalB = restoredSignal();
    follow(client, b.persister, signalB.onRestored);
    await signalB.settled();
    client.setQueryData(["group", 5], { name: "New for B" });
    await flush();

    expect(b.persister.restoreClient).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(["group", 2])).toEqual({ name: "B's group" });
    expect(b.persister.persistClient).toHaveBeenCalled();
    expect(a.persister.persistClient).not.toHaveBeenCalled();
  });
});

describe("switchesPerson", () => {
  it.each([
    ["A to B", "a", "b", true],
    ["nobody to A (sign-in, sign-up)", null, "a", false],
    ["A to signed out", "a", null, false],
    ["A to A", "a", "a", false],
    ["signed out to signed out", null, null, false],
  ])("%s", (_, lastSignedIn, uid, expected) => {
    expect(switchesPerson(lastSignedIn, uid)).toBe(expected);
  });
});

describe("nextFollowed", () => {
  type Step = [uid: string | null, status: string];
  const start: Followed = {
    uid: null,
    restored: false,
    lastSignedIn: null,
    hiding: false,
  };
  /** Applies each auth state in turn, as successive renders would, settling A's restore once it is followed. */
  function run(steps: Step[]): Followed {
    return steps.reduce((followed, [uid, status]) => {
      const next = nextFollowed(followed, uid, status);
      return next.uid === "a" ? { ...next, restored: true } : next;
    }, start);
  }

  it("signing in from nobody hides nothing, so the sign-up form stays mounted", () => {
    const followed = nextFollowed(start, "a", "signed-in");
    expect(followed).toEqual({
      uid: "a",
      restored: false,
      lastSignedIn: "a",
      hiding: false,
    });
  });

  it("a switch straight from A to B hides the children and waits for B's restore", () => {
    const followed = run([
      [null, "loading"],
      ["a", "signed-in"],
      ["b", "signed-in"],
    ]);
    expect(followed).toEqual({
      uid: "b",
      restored: false,
      lastSignedIn: "b",
      hiding: true,
    });
  });

  it("A, then signed out, then B is not a switch: sign-out cleared the cache, and sign-up keeps its form", () => {
    const followed = run([
      ["a", "signed-in"],
      [null, "signed-out"],
      ["b", "signed-in"],
    ]);
    expect(followed.hiding).toBe(false);
    expect(followed.lastSignedIn).toBe("b");
  });

  it("A, then no user while auth reloads, then B is still a switch", () => {
    const followed = run([
      ["a", "signed-in"],
      [null, "loading"],
      ["b", "signed-in"],
    ]);
    expect(followed.hiding).toBe(true);
  });

  it("the same person again (a token refresh) changes nothing", () => {
    const followed = run([["a", "signed-in"]]);
    expect(nextFollowed(followed, "a", "signed-in")).toBe(followed);
  });
});

describe("afterClear", () => {
  const hidingB: Followed = {
    uid: "b",
    restored: false,
    lastSignedIn: "b",
    hiding: true,
  };

  it("ends the hide for the person whose switch cleared the cache, before their restore settles", () => {
    expect(afterClear(hidingB, "b")).toEqual({ ...hidingB, hiding: false });
  });

  it("leaves a newer person's hide alone, and answers the same state when nothing is hidden", () => {
    expect(afterClear(hidingB, "a")).toBe(hidingB);
    const shown = { ...hidingB, hiding: false };
    expect(afterClear(shown, "b")).toBe(shown);
  });
});
