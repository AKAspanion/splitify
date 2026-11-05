import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cacheStrategy, fallbackPage } from "./sw-routing.js";

const ORIGIN = "https://splitify.example";
const at = (p: string) => ORIGIN + p;

describe("cacheStrategy", () => {
  it.each(["/_next/static/chunks/x.js", "/images/a.png", "/images/ss/b.webp"])(
    "precaches %s first",
    (p) => expect(cacheStrategy(at(p), ORIGIN)).toBe("precache-first"),
  );

  it.each(["/", "/groups/", "/groups/abc/", "/privacy/", "/sw-manifest.js"])(
    "tries the network first for %s",
    (p) => expect(cacheStrategy(at(p), ORIGIN)).toBe("network-first-page"),
  );

  it.each([
    at("/api/reports/expenses"),
    at("/api/webauthn/register"),
    at("/api/"),
    at("/sw.js"),
    at("/sw.js?apiKey=k"),
    at("/__/auth/handler"),
    "https://firebasedataconnect.googleapis.com/v1/x:executeQuery",
    "https://accounts.google.com/o/oauth2/auth",
    "https://splitify.example.evil.com/images/a.png",
    "not a url",
    "",
  ])("never touches %s", (u) =>
    expect(cacheStrategy(u, ORIGIN)).toBe("bypass"),
  );

  // Firebase's email links carry a one-time code in the query: the worker never caches the page they open.
  it.each([
    "/auth/action/",
    "/auth/action",
    "/auth/action/?mode=resetPassword&oobCode=abc",
    "/auth/action?mode=verifyEmail&oobCode=x",
    "/auth/action/index.html?mode=resetPassword&oobCode=abc",
  ])("never touches the action page %s", (p) =>
    expect(cacheStrategy(at(p), ORIGIN)).toBe("bypass"),
  );

  it.each(["/auth/", "/auth/actions/", "/auth/actionx", "/sign-in/"])(
    "still tries the network first for %s, beside the action page",
    (p) => expect(cacheStrategy(at(p), ORIGIN)).toBe("network-first-page"),
  );

  it("treats a cross-origin static file as bypass", () => {
    expect(
      cacheStrategy("https://www.gstatic.com/firebasejs/x.js", ORIGIN),
    ).toBe("bypass");
  });
});

describe("fallbackPage", () => {
  it.each([
    ["/groups/abc/", "/groups/_/index.html"],
    ["/groups/abc", "/groups/_/index.html"],
    ["/groups/abc/expense/def/", "/groups/_/expense/_/index.html"],
    ["/groups/abc/expense/", "/groups/_/expense/index.html"],
    ["/groups/abc/settings/", "/groups/_/settings/index.html"],
    ["/friends/x/", "/friends/_/index.html"],
    ["/friends/x/edit/contact/", "/friends/_/edit/contact/index.html"],
    ["/activity/x/", "/activity/_/index.html"],
    ["/expense/x/edit/", "/expense/_/edit/index.html"],
    ["/groups/", "/groups/index.html"],
    ["/groups", "/groups/index.html"],
    ["/", "/index.html"],
    ["/no-such-page/", "/404.html"],
    ["/groups/a/b/c/d/", "/404.html"],
  ])("%s gives %s", (p, expected) => expect(fallbackPage(p)).toBe(expected));
});

describe("fallbackPage against the repository", () => {
  const rewrites: { source: string; destination?: string }[] = JSON.parse(
    readFileSync("firebase.json", "utf8"),
  ).hosting.rewrites;

  it("follows every page rewrite in firebase.json", () => {
    for (const { source, destination } of rewrites) {
      if (!destination) continue;
      const sample = source.replace(/\*/g, "sample");
      expect(fallbackPage(sample + "/"), source).toBe(destination);
    }
  });

  it("knows every page without a dynamic segment", () => {
    const pages: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name === "page.tsx") pages.push(dir);
      }
    };
    walk("app");
    expect(pages.length).toBeGreaterThan(10);
    for (const dir of pages) {
      const segments = path
        .relative("app", dir)
        .split(path.sep)
        .filter((s) => s && !(s.startsWith("(") && s.endsWith(")")));
      if (segments.some((s) => s.startsWith("["))) continue;
      const route = "/" + segments.map((s) => s + "/").join("");
      expect(fallbackPage(route), route).not.toBe("/404.html");
    }
  });
});

describe("the checked-in public/sw-routing.js", () => {
  // The dev worker reads it; the build copies this file over it in `out/`. A copy behind this one serves the dev
  // worker old rules.
  it("is the same file as lib/offline/sw-routing.js", () => {
    expect(readFileSync("public/sw-routing.js", "utf8")).toBe(
      readFileSync("lib/offline/sw-routing.js", "utf8"),
    );
  });
});
