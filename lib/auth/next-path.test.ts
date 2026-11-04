import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("returns a same-site path as it is", () => {
    expect(safeNextPath("/groups/abc")).toBe("/groups/abc");
  });

  it.each([
    null,
    undefined,
    "",
    "groups",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "/\t/evil.example",
  ])("falls back to /groups for %s", (raw) => {
    expect(safeNextPath(raw)).toBe("/groups");
  });
});
