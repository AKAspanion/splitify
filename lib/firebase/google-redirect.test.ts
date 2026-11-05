import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const MARKER = "splitify:google-redirect";

const { auth, signInWithRedirect, signInWithPopup, getRedirectResult, upsertMe } =
  vi.hoisted(() => ({
    auth: { name: "the app's Auth" },
    signInWithRedirect: vi.fn(),
    signInWithPopup: vi.fn(),
    getRedirectResult: vi.fn(),
    upsertMe: vi.fn(),
  }));

vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/auth")>()),
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
}));
vi.mock("@dataconnect/app", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@dataconnect/app")>()),
  upsertMe,
}));
vi.mock("./app", () => ({
  getFirebaseAuth: () => auth,
  getDataConnectClient: () => "dc-handle",
}));
vi.mock("../offline/persist", () => ({ clearSavedCache: vi.fn() }));
vi.mock("../push/register", () => ({ unregisterThisDevice: vi.fn() }));

import { GoogleAuthProvider } from "firebase/auth";

import {
  completeGoogleSignIn,
  googleRedirectPending,
  signInWithGoogle,
} from "./auth";

/** A sessionStorage that keeps its items in a Map, like the browser's for one tab. */
function fakeSessionStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  };
}

function authError(code: string): Error {
  return Object.assign(new Error(`Firebase: Error (${code}).`), { code });
}

let storage: Storage;

beforeEach(() => {
  vi.resetAllMocks();
  storage = fakeSessionStorage();
  vi.stubGlobal("sessionStorage", storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("signInWithGoogle", () => {
  it("sets the marker before it starts the redirect, with the app's Auth and a Google provider, and never opens a popup", async () => {
    let markerAtRedirect: string | null = null;
    signInWithRedirect.mockImplementation(async () => {
      markerAtRedirect = storage.getItem(MARKER);
    });

    await signInWithGoogle();

    expect(markerAtRedirect).not.toBeNull();
    expect(signInWithRedirect).toHaveBeenCalledTimes(1);
    expect(signInWithRedirect).toHaveBeenCalledWith(
      auth,
      expect.any(GoogleAuthProvider),
    );
    expect(signInWithPopup).not.toHaveBeenCalled();
    expect(googleRedirectPending()).toBe(true);
  });

  it("clears the marker and rethrows when the redirect fails to start", async () => {
    const error = authError("auth/network-request-failed");
    signInWithRedirect.mockRejectedValue(error);

    await expect(signInWithGoogle()).rejects.toBe(error);

    expect(storage.getItem(MARKER)).toBeNull();
    expect(googleRedirectPending()).toBe(false);
  });
});

describe("completeGoogleSignIn", () => {
  it("resolves false without reading a redirect result when no redirect is in flight", async () => {
    await expect(completeGoogleSignIn()).resolves.toBe(false);

    expect(getRedirectResult).not.toHaveBeenCalled();
    expect(upsertMe).not.toHaveBeenCalled();
  });

  it("runs UpsertMe once, clears the marker and resolves true when the person signed in", async () => {
    storage.setItem(MARKER, "1");
    getRedirectResult.mockResolvedValue({ user: { uid: "u1" } });
    upsertMe.mockResolvedValue({ data: {} });

    await expect(completeGoogleSignIn()).resolves.toBe(true);

    expect(getRedirectResult).toHaveBeenCalledWith(auth);
    expect(upsertMe).toHaveBeenCalledTimes(1);
    expect(upsertMe).toHaveBeenCalledWith("dc-handle");
    expect(storage.getItem(MARKER)).toBeNull();
  });

  it("clears the marker and resolves false when the person came back without signing in", async () => {
    storage.setItem(MARKER, "1");
    getRedirectResult.mockResolvedValue(null);

    await expect(completeGoogleSignIn()).resolves.toBe(false);

    expect(upsertMe).not.toHaveBeenCalled();
    expect(storage.getItem(MARKER)).toBeNull();
  });

  it("clears the marker and rethrows Firebase's error when the redirect result fails", async () => {
    storage.setItem(MARKER, "1");
    const error = authError("auth/account-exists-with-different-credential");
    getRedirectResult.mockRejectedValue(error);

    await expect(completeGoogleSignIn()).rejects.toBe(error);

    expect(upsertMe).not.toHaveBeenCalled();
    expect(storage.getItem(MARKER)).toBeNull();
  });

  it("clears the marker and rethrows when UpsertMe fails", async () => {
    storage.setItem(MARKER, "1");
    getRedirectResult.mockResolvedValue({ user: { uid: "u1" } });
    const error = new Error("UpsertMe failed");
    upsertMe.mockRejectedValue(error);

    await expect(completeGoogleSignIn()).rejects.toBe(error);

    expect(storage.getItem(MARKER)).toBeNull();
  });

  it("runs UpsertMe once when it is called again while the first call is still reading the result", async () => {
    storage.setItem(MARKER, "1");
    let resolveResult: (value: unknown) => void = () => {};
    getRedirectResult.mockReturnValue(
      new Promise((resolve) => {
        resolveResult = resolve;
      }),
    );
    upsertMe.mockResolvedValue({ data: {} });

    // React runs a mount effect twice in development: both calls start before the redirect result arrives.
    const first = completeGoogleSignIn();
    const second = completeGoogleSignIn();
    resolveResult({ user: { uid: "u1" } });

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(getRedirectResult).toHaveBeenCalledTimes(1);
    expect(upsertMe).toHaveBeenCalledTimes(1);
  });
});

describe("googleRedirectPending", () => {
  it("is false where there is no sessionStorage, without throwing", () => {
    vi.unstubAllGlobals();
    expect(typeof sessionStorage).toBe("undefined");

    expect(googleRedirectPending()).toBe(false);
  });

  it("is false, and says why, when the browser blocks sessionStorage", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // beforeEach stubbed sessionStorage, so afterEach's unstubAllGlobals removes this getter too.
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
    });

    try {
      expect(googleRedirectPending()).toBe(false);
      expect(warn).toHaveBeenCalledWith(
        "Google sign-in: sessionStorage is unavailable",
        "SecurityError",
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("is true once the marker is set", () => {
    storage.setItem(MARKER, "1");

    expect(googleRedirectPending()).toBe(true);
  });
});

describe("getFirebaseApp", () => {
  it("uses splitify.spanion.in as the auth domain when NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", undefined);
    const { getFirebaseApp } =
      await vi.importActual<typeof import("./app")>("./app");

    expect(getFirebaseApp().options.authDomain).toBe("splitify.spanion.in");
  });
});
