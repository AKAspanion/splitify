import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { completeGoogleSignIn, clearGoogleRedirect } = vi.hoisted(() => ({
  completeGoogleSignIn: vi.fn<() => Promise<boolean>>(),
  clearGoogleRedirect: vi.fn<() => void>(),
}));
vi.mock("@/lib/firebase/auth", () => ({
  completeGoogleSignIn,
  clearGoogleRedirect,
}));

import { finishGoogleReturn, whenRestoredAfterGoogle } from "./google-return";

/** A pageshow event as the browser fires it; persisted is true when the page came back from the back/forward cache. */
const pageshow = (persisted: boolean) =>
  Object.assign(new Event("pageshow"), { persisted });

describe("whenRestoredAfterGoogle", () => {
  let page: EventTarget;

  beforeEach(() => {
    clearGoogleRedirect.mockReset();
    page = new EventTarget();
    vi.stubGlobal("window", page);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears the redirect marker and calls back when the page is restored from the back/forward cache", () => {
    const onRestore = vi.fn();
    whenRestoredAfterGoogle(onRestore);

    page.dispatchEvent(pageshow(true));

    expect(clearGoogleRedirect).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it("does nothing on a page load that isn't a restore", () => {
    const onRestore = vi.fn();
    whenRestoredAfterGoogle(onRestore);

    page.dispatchEvent(pageshow(false));

    expect(clearGoogleRedirect).not.toHaveBeenCalled();
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("stops listening once the returned function is called", () => {
    const onRestore = vi.fn();
    const stop = whenRestoredAfterGoogle(onRestore);

    stop();
    page.dispatchEvent(pageshow(true));

    expect(clearGoogleRedirect).not.toHaveBeenCalled();
    expect(onRestore).not.toHaveBeenCalled();
  });
});

/** A Firebase-shaped error whose own message must never reach the person. */
const firebaseError = (code: string) =>
  Object.assign(new Error(`Firebase: raw text (${code}).`), { code });

describe("finishGoogleReturn", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    completeGoogleSignIn.mockReset();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("is signed in when a Google sign-in completed", async () => {
    completeGoogleSignIn.mockResolvedValue(true);
    await expect(finishGoogleReturn()).resolves.toEqual({ kind: "signed-in" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("is none when no Google redirect came back", async () => {
    completeGoogleSignIn.mockResolvedValue(false);
    await expect(finishGoogleReturn()).resolves.toEqual({ kind: "none" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("fails with the app's generic text for an unmapped code, never Firebase's message", async () => {
    completeGoogleSignIn.mockRejectedValue(
      firebaseError("auth/account-exists-with-different-credential"),
    );
    await expect(finishGoogleReturn()).resolves.toEqual({
      kind: "failed",
      message: "Something went wrong. Try again.",
    });
  });

  it("fails with the connection text when the network request failed", async () => {
    completeGoogleSignIn.mockRejectedValue(
      firebaseError("auth/network-request-failed"),
    );
    await expect(finishGoogleReturn()).resolves.toEqual({
      kind: "failed",
      message: "Couldn't reach Splitify. Check your connection.",
    });
  });

  it("logs a failure's code only, without Firebase's message", async () => {
    completeGoogleSignIn.mockRejectedValue(
      firebaseError("auth/network-request-failed"),
    );
    await finishGoogleReturn();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "Google sign-in: completing the redirect failed",
      "auth/network-request-failed",
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain("raw text");
  });

  it("logs the error's class when a failure has no code", async () => {
    completeGoogleSignIn.mockRejectedValue(new TypeError("secret detail"));
    await expect(finishGoogleReturn()).resolves.toEqual({
      kind: "failed",
      message: "Something went wrong. Try again.",
    });
    expect(warn).toHaveBeenCalledWith(
      "Google sign-in: completing the redirect failed",
      "TypeError",
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret detail");
  });
});
