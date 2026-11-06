import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/auth", () => ({
  readPasswordResetEmail: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmailWithCode: vi.fn(),
}));

import type { ActionLink } from "@/lib/auth/action-link";
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

describe("readActionLinkOnce", () => {
  // A fresh copy of the module is a fresh document: what it read lives at module scope.
  beforeEach(() => {
    vi.resetModules();
  });

  it("gives the same link to a handler mounted again after the address bar was cleaned", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=verifyEmail&oobCode=v1");
    // The address bar is cleaned as the first mount reads it, as the browser would.
    win.history.replaceState.mockImplementation(() => {
      win.location.search = "";
    });

    const first = readActionLinkOnce(win);
    // Signed in, the providers remount the page once auth is restored.
    const second = readActionLinkOnce(win);

    expect(first).toEqual({ kind: "verify-email", code: "v1" });
    expect(second).toEqual(first);
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
  });

  it("reads a reload's clean address bar as incomplete", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    expect(readActionLinkOnce(fakeWindow(""))).toEqual({ kind: "incomplete" });
  });
});

describe("the action page's links", () => {
  async function render(link: ActionLink | "prerender") {
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { ActionBody, ActionHandler } = await import("./action-handler");
    return renderToStaticMarkup(
      link === "prerender"
        ? createElement(ActionHandler)
        : createElement(ActionBody, { link }),
    );
  }

  it("has a back link to the home page in the header", async () => {
    expect(await render("prerender")).toContain('<a href="/">');
  });

  it("keeps Back to sign in on an incomplete link", async () => {
    const html = await render({ kind: "incomplete" });
    expect(html).toMatch(
      /<a [^>]*href="\/sign-in\/?"[^>]*>Back to sign in<\/a>/,
    );
  });
});
