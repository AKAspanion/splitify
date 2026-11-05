import { inspect } from "node:util";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { readPasswordResetEmail, resetPassword } = vi.hoisted(() => ({
  readPasswordResetEmail: vi.fn<(code: string) => Promise<string>>(),
  resetPassword: vi.fn<(code: string, password: string) => Promise<void>>(),
}));
vi.mock("@/lib/firebase/auth", () => ({
  readPasswordResetEmail,
  resetPassword,
  verifyEmailWithCode: vi.fn(),
}));

import { newCodeAttempts } from "./code-call";
import { checkResetLink, saveNewPassword } from "./reset-password-form";

const CODE = "secret-oob-code";
/** Firebase's answers for a code that can't be used again, the last when its account was deleted. */
const SPENT_CODES = [
  "auth/expired-action-code",
  "auth/invalid-action-code",
  "auth/user-not-found",
];
const authError = (code: string) =>
  Object.assign(new Error(`Firebase: raw (${code}) ${CODE}`), { code });

/** Every argument console.warn was given, as the console would print it (an Error's message too). */
const logged = (spy: ReturnType<typeof vi.spyOn>) =>
  inspect(spy.mock.calls, { depth: 5 });

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  readPasswordResetEmail.mockReset();
  resetPassword.mockReset();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe("checkResetLink", () => {
  it("gives the email the link is for", async () => {
    readPasswordResetEmail.mockResolvedValue("ana@example.com");
    expect(await checkResetLink(CODE)).toEqual({
      kind: "ready",
      email: "ana@example.com",
    });
    expect(readPasswordResetEmail).toHaveBeenCalledWith(CODE);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(SPENT_CODES)("calls a link with %s spent", async (code) => {
    readPasswordResetEmail.mockRejectedValue(authError(code));
    expect(await checkResetLink(CODE)).toEqual({ kind: "spent" });
  });

  it("gives the app's own words for a network failure, and logs its cause class without the code", async () => {
    readPasswordResetEmail.mockRejectedValue(
      authError("auth/network-request-failed"),
    );
    expect(await checkResetLink(CODE)).toEqual({
      kind: "failed",
      message: "Couldn't reach Splitify. Check your connection.",
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(logged(warn)).toContain("auth/network-request-failed");
    expect(logged(warn)).not.toContain(CODE);
  });

  it("answers generically for an error with no code", async () => {
    readPasswordResetEmail.mockRejectedValue(new Error(`boom ${CODE}`));
    expect(await checkResetLink(CODE)).toEqual({
      kind: "failed",
      message: "Something went wrong. Try again.",
    });
    expect(logged(warn)).not.toContain(CODE);
  });
});

describe("saveNewPassword", () => {
  it("refuses a password of 7 characters and calls nothing", async () => {
    expect(await saveNewPassword(CODE, "1234567", newCodeAttempts())).toEqual({
      kind: "failed",
      message: "Use at least 8 characters.",
    });
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("sets a password of 8 characters", async () => {
    resetPassword.mockResolvedValue();
    expect(await saveNewPassword(CODE, "12345678", newCodeAttempts())).toEqual({
      kind: "saved",
    });
    expect(resetPassword).toHaveBeenCalledWith(CODE, "12345678");
  });

  it.each(SPENT_CODES)("calls a link with %s spent", async (code) => {
    resetPassword.mockRejectedValue(authError(code));
    expect(await saveNewPassword(CODE, "12345678", newCodeAttempts())).toEqual({
      kind: "spent",
    });
  });

  it("says the password may already be changed when a retry is refused as spent after a save lost its reply", async () => {
    const attempts = newCodeAttempts();
    resetPassword
      .mockRejectedValueOnce(authError("auth/network-request-failed"))
      .mockRejectedValueOnce(authError("auth/invalid-action-code"));

    expect(await saveNewPassword(CODE, "12345678", attempts)).toMatchObject({
      kind: "failed",
    });
    expect(await saveNewPassword(CODE, "12345678", attempts)).toEqual({
      kind: "maybe-done",
    });
  });

  it("still calls a spent code spent when the earlier save failed for another reason", async () => {
    const attempts = newCodeAttempts();
    resetPassword
      .mockRejectedValueOnce(authError("auth/too-many-requests"))
      .mockRejectedValueOnce(authError("auth/invalid-action-code"));

    await saveNewPassword(CODE, "12345678", attempts);
    expect(await saveNewPassword(CODE, "12345678", attempts)).toEqual({
      kind: "spent",
    });
  });

  it("keeps the form on a network failure, with the app's own words, and logs without the code or password", async () => {
    resetPassword.mockRejectedValue(authError("auth/network-request-failed"));
    expect(
      await saveNewPassword(CODE, "my-new-password", newCodeAttempts()),
    ).toEqual({
      kind: "failed",
      message: "Couldn't reach Splitify. Check your connection.",
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(logged(warn)).toContain("auth/network-request-failed");
    expect(logged(warn)).not.toContain(CODE);
    expect(logged(warn)).not.toContain("my-new-password");
  });
});

describe("one document's reset link", () => {
  /** A fresh copy of the module is a fresh document: the saves it made live at module scope. */
  async function freshDocument() {
    vi.resetModules();
    return await import("./reset-password-form");
  }

  it("shares a save in flight with a second submit, and a remount then shows it saved, not spent", async () => {
    const { savePasswordOnce, resetLinkPhase } = await freshDocument();
    resetPassword.mockResolvedValue();
    // The code is spent once the save lands, so checking the link again would say so.
    readPasswordResetEmail.mockRejectedValue(
      authError("auth/invalid-action-code"),
    );

    const first = savePasswordOnce(CODE, "12345678");
    // A remount while the save is in flight finds it, rather than checking the link.
    const remounted = resetLinkPhase(CODE);
    const second = savePasswordOnce(CODE, "12345678");
    expect(await first).toEqual({ kind: "saved" });
    expect(await second).toEqual({ kind: "saved" });
    expect(await remounted).toEqual({ kind: "saved" });
    // And a mount after it settled.
    expect(await resetLinkPhase(CODE)).toEqual({ kind: "saved" });

    expect(resetPassword).toHaveBeenCalledTimes(1);
    expect(readPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("checks the link on a first mount", async () => {
    const { resetLinkPhase } = await freshDocument();
    readPasswordResetEmail.mockResolvedValue("ana@example.com");

    expect(await resetLinkPhase(CODE)).toEqual({
      kind: "ready",
      email: "ana@example.com",
    });
  });

  it("saves again after a failed save, remembering its lost reply across mounts, and a remount after a failure checks the link", async () => {
    const { savePasswordOnce, resetLinkPhase } = await freshDocument();
    resetPassword
      .mockRejectedValueOnce(authError("auth/network-request-failed"))
      .mockRejectedValueOnce(authError("auth/invalid-action-code"));
    readPasswordResetEmail.mockResolvedValue("ana@example.com");

    expect(await savePasswordOnce(CODE, "12345678")).toMatchObject({
      kind: "failed",
    });
    expect(await resetLinkPhase(CODE)).toEqual({
      kind: "ready",
      email: "ana@example.com",
    });
    expect(await savePasswordOnce(CODE, "12345678")).toEqual({
      kind: "maybe-done",
    });

    expect(resetPassword).toHaveBeenCalledTimes(2);
  });
});
