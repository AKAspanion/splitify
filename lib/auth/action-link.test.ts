import { describe, expect, it } from "vitest";
import { FIREBASE_ACTION_HANDLER, parseActionLink } from "./action-link";

describe("parseActionLink", () => {
  it("reads a reset-password link", () => {
    expect(
      parseActionLink("?mode=resetPassword&oobCode=abc&apiKey=k&lang=en"),
    ).toEqual({ kind: "reset-password", code: "abc" });
  });

  it("reads a verify-email link without its leading ?", () => {
    expect(parseActionLink("mode=verifyEmail&oobCode=xyz")).toEqual({
      kind: "verify-email",
      code: "xyz",
    });
  });

  it("gives the trimmed code it checked", () => {
    expect(parseActionLink("?mode=resetPassword&oobCode=%20abc%20")).toEqual({
      kind: "reset-password",
      code: "abc",
    });
  });

  it.each([
    "recoverEmail",
    "verifyAndChangeEmail",
    "revertSecondFactorAddition",
  ])(
    "forwards %s to Firebase's own handler with the query unchanged",
    (mode) => {
      expect(parseActionLink(`?mode=${mode}&oobCode=r1&apiKey=k`)).toEqual({
        kind: "firebase",
        forwardTo: `/__/auth/action?mode=${mode}&oobCode=r1&apiKey=k`,
      });
    },
  );

  it.each([
    ["a missing oobCode", "?mode=resetPassword&apiKey=k"],
    ["an empty oobCode", "?mode=resetPassword&oobCode=&apiKey=k"],
    ["an oobCode of only spaces", "?mode=verifyEmail&oobCode=%20%20%20"],
    ["an oobCode of only pluses (spaces)", "?mode=verifyEmail&oobCode=+++"],
    ["a forwarded mode with no oobCode", "?mode=recoverEmail&apiKey=k"],
    ["a missing mode", "?oobCode=abc&apiKey=k"],
    ["an empty mode", "?mode=&oobCode=abc"],
    ["an unknown mode", "?mode=deleteEverything&oobCode=abc"],
    ["a mode differing in case", "?mode=ResetPassword&oobCode=abc"],
    ["a prototype key as mode", "?mode=constructor&oobCode=abc"],
    ["a __proto__ mode", "?mode=__proto__&oobCode=abc"],
    ["an empty string", ""],
    ["a lone ?", "?"],
  ])("is incomplete for %s", (_label, search) => {
    expect(parseActionLink(search)).toEqual({ kind: "incomplete" });
  });

  it.each([
    "//evil.example",
    "https://evil.example",
    "\n",
    "%0A//evil.example",
    "/../../evil",
    "\\\\evil.example",
  ])("never forwards a mode carrying %j", (hostile) => {
    for (const search of [
      `?mode=${hostile}&oobCode=abc`,
      `?mode=recoverEmail${hostile}&oobCode=abc`,
      `?mode=${encodeURIComponent(hostile)}&oobCode=abc`,
    ])
      expect(parseActionLink(search)).toEqual({ kind: "incomplete" });
  });

  it.each([
    "//evil.example",
    "https://evil.example",
    "\n//evil.example",
    "%0A//evil.example",
    "/../../evil",
    "\\\\evil.example",
    "#//evil.example",
  ])(
    "keeps the forward on Firebase's handler when oobCode carries %j",
    (hostile) => {
      const link = parseActionLink(`?mode=recoverEmail&oobCode=${hostile}`);
      expect(link.kind).toBe("firebase");
      if (link.kind !== "firebase") return;
      expect(link.forwardTo.startsWith(`${FIREBASE_ACTION_HANDLER}?`)).toBe(
        true,
      );
      const target = new URL(link.forwardTo, "https://splitify.example");
      expect(target.origin).toBe("https://splitify.example");
      expect(target.pathname).toBe(FIREBASE_ACTION_HANDLER);
    },
  );

  it("never reads or follows a continueUrl", () => {
    const continueUrl = encodeURIComponent("https://evil.example/next");
    expect(
      parseActionLink(
        `?mode=resetPassword&oobCode=abc&continueUrl=${continueUrl}`,
      ),
    ).toEqual({ kind: "reset-password", code: "abc" });
    expect(parseActionLink(`?continueUrl=${continueUrl}&oobCode=abc`)).toEqual({
      kind: "incomplete",
    });
    const forwarded = parseActionLink(
      `?mode=recoverEmail&oobCode=abc&continueUrl=${continueUrl}`,
    );
    expect(forwarded).toEqual({
      kind: "firebase",
      forwardTo: `/__/auth/action?mode=recoverEmail&oobCode=abc&continueUrl=${continueUrl}`,
    });
  });
});
