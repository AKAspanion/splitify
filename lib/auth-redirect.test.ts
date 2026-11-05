import { describe, expect, it } from "vitest";
import { signedOutDestination } from "./auth-redirect";

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
