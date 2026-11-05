import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type HeaderRule = {
  source: string;
  headers: { key: string; value: string }[];
};

type FirebaseConfig = {
  emulators: { auth: { host: string; port: number } };
  hosting: { headers: HeaderRule[] };
};

function readConfig(file: string): FirebaseConfig {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** The `**` rule's value for one header, as Firebase Hosting sends it on every page. */
function sitewideHeader(file: string, name: string): string {
  const rule = readConfig(file).hosting.headers.find(
    ({ source }) => source === "**",
  );
  const header = rule?.headers.find(({ key }) => key === name);
  if (!header) throw new Error(`${file} has no \`**\` ${name}`);
  return header.value;
}

/** The `**` rule's Content-Security-Policy, as Firebase Hosting sends it on every page. */
function sitewideCsp(file = "firebase.json"): string {
  return sitewideHeader(file, "Content-Security-Policy");
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

describe("firebase.json's Strict-Transport-Security", () => {
  it("is sent on every path, for two years, with subdomains", () => {
    expect(sitewideHeader("firebase.json", "Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains",
    );
  });
});

describe("firebase.emulators.json's sitewide Content-Security-Policy", () => {
  const frameSrc = directiveSources(
    sitewideCsp("firebase.emulators.json"),
    "frame-src",
  );
  const { host, port } = readConfig("firebase.json").emulators.auth;

  it("lets the pages frame the site's own origin and the Auth emulator, each its own token", () => {
    expect(frameSrc).toContain("'self'");
    expect(frameSrc).toContain(`http://${host}:${port}`);
  });

  it("names the Auth emulator at the port firebase.json gives it", () => {
    expect(port).toBe(
      readConfig("firebase.emulators.json").emulators.auth.port,
    );
  });
});
