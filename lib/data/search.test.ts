import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { queryKeys } from "./client";
import { escapeSearch } from "./search";

describe("escapeSearch", () => {
  const nasty = "a.b*(c)?[d]{e}|f^g$h\\i+";

  it("backslash-escapes every regular-expression character", () => {
    const escaped = escapeSearch(nasty);
    expect(escaped).toBe(
      "a\\.b\\*\\(c\\)\\?\\[d\\]\\{e\\}\\|f\\^g\\$h\\\\i\\+",
    );
  });

  it("matches only the literal text as a regular expression", () => {
    const re = new RegExp(`^${escapeSearch(nasty)}$`);
    expect(re.test(nasty)).toBe(true);
    expect(re.test("aXb")).toBe(false);
    expect(new RegExp(escapeSearch(".*")).test("anything")).toBe(false);
  });

  it("cuts plain text to 100 characters", () => {
    expect(escapeSearch("a".repeat(150))).toBe("a".repeat(100));
  });

  // The server refuses a search over 100 characters, and it bounds the escaped text, so the escaped text is what fits.
  it("keeps 100 regular-expression characters within 100 once escaped", () => {
    const escaped = escapeSearch(".".repeat(100));
    expect(escaped.length).toBeLessThanOrEqual(100);
    expect(escaped).toBe("\\.".repeat(50));
    expect(new RegExp(`^${escaped}$`).test(".".repeat(50))).toBe(true);
  });

  it("never ends on half an escape", () => {
    // 99 letters then a dot: the dot's escape needs two characters and only one is left, so it is left out whole.
    const escaped = escapeSearch(`${"a".repeat(99)}.`);
    expect(escaped).toBe("a".repeat(99));
    expect(() => new RegExp(escaped)).not.toThrow();

    const mixed = escapeSearch("a.".repeat(80));
    expect(mixed.length).toBeLessThanOrEqual(100);
    expect(mixed.endsWith("\\")).toBe(false);
    expect(new RegExp(`^${mixed}$`).test("a.".repeat(33) + "a")).toBe(true);
  });

  it("never splits a character outside the basic plane", () => {
    const escaped = escapeSearch(`${"a".repeat(99)}😀`);
    expect(escaped).toBe("a".repeat(99));
  });

  it("leaves plain text alone", () => {
    expect(escapeSearch("taxi")).toBe("taxi");
  });
});

describe("queryKeys", () => {
  it("is the operation name and its variables", () => {
    expect(queryKeys.ListMyGroups({ search: "goa", limit: 6 })).toEqual([
      "ListMyGroups",
      { search: "goa", limit: 6 },
    ]);
  });

  it("has one entry for each query operation in dataconnect/app", () => {
    const dir = join(process.cwd(), "dataconnect/app");
    const names = readdirSync(dir)
      .filter((file) => file.endsWith(".gql"))
      .flatMap((file) =>
        [
          ...readFileSync(join(dir, file), "utf8").matchAll(/^query (\w+)/gm),
        ].map((m) => m[1]),
      );
    expect(names.length).toBeGreaterThan(0);
    expect(Object.keys(queryKeys).sort()).toEqual([...names].sort());
  });
});
