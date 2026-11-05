import { describe, expect, it } from "vitest";
import { toUserMessage } from "./errors";

describe("toUserMessage", () => {
  it.each([
    "Not found",
    "Only members of this group can be added to an expense",
    "That email is already in use",
    "You can only add your friends to a group",
    "That request is too large.",
  ])("passes the check message %j through unchanged", (text) => {
    expect(toUserMessage(Object.assign(new Error(`${text}`), {}))).toBe(text);
    // The server wraps the message in more text.
    expect(
      toUserMessage({ code: "other", message: `mutation failed: ${text} (x)` }),
    ).toBe(text);
  });

  it("answers an unauthenticated error with the sign-in line", () => {
    expect(toUserMessage({ code: "unauthorized", message: "no token" })).toBe(
      "Sign in again to continue.",
    );
    expect(toUserMessage(new Error("Request is unauthenticated"))).toBe(
      "Sign in again to continue.",
    );
  });

  it("answers a network failure with the connection line", () => {
    expect(toUserMessage(new TypeError("Failed to fetch"))).toBe(
      "Couldn't reach Splitify. Check your connection.",
    );
    expect(
      toUserMessage({ code: "auth/network-request-failed", message: "x" }),
    ).toBe("Couldn't reach Splitify. Check your connection.");
  });

  it("hides a SQL error's text behind the generic line", () => {
    const sql = new Error(
      'pq: duplicate key value violates unique constraint "expense_pkey"',
    );
    expect(toUserMessage(sql)).toBe("Something went wrong. Try again.");
    expect(toUserMessage("boom")).toBe("Something went wrong. Try again.");
    expect(toUserMessage(null)).toBe("Something went wrong. Try again.");
  });
});
