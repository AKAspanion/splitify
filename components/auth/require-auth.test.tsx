import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "@/hooks/use-auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/groups/",
}));

import { RequireAuth } from "./require-auth";

const LOADING: AuthState = { status: "loading", user: null };

describe("RequireAuth", () => {
  it("shows the logo, not a spinner, while auth loads", () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={LOADING}>
        <RequireAuth>
          <p>app</p>
        </RequireAuth>
      </AuthContext.Provider>,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading");
    expect(html).toContain("logo.svg");
    expect(html).not.toContain("animate-spin");
    expect(html).not.toContain("<p>app</p>");
  });
});
