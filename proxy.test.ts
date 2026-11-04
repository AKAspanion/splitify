import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", async () => {
  const actual = await vi.importActual<typeof import("@clerk/nextjs/server")>(
    "@clerk/nextjs/server",
  );
  return { ...actual, clerkMiddleware: (handler: unknown) => handler };
});

import { isPublicRoute } from "./proxy";

const request = (path: string) =>
  new NextRequest(`https://splitify.spanion.in${path}`);

describe("isPublicRoute", () => {
  it.each(["/delete-account", "/privacy", "/"])("lets %s through", (path) => {
    expect(isPublicRoute(request(path))).toBe(true);
  });

  it.each(["/delete-account-x", "/groups", "/profile"])(
    "protects %s",
    (path) => {
      expect(isPublicRoute(request(path))).toBe(false);
    },
  );
});

describe("the public pages", () => {
  it("renders the privacy policy as text with every required point and no <pre>", async () => {
    const { default: PrivacyPage } =
      await import("@/app/(platform)/privacy/page");
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).not.toContain("<pre");
    for (const text of [
      "4 November 2026",
      "Clerk",
      "Vercel",
      "OneSignal",
      "UploadThing",
      "Google AdSense",
      "Deleted user",
      "/delete-account",
      "panditankit1995@gmail.com",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toMatch(/retention|logs are kept/i);
  });

  it("renders the deletion page with the in-app steps, what stays and the email route", async () => {
    const { default: DeleteAccountPage } =
      await import("@/app/(platform)/delete-account/page");
    const html = renderToStaticMarkup(DeleteAccountPage());
    for (const text of [
      "Delete your account",
      "Profile",
      "Delete account",
      "What is removed",
      "What other members keep",
      "panditankit1995@gmail.com",
    ]) {
      expect(html).toContain(text);
    }
  });
});

describe("assetlinks.json", () => {
  it("lists both signing certificates for the Android app", () => {
    const links = JSON.parse(
      readFileSync(
        join(__dirname, "public/.well-known/assetlinks.json"),
        "utf8",
      ),
    );
    const statements = links.filter(
      (s: { target: { package_name: string } }) =>
        s.target.package_name === "in.spanion.splitify.twa",
    );
    expect(statements).toHaveLength(1);
    expect(statements[0].target.sha256_cert_fingerprints).toEqual([
      "CC:62:1F:79:79:89:D1:A7:79:D8:91:87:40:43:53:A8:6E:A8:73:26:F4:95:E9:48:40:9D:2D:4E:89:79:D6:99",
      "B4:EB:FC:ED:F5:F7:69:3F:9C:25:9A:21:F0:B7:C4:11:1D:A7:80:0F:0A:01:8C:12:A4:2E:18:3A:4E:D6:67:C9",
    ]);
  });
});
