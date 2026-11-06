import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "@/hooks/use-auth";

// next/link is marked, so a test can tell a client navigation from a plain anchor's full page load.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a data-next-link="" href={href}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));
vi.mock("@/lib/firebase/auth", () => ({ signOut: vi.fn() }));

import { Navbar } from "./navbar";

const SIGNED_OUT: AuthState = { status: "signed-out", user: null };
const SIGNED_IN: AuthState = {
  status: "signed-in",
  user: { uid: "u1", email: "a@example.test", name: null, emailVerified: true },
};

function render(auth: AuthState): string {
  return renderToStaticMarkup(
    <AuthContext.Provider value={auth}>
      <Navbar />
    </AuthContext.Provider>,
  );
}

// The landing page may have loaded the ad script, which a client navigation would carry into the next screen, so
// every link out of it is a full page load (knowledge/decisions/adsense-on-public-pages-only.md).
describe("Navbar", () => {
  it("links to sign in and sign up with plain anchors", () => {
    const html = render(SIGNED_OUT);

    expect(html).toMatch(/<a[^>]*href="\/sign-in\/"[^>]*>Sign in<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/sign-up\/"[^>]*>Sign up<\/a>/);
    expect(html).not.toContain("data-next-link");
  });

  it("links into the app with plain anchors when signed in", () => {
    const html = render(SIGNED_IN);

    expect(html).toMatch(/<a[^>]*href="\/groups\/"[^>]*>Go to app<\/a>/);
    expect(html).not.toContain("data-next-link");
  });
});
