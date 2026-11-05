import { inspect } from "node:util";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { verifyEmailWithCode } = vi.hoisted(() => ({
  verifyEmailWithCode: vi.fn<(code: string) => Promise<void>>(),
}));
vi.mock("@/lib/firebase/auth", () => ({ verifyEmailWithCode }));

import { verifyEmailLink } from "./verify-email-result";

const CODE = "secret-oob-code";
const authError = (code: string) =>
  Object.assign(new Error(`Firebase: raw (${code}) ${CODE}`), { code });

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  verifyEmailWithCode.mockReset();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe("verifyEmailLink", () => {
  it("verifies the email with the link's code", async () => {
    verifyEmailWithCode.mockResolvedValue();
    expect(await verifyEmailLink(CODE)).toEqual({ kind: "verified" });
    expect(verifyEmailWithCode).toHaveBeenCalledWith(CODE);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    "auth/expired-action-code",
    "auth/invalid-action-code",
    // The link's account was deleted.
    "auth/user-not-found",
  ])(
    "calls a link with %s spent",
    async (code) => {
      verifyEmailWithCode.mockRejectedValue(authError(code));
      expect(await verifyEmailLink(CODE)).toEqual({ kind: "spent" });
    },
  );

  it("gives the app's own words for a network failure, and logs its cause class without the code", async () => {
    verifyEmailWithCode.mockRejectedValue(
      authError("auth/network-request-failed"),
    );
    expect(await verifyEmailLink(CODE)).toEqual({
      kind: "failed",
      message: "Couldn't reach Splitify. Check your connection.",
    });
    expect(warn).toHaveBeenCalledTimes(1);
    // As the console would print it, an Error's message too.
    const logged = inspect(warn.mock.calls, { depth: 5 });
    expect(logged).toContain("auth/network-request-failed");
    expect(logged).not.toContain(CODE);
  });
});
