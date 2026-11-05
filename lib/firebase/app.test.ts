import {
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { describe, expect, it } from "vitest";

import { authOptions } from "./app";

describe("authOptions", () => {
  // initializeAuth, unlike getAuth, adds no popup resolver of its own: without one, signInWithPopup throws
  // auth/argument-error before it opens anything, and Google sign-in fails.
  it("gives the browser the popup resolver Google sign-in needs, and IndexedDB persistence", () => {
    expect(authOptions(true)).toEqual({
      persistence: indexedDBLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  });

  it("gives Node in-memory persistence and no popup resolver", () => {
    expect(authOptions(false)).toEqual({ persistence: inMemoryPersistence });
  });
});
