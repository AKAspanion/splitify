import { afterEach, describe, expect, it, vi } from "vitest";
import { leaveForSignIn, signedOutDestination } from "./auth-redirect";

describe("signedOutDestination", () => {
  it("sends a chosen sign-out home", () => {
    expect(signedOutDestination("/profile/", true)).toBe("/");
  });

  it("sends anyone else to sign in, remembering the page", () => {
    expect(signedOutDestination("/profile/", false)).toBe(
      "/sign-in/?next=%2Fprofile%2F",
    );
  });
});

describe("leaveForSignIn", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("goes to /sign-in/ by a full page load", () => {
    const replace = vi.fn();
    vi.stubGlobal("window", { location: { replace } });

    leaveForSignIn();

    expect(replace).toHaveBeenCalledExactlyOnceWith("/sign-in/");
  });
});
