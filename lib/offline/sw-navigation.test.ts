import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const routing = require("./sw-routing.js");

type Listener = (event: unknown) => void;

/** Runs public/sw.js against stand-ins for the worker's globals, and returns what it did with a fetch event. */
function loadWorker(opts: {
  fetch: () => Promise<Response>;
  cached?: Response;
}) {
  const listeners: Record<string, Listener> = {};
  const cache = {
    put: vi.fn(async () => undefined),
  };
  const self = {
    location: { origin: "http://app.test", href: "http://app.test/sw.js" },
    addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
    SplitifySwRouting: routing,
    __SPLITIFY_SW_MANIFEST__: { version: "t", files: [] },
  };
  const sandbox = {
    self,
    importScripts: (...urls: string[]) => {
      // The Firebase scripts are best effort in the worker; the two local ones are provided above.
      if (urls.some((u) => u.startsWith("https://"))) throw new Error("no CDN");
    },
    caches: {
      match: vi.fn(async () => opts.cached),
      open: vi.fn(async () => cache),
      keys: vi.fn(async () => []),
    },
    fetch: vi.fn(opts.fetch),
    console: { error: vi.fn() },
    URL,
    URLSearchParams,
    Response,
    Promise,
    Symbol,
    setTimeout,
    encodeURI,
    encodeURIComponent,
  };
  vm.runInNewContext(
    readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8"),
    sandbox,
  );
  const respond = (request: unknown): Promise<Response> | undefined => {
    let answer: Promise<Response> | undefined;
    listeners.fetch({
      request,
      respondWith: (p: Promise<Response>) => (answer = p),
    });
    return answer;
  };
  return { respond, sandbox };
}

const navigation = {
  method: "GET",
  mode: "navigate",
  url: "http://app.test/groups/abc/",
};

describe("worker navigation", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("answers from the cached page when the network says nothing for 3 seconds", async () => {
    const cached = new Response("cached page");
    const { respond } = loadWorker({
      fetch: () => new Promise<Response>(() => undefined),
      cached,
    });
    const answer = respond(navigation) as Promise<Response>;
    await vi.advanceTimersByTimeAsync(3000);
    expect(await answer).toBe(cached);
  });

  it("waits for the network when nothing is cached", async () => {
    const live = new Response("live page");
    const { respond } = loadWorker({
      fetch: () =>
        new Promise<Response>((r) => setTimeout(() => r(live), 5000)),
    });
    const answer = respond(navigation) as Promise<Response>;
    await vi.advanceTimersByTimeAsync(5000);
    expect(await answer).toBe(live);
  });

  it("answers from the network when it is quick", async () => {
    const live = new Response("live page");
    const { respond } = loadWorker({
      fetch: async () => live,
      cached: new Response("cached page"),
    });
    const answer = respond(navigation) as Promise<Response>;
    await vi.advanceTimersByTimeAsync(10);
    expect(await answer).toBe(live);
  });

  it("answers from the cache at once when the network fails", async () => {
    const cached = new Response("cached page");
    const { respond } = loadWorker({
      fetch: async () => {
        throw new TypeError("Failed to fetch");
      },
      cached,
    });
    expect(await respond(navigation)).toBe(cached);
  });
});
