import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "@/hooks/use-auth";

// next/script injects an afterInteractive script in the browser only, so a server render would show nothing: a plain
// script element stands in for it, carrying its src.
vi.mock("next/script", () => ({
  default: ({ src }: { src: string }) => <script async src={src} />,
}));

import Adsense from "./adsense";

const SIGNED_OUT: AuthState = { status: "signed-out", user: null };
const LOADING: AuthState = { status: "loading", user: null };
const SIGNED_IN: AuthState = {
  status: "signed-in",
  user: { uid: "u1", email: "a@example.test", name: null, emailVerified: true },
};

function render(auth: AuthState): string {
  return renderToStaticMarkup(
    <AuthContext.Provider value={auth}>
      <Adsense />
    </AuthContext.Provider>,
  );
}

describe("Adsense", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("in a production build with a publisher id", () => {
    const stubProduction = () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ID", "1234");
    };

    it("loads the ad script for a signed-out visitor", () => {
      stubProduction();
      expect(render(SIGNED_OUT)).toContain(
        "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234",
      );
    });

    // IndexedDB is shared by the whole origin, so the script never runs beside a signed-in person's Auth tokens.
    it("loads nothing for a signed-in person", () => {
      stubProduction();
      expect(render(SIGNED_IN)).toBe("");
    });

    it("loads nothing while sign-in is still being restored", () => {
      stubProduction();
      expect(render(LOADING)).toBe("");
    });
  });

  it("loads nothing without a publisher id", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ID", "");
    expect(render(SIGNED_OUT)).toBe("");
  });

  it("loads nothing outside a production build", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ID", "1234");
    expect(render(SIGNED_OUT)).toBe("");
  });

  // A document that first loaded an email link keeps its one-time code in the navigation entry after a client-side
  // navigation, so a public page reached that way never loads the script.
  describe("in a document that first loaded a page by its path", () => {
    async function renderFirstLoadedAt(path: string): Promise<string> {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ID", "1234");
      vi.stubGlobal("window", { location: { pathname: path } });
      vi.resetModules();
      const { default: Fresh } = await import("./adsense");
      const { AuthContext: FreshAuth } = await import("@/hooks/use-auth");
      return renderToStaticMarkup(
        <FreshAuth.Provider value={SIGNED_OUT}>
          <Fresh />
        </FreshAuth.Provider>,
      );
    }

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it.each(["/auth/action/", "/auth/action"])(
      "loads nothing when the document first loaded %s",
      async (path) => {
        expect(await renderFirstLoadedAt(path)).toBe("");
      },
    );

    it("loads the script when the document first loaded the landing page", async () => {
      expect(await renderFirstLoadedAt("/")).toContain(
        "adsbygoogle.js?client=ca-pub-1234",
      );
    });
  });
});
