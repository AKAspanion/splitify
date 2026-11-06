import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// A plain anchor: the test is about where the back link points, not about Next's client navigation.
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

import { backHref, Header } from "./header";

const HOSTILE = [
  "https://evil.example",
  "//evil.example",
  "/\\evil.example",
  "javascript:alert(1)",
];

describe("backHref", () => {
  it.each(HOSTILE)("drops back=%s for the page's own fallback", (back) => {
    expect(backHref(back, "/friends/f1/")).toBe("/friends/f1/");
  });

  it("keeps a same-site back path", () => {
    expect(backHref("/groups/abc/", "/friends/f1/")).toBe("/groups/abc/");
  });

  it("uses the fallback when there is no back", () => {
    expect(backHref(null, "/friends/f1/")).toBe("/friends/f1/");
    expect(backHref("", "/friends/f1/")).toBe("/friends/f1/");
  });
});

describe("Header", () => {
  it.each(HOSTILE)("never links off-site for backTo=%s", (backTo) => {
    const html = renderToStaticMarkup(<Header title="T" backTo={backTo} />);

    expect(html).toContain('href="/groups"');
    expect(html).not.toContain("evil.example");
    expect(html).not.toContain("javascript:");
  });

  it("links to a same-site backTo as given", () => {
    const html = renderToStaticMarkup(
      <Header title="T" backTo="/friends/f1/" />,
    );

    expect(html).toContain('href="/friends/f1/"');
  });

  it("uses a client-side link by default", () => {
    const html = renderToStaticMarkup(<Header title="T" backTo="/" />);

    expect(html).toContain("data-next-link");
  });

  it("with fullPageLoad, the back link is a plain anchor, not a client-side link", () => {
    const html = renderToStaticMarkup(
      <Header title="T" backTo="/" fullPageLoad />,
    );

    expect(html).toContain('<a href="/">');
    expect(html).not.toContain("data-next-link");
  });
});
