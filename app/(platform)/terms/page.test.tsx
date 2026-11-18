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

import TermsPage from "./page";

const terms = renderToStaticMarkup(<TermsPage />);

describe("terms page", () => {
  it("has the title and the 17 November 2026 effective date", () => {
    expect(terms).toContain("Terms of Service");
    expect(terms).toContain("Effective date: 17 November 2026");
  });

  it("goes back to / by a full page load", () => {
    expect(terms).toContain(
      'data-testid="back" data-full-page-load="true" href="/"',
    );
  });

  it("does not render the AdSense component", () => {
    expect(terms).not.toContain('data-testid="adsense"');
  });

  it("links to the privacy policy and account deletion with plain anchors", () => {
    expect(terms).toContain('href="/privacy/"');
    expect(terms).toContain('href="/delete-account/"');
  });

  it("says Splitify does not move, hold or send money, and the minimum age is 13", () => {
    expect(terms).toContain("does not move, hold or send money");
    expect(terms).toContain("13 or older");
  });

  it("says only the privacy policy and delete-account pages show ads", () => {
    expect(terms).toContain(
      "The privacy policy and delete-account pages show ads from Google AdSense",
    );
    expect(terms).not.toContain("The public pages show ads");
  });

  it("has the contact address", () => {
    expect(terms).toContain("mailto:panditankit1995@gmail.com");
  });
});
