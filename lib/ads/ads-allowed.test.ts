import { describe, expect, it } from "vitest";
import { adsAllowedOn } from "./ads-allowed";

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
