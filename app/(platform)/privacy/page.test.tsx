import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/adsense", () => ({
  default: () => <div data-testid="adsense" />,
}));
vi.mock("@/components/container/header", () => ({
  Header: ({
    backTo,
    title,
    fullPageLoad,
  }: {
    backTo: string;
    title: string;
    fullPageLoad?: boolean;
  }) => (
    <a
      data-testid="back"
      data-full-page-load={fullPageLoad ? "true" : "false"}
      href={backTo}
    >
      {title}
    </a>
  ),
}));

import DeleteAccountPage from "../delete-account/page";
import PrivacyPage from "./page";

const privacy = renderToStaticMarkup(<PrivacyPage />);
const deleteAccount = renderToStaticMarkup(<DeleteAccountPage />);

describe("privacy page", () => {
  it("has the 6 November 2026 effective date", () => {
    expect(privacy).toContain("Effective date: 6 November 2026");
  });

  it("goes back to / by a full page load, so the ad script never follows into the app", () => {
    expect(privacy).toContain(
      'data-testid="back" data-full-page-load="true" href="/"',
    );
  });

  it("has an Advertising section with the AdSense wording and links", () => {
    expect(privacy).toContain("Advertising");
    expect(privacy).toContain("Google AdSense on its public pages");
    expect(privacy).toContain("never inside the signed-in app");
    expect(privacy).toContain('href="https://adssettings.google.com"');
    expect(privacy).toContain('href="https://www.aboutads.info"');
    expect(privacy).toContain(
      'href="https://policies.google.com/technologies/partner-sites"',
    );
    expect(privacy).toContain(
      "How Google uses information from sites that use its services",
    );
  });

  it("names today's processors and none of the old ones", () => {
    for (const name of [
      "Firebase Authentication",
      "Firebase SQL Connect",
      "Cloud Functions",
      "Firebase Hosting",
      "Firebase Cloud Messaging",
      "Google AdSense",
    ]) {
      expect(privacy).toContain(name);
    }
    for (const name of ["Clerk", "Vercel", "OneSignal", "UploadThing"]) {
      expect(privacy).not.toContain(name);
    }
  });

  it("lists cookies and device identifiers, and no page-view measurement", () => {
    expect(privacy).toContain(
      "Cookies and device identifiers that Google uses to show ads on the public pages.",
    );
    expect(privacy).not.toContain("Page views and performance measurements");
  });

  it("keeps the contact address", () => {
    expect(privacy).toContain("mailto:panditankit1995@gmail.com");
  });
});

describe("delete-account page", () => {
  it("mounts Adsense and keeps plain anchors", () => {
    expect(deleteAccount).toContain('data-testid="adsense"');
    expect(deleteAccount).toContain(
      'data-testid="back" data-full-page-load="true" href="/"',
    );
    expect(deleteAccount).toContain('<a class="underline" href="/privacy">');
    expect(deleteAccount).toContain("Your account is deleted straight");
  });
});
