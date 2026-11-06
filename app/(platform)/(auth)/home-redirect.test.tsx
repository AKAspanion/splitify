import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "@/hooks/use-auth";

// A server render runs no effects, so useEffect runs its callback at once: the redirect is an effect.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => {
    effect();
  },
}));

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

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
  beforeEach(() => replace.mockReset());

  it("shows a Loading status and navigates nowhere while auth loads", () => {
    const html = render(LOADING);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading");
    expect(replace).not.toHaveBeenCalled();
  });

  it("replaces the route with /groups/ for a signed-in person", () => {
    render(SIGNED_IN);
    expect(replace).toHaveBeenCalledExactlyOnceWith("/groups/");
  });

  it("replaces the route with /sign-in/ for a signed-out person", () => {
    render(SIGNED_OUT);
    expect(replace).toHaveBeenCalledExactlyOnceWith("/sign-in/");
  });
});
