import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-errors";

const withCode = (code: string) => Object.assign(new Error("raw"), { code });

describe("authErrorMessage", () => {
  it.each([
    ["auth/wrong-password", "That email and password don't match."],
    ["auth/user-not-found", "That email and password don't match."],
    ["auth/invalid-credential", "That email and password don't match."],
    [
      "auth/email-already-in-use",
      "An account with that email already exists. Sign in instead.",
    ],
    ["auth/invalid-email", "Enter a valid email address."],
    [
      "auth/too-many-requests",
      "Too many attempts. Try again in a few minutes.",
    ],
    [
      "auth/network-request-failed",
      "Couldn't reach Splitify. Check your connection.",
    ],
    [
      "auth/popup-blocked",
      "Google sign-in isn't available here. Use email and password.",
    ],
    [
      "auth/operation-not-supported-in-this-environment",
      "Google sign-in isn't available here. Use email and password.",
    ],
    [
      "auth/unauthorized-domain",
      "Google sign-in isn't available here. Use email and password.",
    ],
    [
      "auth/web-storage-unsupported",
      "Google sign-in isn't available here. Use email and password.",
    ],
    [
      "auth/popup-closed-by-user",
      "Google sign-in was closed before it finished.",
    ],
    [
      "auth/cancelled-popup-request",
      "Google sign-in was closed before it finished.",
    ],
    ["auth/expired-action-code", "This link has expired or was already used."],
    ["auth/invalid-action-code", "This link has expired or was already used."],
    ["auth/weak-password", "Use at least 8 characters."],
    ["auth/user-disabled", "This account is turned off."],
  ])("maps %s", (code, message) => {
    expect(authErrorMessage(withCode(code))).toBe(message);
  });

  it.each([withCode("auth/weird"), new Error("boom"), "x", null, undefined])(
    "answers generically for %s",
    (error) => {
      expect(authErrorMessage(error)).toBe("Something went wrong. Try again.");
    },
  );
});
