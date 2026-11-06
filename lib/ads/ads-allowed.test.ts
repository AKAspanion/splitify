import { describe, expect, it } from "vitest";
import { adsAllowedFor, adsAllowedOn } from "./ads-allowed";

describe("adsAllowedOn", () => {
  it.each(["/auth/action/", "/auth/action", "/auth/action/index.html"])(
    "keeps the ad script off %s, whose URL can carry a one-time code",
    (p) => expect(adsAllowedOn(p)).toBe(false),
  );

  it.each(["/", "/groups/", "/sign-in/", "/auth/actions/", "/auth/"])(
    "allows ads on %s",
    (p) => expect(adsAllowedOn(p)).toBe(true),
  );
});

describe("adsAllowedFor", () => {
  it.each([
    // The document arrived with a code, which its navigation entry keeps after a client-side navigation.
    ["/auth/action/", "/sign-in/"],
    ["/auth/action", "/groups/"],
    ["/auth/action/index.html", "/"],
    // The current page can carry a code.
    ["/", "/auth/action/"],
  ])(
    "keeps the ad script off a document first at %s, now at %s",
    (first, now) => expect(adsAllowedFor(first, now)).toBe(false),
  );

  it.each([
    ["/", "/groups/"],
    ["/sign-in/", "/sign-in/"],
  ])("allows ads in a document first at %s, now at %s", (first, now) =>
    expect(adsAllowedFor(first, now)).toBe(true),
  );
});
