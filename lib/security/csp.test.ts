import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type HeaderRule = {
  source: string;
  headers: { key: string; value: string }[];
};

/** The `**` rule's Content-Security-Policy, as Firebase Hosting sends it on every page. */
function sitewideCsp(): string {
  const rules: HeaderRule[] = JSON.parse(readFileSync("firebase.json", "utf8"))
    .hosting.headers;
  const rule = rules.find(({ source }) => source === "**");
  const csp = rule?.headers.find(
    ({ key }) => key === "Content-Security-Policy",
  );
  if (!csp)
    throw new Error("firebase.json has no `**` Content-Security-Policy");
  return csp.value;
}

/**
 * The headers Hosting sends for a block's source, as Hosting merges them: every matching block in order, a later block
 * replacing an earlier one's header of the same key. Only `**` and the given source are taken as matching.
 */
function headersFor(source: string): Record<string, string> {
  const rules: HeaderRule[] = JSON.parse(readFileSync("firebase.json", "utf8"))
    .hosting.headers;
  const out: Record<string, string> = {};
  for (const rule of rules) {
    if (rule.source !== "**" && rule.source !== source) continue;
    for (const { key, value } of rule.headers) out[key] = value;
  }
  return out;
}

/** One directive's sources, split the way a browser splits them: on whitespace. */
function directiveSources(csp: string, name: string): string[] {
  const directive = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.split(/\s+/)[0] === name);
  if (!directive) throw new Error(`The CSP has no ${name}`);
  return directive.split(/\s+/).slice(1);
}

describe("firebase.json's sitewide Content-Security-Policy", () => {
  const frameSrc = directiveSources(sitewideCsp(), "frame-src");

  it("lets the pages frame the site's own origin (the auth domain's /__/auth/iframe), Firebase's default auth domain, Google sign-in and the ad hosts", () => {
    expect(frameSrc).toEqual([
      "'self'",
      "https://splitify-416321.firebaseapp.com",
      "https://accounts.google.com",
      "https://pagead2.googlesyndication.com",
      "https://*.googlesyndication.com",
      "https://*.doubleclick.net",
      "https://googleads.g.doubleclick.net",
      "https://adservice.google.com",
      "https://www.googletagservices.com",
      "https://partner.googleadservices.com",
      "https://tpc.googlesyndication.com",
    ]);
  });

  it("keeps each frame-src source its own token: 'self' or one https:// origin", () => {
    for (const source of frameSrc) {
      if (source === "'self'") continue;
      expect(source).toMatch(/^https:\/\//);
      expect(source.indexOf("https://", 1)).toBe(-1);
    }
  });
});

describe("firebase.json's headers for the email action page", () => {
  // `/auth/action`, `/auth/action/` and anything under it, but not `/auth/actions/`.
  const headers = headersFor("/auth/action{,/**}");

  it("keeps the page, whose URL carries a one-time code, out of every cache and never sends it as a referrer", () => {
    expect(headers["Cache-Control"]).toBe("no-store");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
  });

  it("keeps the sitewide Content-Security-Policy", () => {
    expect(headers["Content-Security-Policy"]).toBe(sitewideCsp());
  });
});
