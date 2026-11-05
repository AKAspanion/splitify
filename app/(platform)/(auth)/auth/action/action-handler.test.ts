import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/auth", () => ({
  readPasswordResetEmail: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmailWithCode: vi.fn(),
}));

import { openActionLink } from "./action-handler";

/** A window at /auth/action/ with the given query string; records where the address bar and the browser go. */
function fakeWindow(search: string) {
  return {
    location: { search, replace: vi.fn<(url: string | URL) => void>() },
    history: {
      replaceState:
        vi.fn<(data: unknown, unused: string, url?: string | URL) => void>(),
    },
  };
}

describe("openActionLink", () => {
  it("reads a reset link and takes its code out of the address bar", () => {
    const win = fakeWindow("?mode=resetPassword&oobCode=abc&apiKey=k");
    expect(openActionLink(win)).toEqual({
      kind: "reset-password",
      code: "abc",
    });
    expect(win.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/auth/action/",
    );
    expect(win.location.replace).not.toHaveBeenCalled();
  });

  it("reads a verify-email link and cleans the address bar", () => {
    const win = fakeWindow("?mode=verifyEmail&oobCode=v1");
    expect(openActionLink(win)).toEqual({ kind: "verify-email", code: "v1" });
    expect(win.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/auth/action/",
    );
  });

  it("sends a recoverEmail link on to Firebase's handler with its own query string", () => {
    const win = fakeWindow("?mode=recoverEmail&oobCode=x&apiKey=k");
    expect(openActionLink(win).kind).toBe("firebase");
    expect(win.location.replace).toHaveBeenCalledWith(
      "/__/auth/action?mode=recoverEmail&oobCode=x&apiKey=k",
    );
  });

  it("cleans the address bar for an incomplete link too", () => {
    const win = fakeWindow("?mode=resetPassword");
    expect(openActionLink(win)).toEqual({ kind: "incomplete" });
    expect(win.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/auth/action/",
    );
    expect(win.location.replace).not.toHaveBeenCalled();
  });
});
