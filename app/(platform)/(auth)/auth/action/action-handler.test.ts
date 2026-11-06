import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/auth", () => ({
  readPasswordResetEmail: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmailWithCode: vi.fn(),
}));

import type { ActionLink } from "@/lib/auth/action-link";

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

describe("readActionLinkOnce", () => {
  // A fresh copy of the module is a fresh document: what it read lives at module scope.
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("reads a reset link and takes its code out of the address bar", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=resetPassword&oobCode=abc&apiKey=k");

    expect(readActionLinkOnce(win)).toEqual({
      kind: "reset-password",
      code: "abc",
    });
    await afterRender();

    expect(win.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/auth/action/",
    );
    expect(win.location.replace).not.toHaveBeenCalled();
  });

  it("reads a verify-email link and cleans the address bar", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=verifyEmail&oobCode=v1");

    expect(readActionLinkOnce(win)).toEqual({
      kind: "verify-email",
      code: "v1",
    });
    await afterRender();

    expect(win.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/auth/action/",
    );
  });

  it("sends a recoverEmail link on to Firebase's handler with its own query string", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=recoverEmail&oobCode=x&apiKey=k");

    expect(readActionLinkOnce(win).kind).toBe("firebase");
    await afterRender();

    expect(win.location.replace).toHaveBeenCalledWith(
      "/__/auth/action?mode=recoverEmail&oobCode=x&apiKey=k",
    );
  });

  it("cleans the address bar for an incomplete link too", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=resetPassword");

    expect(readActionLinkOnce(win)).toEqual({ kind: "incomplete" });
    await afterRender();

    expect(win.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/auth/action/",
    );
    expect(win.location.replace).not.toHaveBeenCalled();
  });

  it("still forwards a Firebase-handled link once when cleaning the address bar throws", async () => {
    // Runs the queued cleanup by hand, so its error is caught here rather than reported as uncaught.
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=recoverEmail&oobCode=x&apiKey=k");
    win.history.replaceState.mockImplementation(() => {
      throw new Error("history blocked");
    });

    expect(readActionLinkOnce(win).kind).toBe("firebase");
    readActionLinkOnce(win);
    expect(queued).toHaveLength(1);
    expect(() => queued[0]()).toThrow("history blocked");

    expect(win.location.replace).toHaveBeenCalledTimes(1);
    expect(win.location.replace).toHaveBeenCalledWith(
      "/__/auth/action?mode=recoverEmail&oobCode=x&apiKey=k",
    );
  });

  it("gives the same link to a handler mounted again after the address bar was cleaned", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=verifyEmail&oobCode=v1");
    // The address bar is cleaned as the first mount reads it, as the browser would.
    win.history.replaceState.mockImplementation(() => {
      win.location.search = "";
    });

    const first = readActionLinkOnce(win);
    await afterRender();
    expect(win.location.search).toBe("");
    // A later mount in the same document, such as Strict Mode's second one.
    const second = readActionLinkOnce(win);
    await afterRender();

    expect(first).toEqual({ kind: "verify-email", code: "v1" });
    expect(second).toEqual(first);
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
  });

  it("reads a reload's clean address bar as incomplete", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    expect(readActionLinkOnce(fakeWindow(""))).toEqual({ kind: "incomplete" });
  });

  it("returns the same link to two reads in one document, and cleans the address bar once", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=verifyEmail&oobCode=v1");

    const first = readActionLinkOnce(win);
    const second = readActionLinkOnce(win);
    await afterRender();

    expect(first).toEqual({ kind: "verify-email", code: "v1" });
    expect(second).toBe(first);
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
    expect(win.location.replace).not.toHaveBeenCalled();
  });

  it("cleans the address bar after the render that read the link, before the next frame", async () => {
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=resetPassword&oobCode=abc&apiKey=k");
    // Next's history patch updates the Router, which React refuses during another component's render.
    let rendering = false;
    const cleanedWhileRendering: boolean[] = [];
    win.history.replaceState.mockImplementation(() => {
      cleanedWhileRendering.push(rendering);
    });
    // Reads the link in its render, as ActionHandler's snapshot does.
    function Reader() {
      rendering = true;
      const link = readActionLinkOnce(win);
      rendering = false;
      return link.kind;
    }

    expect(renderToStaticMarkup(createElement(Reader))).toBe("reset-password");
    expect(win.history.replaceState).not.toHaveBeenCalled();

    // A microtask runs before the browser's next task, so before it paints or runs an animation frame.
    await afterRender();
    expect(win.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/auth/action/",
    );
    expect(cleanedWhileRendering).toEqual([false]);
  });

  it("forwards a Firebase-handled link once, however often it is read", async () => {
    const { readActionLinkOnce } = await import("./action-handler");
    const win = fakeWindow("?mode=recoverEmail&oobCode=x&apiKey=k");

    expect(readActionLinkOnce(win).kind).toBe("firebase");
    readActionLinkOnce(win);
    await afterRender();

    expect(win.location.replace).toHaveBeenCalledTimes(1);
    expect(win.location.replace).toHaveBeenCalledWith(
      "/__/auth/action?mode=recoverEmail&oobCode=x&apiKey=k",
    );
  });
});

/**
 * Lets the microtasks queued so far run, as they do once the render's synchronous work ends, and nothing later: no
 * timer or other task, so what has run by then has run before the browser's next paint and animation frame.
 */
function afterRender() {
  return new Promise<void>((resolve) => queueMicrotask(resolve));
}

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
