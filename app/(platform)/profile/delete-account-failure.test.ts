import { describe, expect, it } from "vitest";
import {
  deleteAccountFailure,
  SIGN_IN_AGAIN_PATH,
} from "./delete-account-failure";

// The callable SDK turns the function's HTTP 401 into the code `functions/unauthenticated`, keeping its message.
const staleSignIn = Object.assign(
  new Error("Sign in again to delete your account."),
  { code: "functions/unauthenticated" },
);

describe("deleteAccountFailure", () => {
  it("sends someone whose sign-in is too old to sign in again, with the function's message", () => {
    expect(deleteAccountFailure(staleSignIn)).toEqual({
      message: "Sign in again to delete your account.",
      signInAgain: true,
    });
  });

  it("only toasts any other 401", () => {
    const signedOut = Object.assign(new Error("Sign in to continue."), {
      code: "functions/unauthenticated",
    });
    expect(deleteAccountFailure(signedOut).signInAgain).toBe(false);
  });

  it("only toasts the same text under another status", () => {
    const internal = Object.assign(
      new Error("Sign in again to delete your account."),
      { code: "functions/internal" },
    );
    expect(deleteAccountFailure(internal).signInAgain).toBe(false);
  });

  it("only toasts a failed deletion", () => {
    const failed = Object.assign(
      new Error("Couldn't delete your account. Try again."),
      { code: "functions/internal" },
    );
    expect(deleteAccountFailure(failed)).toEqual({
      message: "Something went wrong. Try again.",
      signInAgain: false,
    });
  });

  it("only toasts a network failure", () => {
    expect(deleteAccountFailure(new TypeError("Failed to fetch"))).toEqual({
      message: "Couldn't reach Splitify. Check your connection.",
      signInAgain: false,
    });
  });

  it("comes back to Profile after signing in", () => {
    const url = new URL(SIGN_IN_AGAIN_PATH, "https://splitify.test");
    expect(url.pathname).toBe("/sign-in/");
    expect(url.searchParams.get("next")).toBe("/profile/");
  });
});
