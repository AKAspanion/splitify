import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "@/hooks/use-auth";

// A server render runs no effects, so useEffect runs its callback at once: the redirect is an effect.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => {
    effect();
  },
}));

const replace = vi.fn();
// A full page load: the ad script a public page loaded must not follow into the app, so the router is never used.
const routerReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
}));

import { HomeRedirect } from "./home-redirect";

const LOADING: AuthState = { status: "loading", user: null };
const SIGNED_OUT: AuthState = { status: "signed-out", user: null };
const SIGNED_IN: AuthState = {
  status: "signed-in",
  user: { uid: "u1", email: "a@example.test", name: null, emailVerified: true },
};

function render(auth: AuthState): string {
  return renderToStaticMarkup(
    <AuthContext.Provider value={auth}>
      <HomeRedirect />
    </AuthContext.Provider>,
  );
}

describe("HomeRedirect", () => {
  beforeEach(() => {
    replace.mockReset();
    routerReplace.mockReset();
    vi.stubGlobal("window", { location: { replace } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows a Loading status and navigates nowhere while auth loads", () => {
    const html = render(LOADING);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading");
    expect(replace).not.toHaveBeenCalled();
  });

  it("leaves for /groups/ by a full page load for a signed-in person", () => {
    render(SIGNED_IN);
    expect(routerReplace).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledExactlyOnceWith("/groups/");
  });

  it("leaves for /sign-in/ by a full page load for a signed-out person", () => {
    render(SIGNED_OUT);
    expect(routerReplace).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledExactlyOnceWith("/sign-in/");
  });
});
