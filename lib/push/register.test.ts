import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const firebaseMessaging = vi.hoisted(() => ({
  getMessaging: vi.fn(() => "messaging"),
  getToken: vi.fn().mockResolvedValue("tok-default"),
}));
vi.mock("firebase/messaging", () => firebaseMessaging);
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => "app"),
  getApps: vi.fn(() => []),
}));
import {
  listenForIosToken,
  PUSH_REMOVAL_DEADLINE_MS,
  registerWebPush,
  unregisterThisDevice,
  type PushDeps,
} from "./register";

const KEY = "splitify.pushToken";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

function makeDeps(over: Partial<PushDeps> = {}) {
  const storage = fakeStorage();
  const deps = {
    getToken: vi.fn().mockResolvedValue("tok-web"),
    requestPermission: vi.fn().mockResolvedValue("granted"),
    register: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    storage,
    ...over,
  };
  return { deps: deps as unknown as PushDeps, storage, mocks: deps };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("registerWebPush", () => {
  beforeEach(() => {
    vi.stubGlobal("Notification", function Notification() {});
    vi.stubGlobal("navigator", { serviceWorker: {} });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("registers the token, stores it and returns registered", async () => {
    const { deps, storage, mocks } = makeDeps();
    await expect(registerWebPush(deps)).resolves.toBe("registered");
    expect(mocks.register).toHaveBeenCalledWith("tok-web", "web");
    expect(storage.getItem(KEY)).toBe("tok-web");
  });

  it("returns denied and registers nothing when permission is denied", async () => {
    const { deps, storage, mocks } = makeDeps({
      requestPermission: vi.fn().mockResolvedValue("denied"),
    });
    await expect(registerWebPush(deps)).resolves.toBe("denied");
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.getToken).not.toHaveBeenCalled();
    expect(storage.getItem(KEY)).toBeNull();
  });

  it("returns unsupported without Notification", async () => {
    vi.stubGlobal("Notification", undefined);
    const { deps, mocks } = makeDeps();
    await expect(registerWebPush(deps)).resolves.toBe("unsupported");
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("returns unsupported without a service worker", async () => {
    vi.stubGlobal("navigator", {});
    const { deps, mocks } = makeDeps();
    await expect(registerWebPush(deps)).resolves.toBe("unsupported");
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("returns unsupported and logs one line without the token when getToken rejects", async () => {
    const { deps } = makeDeps({
      getToken: vi.fn().mockRejectedValue(new Error("boom tok-web")),
    });
    await expect(registerWebPush(deps)).resolves.toBe("unsupported");
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "tok-web",
    );
  });

  it("returns unsupported and stores nothing when register rejects", async () => {
    const { deps, storage } = makeDeps({
      register: vi.fn().mockRejectedValue(new Error("nope")),
    });
    await expect(registerWebPush(deps)).resolves.toBe("unsupported");
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(storage.getItem(KEY)).toBeNull();
  });
});

describe("registerWebPush with the real worker registration", () => {
  const registration = { scope: "/" };
  const register = vi.fn();
  beforeEach(() => {
    register.mockReset().mockResolvedValue(registration);
    firebaseMessaging.getToken.mockClear();
    vi.stubGlobal("Notification", function Notification() {});
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "key-1");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "proj-1");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "1:42:web:abc");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "vapid-1");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("registers /sw.js with the config query and gives that registration to getToken", async () => {
    const { deps } = makeDeps();
    const real = { ...deps, getToken: undefined } as Partial<PushDeps>;
    delete real.getToken;
    await expect(registerWebPush(real)).resolves.toBe("registered");
    expect(register).toHaveBeenCalledTimes(1);
    const url = new URL(register.mock.calls[0][0], "https://x.test");
    expect(url.pathname).toBe("/sw.js");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      apiKey: "key-1",
      projectId: "proj-1",
      appId: "1:42:web:abc",
    });
    expect(firebaseMessaging.getToken).toHaveBeenCalledWith(
      "messaging",
      expect.objectContaining({
        serviceWorkerRegistration: registration,
        vapidKey: "vapid-1",
      }),
    );
  });
});

describe("listenForIosToken", () => {
  let target: EventTarget;
  beforeEach(() => {
    target = new EventTarget();
    vi.stubGlobal("window", target);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const send = (detail: unknown) =>
    target.dispatchEvent(new CustomEvent("push-token", { detail }));

  it("registers and stores an ios token", async () => {
    const { deps, storage, mocks } = makeDeps();
    listenForIosToken(deps);
    send("tok-ios");
    await flush();
    expect(mocks.register).toHaveBeenCalledWith("tok-ios", "ios");
    expect(storage.getItem(KEY)).toBe("tok-ios");
  });

  it.each(["ERROR GET TOKEN", "", undefined, 42])(
    "registers nothing for detail %s",
    async (detail) => {
      const { deps, mocks } = makeDeps();
      listenForIosToken(deps);
      send(detail);
      await flush();
      expect(mocks.register).not.toHaveBeenCalled();
    },
  );

  it("registers nothing after unsubscribe", async () => {
    const { deps, mocks } = makeDeps();
    const off = listenForIosToken(deps);
    off();
    send("tok-ios");
    await flush();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("does not store when register fails, and logs one line", async () => {
    const { deps, storage } = makeDeps({
      register: vi.fn().mockRejectedValue(new Error("nope")),
    });
    listenForIosToken(deps);
    send("tok-ios");
    await flush();
    expect(storage.getItem(KEY)).toBeNull();
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

describe("unregisterThisDevice", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("removes the stored token and clears the key", async () => {
    const { deps, storage, mocks } = makeDeps();
    storage.setItem(KEY, "tok-1");
    await unregisterThisDevice(deps);
    expect(mocks.remove).toHaveBeenCalledWith("tok-1");
    expect(storage.getItem(KEY)).toBeNull();
  });

  it("gives up after the deadline when remove never settles, logs a TimeoutError and clears the key", async () => {
    vi.useFakeTimers();
    const { deps, storage } = makeDeps({
      remove: vi.fn(() => new Promise<void>(() => {})),
    });
    storage.setItem(KEY, "tok-1");
    let settled = false;
    void unregisterThisDevice(deps).then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(PUSH_REMOVAL_DEADLINE_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "[push] token removal failed: TimeoutError",
    );
    expect(storage.getItem(KEY)).toBeNull();
  });

  it("resolves at once when remove answers in time, logs nothing and leaves no timer behind", async () => {
    vi.useFakeTimers();
    const { deps, storage } = makeDeps();
    storage.setItem(KEY, "tok-1");
    await unregisterThisDevice(deps);
    expect(storage.getItem(KEY)).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does nothing with no stored token", async () => {
    const { deps, mocks } = makeDeps();
    await unregisterThisDevice(deps);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("still clears the key and resolves when remove rejects", async () => {
    vi.useFakeTimers();
    const { deps, storage } = makeDeps({
      remove: vi.fn().mockRejectedValue(new Error("offline tok-1")),
    });
    storage.setItem(KEY, "tok-1");
    await expect(unregisterThisDevice(deps)).resolves.toBeUndefined();
    expect(storage.getItem(KEY)).toBeNull();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "[push] token removal failed: Error",
    );
    expect(vi.getTimerCount()).toBe(0);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "tok-1",
    );
  });
});
