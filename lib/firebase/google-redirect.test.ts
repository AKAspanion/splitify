// Firebase Auth keeps the signed-in user in IndexedDB, which Node does not have.
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const MARKER = "splitify:google-redirect";
// Where indexedDBLocalPersistence keeps the signed-in user: Firebase's own names.
const AUTH_DB = "firebaseLocalStorageDb";
const AUTH_STORE = "firebaseLocalStorage";
const AUTH_USER_KEY = "firebase:authUser:demo-key:[DEFAULT]";

const {
  auth,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  upsertMe,
  clearSavedCache,
  unregisterThisDevice,
} = vi.hoisted(() => ({
  auth: { name: "the app's Auth" },
  signInWithRedirect: vi.fn(),
  signInWithPopup: vi.fn(),
  getRedirectResult: vi.fn(),
  signOut: vi.fn(),
  upsertMe: vi.fn(),
  clearSavedCache: vi.fn(),
  unregisterThisDevice: vi.fn(),
}));

vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/auth")>()),
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
}));
vi.mock("@dataconnect/app", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@dataconnect/app")>()),
  upsertMe,
}));
vi.mock("./app", () => ({
  getFirebaseAuth: () => auth,
  getDataConnectClient: () => "dc-handle",
}));
vi.mock("../offline/persist", () => ({ clearSavedCache }));
vi.mock("../push/register", () => ({ unregisterThisDevice }));

import { GoogleAuthProvider } from "firebase/auth";

