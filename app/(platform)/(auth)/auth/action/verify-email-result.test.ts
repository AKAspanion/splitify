import { inspect } from "node:util";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { verifyEmailWithCode } = vi.hoisted(() => ({
  verifyEmailWithCode: vi.fn<(code: string) => Promise<void>>(),
}));
vi.mock("@/lib/firebase/auth", () => ({ verifyEmailWithCode }));

import { newCodeAttempts } from "./code-call";
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
    expect(await verifyEmailLink(CODE, newCodeAttempts())).toEqual({
      kind: "verified",
    });
    expect(verifyEmailWithCode).toHaveBeenCalledWith(CODE);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    "auth/expired-action-code",
    "auth/invalid-action-code",
    // The link's account was deleted.
    "auth/user-not-found",
  ])("calls a link with %s spent", async (code) => {
    verifyEmailWithCode.mockRejectedValue(authError(code));
    expect(await verifyEmailLink(CODE, newCodeAttempts())).toEqual({
      kind: "spent",
    });
  });

  it("says the email may already be verified when a retry is refused as spent after an attempt lost its reply", async () => {
    const attempts = newCodeAttempts();
    verifyEmailWithCode
      .mockRejectedValueOnce(authError("auth/network-request-failed"))
      .mockRejectedValueOnce(authError("auth/invalid-action-code"));

    expect(await verifyEmailLink(CODE, attempts)).toMatchObject({
      kind: "failed",
    });
    expect(await verifyEmailLink(CODE, attempts)).toEqual({
      kind: "maybe-done",
    });
  });

  it("still calls a spent code spent when the earlier attempt failed for another reason", async () => {
    const attempts = newCodeAttempts();
    verifyEmailWithCode
      .mockRejectedValueOnce(authError("auth/too-many-requests"))
      .mockRejectedValueOnce(authError("auth/expired-action-code"));

    await verifyEmailLink(CODE, attempts);
    expect(await verifyEmailLink(CODE, attempts)).toEqual({ kind: "spent" });
  });

  it("gives the app's own words for a network failure, and logs its cause class without the code", async () => {
    verifyEmailWithCode.mockRejectedValue(
      authError("auth/network-request-failed"),
    );
    expect(await verifyEmailLink(CODE, newCodeAttempts())).toEqual({
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

describe("one document's verify calls", () => {
  /** A fresh copy of the module is a fresh document: the calls it made live at module scope. */
  async function freshDocument() {
    vi.resetModules();
    return await import("./verify-email-result");
  }

  it("applies the code once for two mounts, and both see it verified", async () => {
    const { verifyLinkOnce } = await freshDocument();
    verifyEmailWithCode.mockResolvedValue();

    // Signed in, the providers remount the page while the first mount's call is in flight.
    const first = verifyLinkOnce(CODE);
    const second = verifyLinkOnce(CODE);
    expect(await first).toEqual({ kind: "verified" });
    expect(await second).toEqual({ kind: "verified" });
    // And a mount after it settled.
    expect(await verifyLinkOnce(CODE)).toEqual({ kind: "verified" });

    expect(verifyEmailWithCode).toHaveBeenCalledTimes(1);
  });

  it("applies the code again on a retry after a network failure, and a later mount sees the retry's outcome", async () => {
    const { verifyLinkOnce, retryVerifyLink } = await freshDocument();
    verifyEmailWithCode
      .mockRejectedValueOnce(authError("auth/network-request-failed"))
      .mockRejectedValueOnce(authError("auth/invalid-action-code"));

    expect(await verifyLinkOnce(CODE)).toMatchObject({ kind: "failed" });
    // The lost reply is remembered across mounts, so the spent answer reads "may already".
    expect(await retryVerifyLink(CODE)).toEqual({ kind: "maybe-done" });
    expect(await verifyLinkOnce(CODE)).toEqual({ kind: "maybe-done" });

    expect(verifyEmailWithCode).toHaveBeenCalledTimes(2);
  });

  it("doesn't apply again on a retry once the code was applied", async () => {
    const { verifyLinkOnce, retryVerifyLink } = await freshDocument();
    verifyEmailWithCode.mockResolvedValue();

    await verifyLinkOnce(CODE);
    expect(await retryVerifyLink(CODE)).toEqual({ kind: "verified" });

    expect(verifyEmailWithCode).toHaveBeenCalledTimes(1);
  });
});
