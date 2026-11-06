import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/auth", () => ({ sendVerificationEmail: vi.fn() }));

import { AuthContext, type AuthState } from "@/hooks/use-auth";
import { verifyBannerKey } from "@/lib/auth/verify-banner-dismissal";
import { VerifyEmailBanner } from "./verify-email-banner";

const COPY =
  "Verify your email to keep your account safe. Contacts others added with this email join your account once you do.";

const unverified: AuthState = {
  status: "signed-in",
  user: { uid: "u1", email: "a@b.c", name: null, emailVerified: false },
};
const verified: AuthState = {
  status: "signed-in",
  user: { uid: "u1", email: "a@b.c", name: null, emailVerified: true },
};
const signedOut: AuthState = { status: "signed-out", user: null };

function render(state: AuthState, dismissable?: boolean) {
  return renderToStaticMarkup(
    <AuthContext.Provider value={state}>
      <VerifyEmailBanner dismissable={dismissable} />
    </AuthContext.Provider>,
  );
}

/** A localStorage holding these values. */
function stubStorage(values: Record<string, string> = {}) {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values[key] ?? null,
    setItem: () => undefined,
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("VerifyEmailBanner", () => {
  it("on Groups with no dismissal shows the text, Resend email and Dismiss, and no I've verified", () => {
    stubStorage();
    const html = render(unverified, true);
    expect(html).toContain(COPY);
    expect(html).toContain("Resend email");
    expect(html).toContain("Dismiss");
    expect(html).not.toContain("verified");
  });

  it("on Groups stays hidden while a dismissal is under 7 days old", () => {
    stubStorage({ [verifyBannerKey("u1")]: new Date().toISOString() });
    expect(render(unverified, true)).toBe("");
  });

  it("on Groups shows again once the dismissal is 7 days old", () => {
    stubStorage({
      [verifyBannerKey("u1")]: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000 - 1000,
      ).toISOString(),
    });
    expect(render(unverified, true)).toContain("Resend email");
  });

  it("on Groups shows when storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(render(unverified, true)).toContain("Resend email");
  });

  it("on Profile shows Resend email and no Dismiss, whatever the stored date", () => {
    stubStorage({ [verifyBannerKey("u1")]: new Date().toISOString() });
    const html = render(unverified);
    expect(html).toContain(COPY);
    expect(html).toContain("Resend email");
    expect(html).not.toContain("Dismiss");
  });

  it("renders nothing for a verified person, a signed-out one or a loading state", () => {
    stubStorage();
    expect(render(verified, true)).toBe("");
    expect(render(verified)).toBe("");
    expect(render(signedOut, true)).toBe("");
    expect(render({ status: "loading", user: null })).toBe("");
  });
});