import {
  clearGoogleRedirect,
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

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Opens Firebase Auth's database as indexedDBLocalPersistence does, creating its store on first use. */
async function openAuthDb(): Promise<IDBDatabase> {
  const open = indexedDB.open(AUTH_DB, 1);
  open.onupgradeneeded = () =>
    open.result.createObjectStore(AUTH_STORE, { keyPath: "fbase_key" });
  return request(open);
}

/** Saves records into Firebase Auth's store, the way it persists the signed-in user. */
async function persist(records: Record<string, unknown>): Promise<void> {
  const db = await openAuthDb();
  const tx = db.transaction(AUTH_STORE, "readwrite");
  for (const [key, value] of Object.entries(records))
    tx.objectStore(AUTH_STORE).put({ fbase_key: key, value });
  await new Promise((resolve) => (tx.oncomplete = resolve));
  db.close();
}

async function persistedKeys(): Promise<string[]> {
  const db = await openAuthDb();
  const keys = await request(
    db.transaction(AUTH_STORE).objectStore(AUTH_STORE).getAllKeys(),
  );
  db.close();
  return keys as string[];
}

async function authDbExists(): Promise<boolean> {
  return (await indexedDB.databases()).some(({ name }) => name === AUTH_DB);
}

function authError(code: string): Error {
  return Object.assign(new Error(`Firebase: Error (${code}).`), { code });
}

let storage: Storage;

beforeEach(async () => {
  vi.resetAllMocks();
  storage = fakeSessionStorage();
  vi.stubGlobal("sessionStorage", storage);
  await request(indexedDB.deleteDatabase(AUTH_DB));
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

  it("rejects with auth/web-storage-unsupported, without starting the redirect, where there is no sessionStorage", async () => {
    vi.unstubAllGlobals();
    expect(typeof sessionStorage).toBe("undefined");

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: "auth/web-storage-unsupported",
    });
    expect(signInWithRedirect).not.toHaveBeenCalled();
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
    expect(signOut).not.toHaveBeenCalled();
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

  it("signs the person out of Firebase Auth, clears the marker and rethrows when UpsertMe fails", async () => {
    storage.setItem(MARKER, "1");
    getRedirectResult.mockResolvedValue({ user: { uid: "u1" } });
    const error = new Error("UpsertMe failed");
    upsertMe.mockRejectedValue(error);
    signOut.mockResolvedValue(undefined);

    await expect(completeGoogleSignIn()).rejects.toBe(error);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith(auth);
    // Firebase Auth's own sign-out only: the app's signOut would also clear caches and push tokens.
    expect(clearSavedCache).not.toHaveBeenCalled();
    expect(unregisterThisDevice).not.toHaveBeenCalled();
    expect(storage.getItem(MARKER)).toBeNull();
  });

  it("still rethrows UpsertMe's error when signing out after it also fails", async () => {
    storage.setItem(MARKER, "1");
    getRedirectResult.mockResolvedValue({ user: { uid: "u1" } });
    const error = new Error("UpsertMe failed");
    upsertMe.mockRejectedValue(error);
    signOut.mockRejectedValue(authError("auth/network-request-failed"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await expect(completeGoogleSignIn()).rejects.toBe(error);

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        "Google sign-in: signing out after UpsertMe failed did not finish",
        "Error",
      );
      expect(storage.getItem(MARKER)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it("leaves Firebase's saved sign-in to Firebase when the sign-out after UpsertMe succeeds", async () => {
    storage.setItem(MARKER, "1");
    await persist({ [AUTH_USER_KEY]: { uid: "u1" } });
    getRedirectResult.mockResolvedValue({ user: { uid: "u1" } });
    const error = new Error("UpsertMe failed");
    upsertMe.mockRejectedValue(error);
    signOut.mockResolvedValue(undefined);

    await expect(completeGoogleSignIn()).rejects.toBe(error);

    expect(await persistedKeys()).toEqual([AUTH_USER_KEY]);
  });

  it("clears Firebase Auth's saved user, so nobody is signed in on the next load, when the sign-out after UpsertMe also fails", async () => {
    storage.setItem(MARKER, "1");
    storage.setItem("firebase:redirectUser:demo-key:[DEFAULT]", "{}");
    const local = fakeSessionStorage();
    local.setItem(AUTH_USER_KEY, "{}");
    local.setItem("theme", "dark");
    vi.stubGlobal("localStorage", local);
    await persist({
      [AUTH_USER_KEY]: { uid: "u1" },
      "firebase:other:demo-key": "kept",
    });
    getRedirectResult.mockResolvedValue({ user: { uid: "u1" } });
    const error = new Error("UpsertMe failed");
    upsertMe.mockRejectedValue(error);
    signOut.mockRejectedValue(authError("auth/internal-error"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await expect(completeGoogleSignIn()).rejects.toBe(error);

      expect(await persistedKeys()).toEqual(["firebase:other:demo-key"]);
      expect(local.getItem(AUTH_USER_KEY)).toBeNull();
      expect(local.getItem("theme")).toBe("dark");
      expect(
        storage.getItem("firebase:redirectUser:demo-key:[DEFAULT]"),
      ).toBeNull();
      expect(storage.getItem(MARKER)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it("creates no Auth database when none was saved and the sign-out after UpsertMe fails", async () => {
    storage.setItem(MARKER, "1");
    getRedirectResult.mockResolvedValue({ user: { uid: "u1" } });
    const error = new Error("UpsertMe failed");
    upsertMe.mockRejectedValue(error);
    signOut.mockRejectedValue(authError("auth/internal-error"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await expect(completeGoogleSignIn()).rejects.toBe(error);

      expect(await authDbExists()).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it("still rejects with UpsertMe's error, and says why, when clearing the saved sign-in fails too", async () => {
    storage.setItem(MARKER, "1");
    getRedirectResult.mockResolvedValue({ user: { uid: "u1" } });
    const error = new Error("UpsertMe failed");
    upsertMe.mockRejectedValue(error);
    signOut.mockRejectedValue(authError("auth/internal-error"));
    vi.stubGlobal("indexedDB", {
      open: () => {
        throw new DOMException("IndexedDB is broken", "UnknownError");
      },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await expect(completeGoogleSignIn()).rejects.toBe(error);

      expect(warn).toHaveBeenCalledWith(
        "Google sign-in: clearing the saved sign-in after sign-out failed did not finish",
        "UnknownError",
      );
      expect(storage.getItem(MARKER)).toBeNull();
    } finally {
      warn.mockRestore();
    }
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

describe("clearGoogleRedirect", () => {
  it("removes the marker", () => {
    storage.setItem(MARKER, "1");

    clearGoogleRedirect();

    expect(storage.getItem(MARKER)).toBeNull();
    expect(googleRedirectPending()).toBe(false);
  });

  it("does nothing, without throwing, where there is no sessionStorage", () => {
    vi.unstubAllGlobals();
    expect(typeof sessionStorage).toBe("undefined");

    expect(() => clearGoogleRedirect()).not.toThrow();
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
