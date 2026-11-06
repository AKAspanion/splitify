import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isVerifyBannerSnoozed,
  readVerifyBannerDismissal,
  verifyBannerKey,
  writeVerifyBannerDismissal,
} from "./verify-banner-dismissal";

const NOW = new Date("2026-11-06T12:00:00.000Z");
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const iso = (offsetMs: number) =>
  new Date(NOW.getTime() + offsetMs).toISOString();

/** A localStorage that keeps values in a Map, so the module can be tried in Node. */
function stubStorage(overrides: Partial<Storage> = {}) {
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    ...overrides,
  });
  return map;
}

afterEach(() => vi.unstubAllGlobals());

describe("isVerifyBannerSnoozed", () => {
  it("is false with no stored dismissal", () => {
    expect(isVerifyBannerSnoozed(null, NOW)).toBe(false);
  });

  it("is true for a dismissal made just now", () => {
    expect(isVerifyBannerSnoozed(iso(0), NOW)).toBe(true);
  });

  it("is true for a dismissal 1 minute ago", () => {
    expect(isVerifyBannerSnoozed(iso(-MINUTE), NOW)).toBe(true);
  });

  it("is true for a dismissal 6 days 23 hours ago", () => {
    expect(isVerifyBannerSnoozed(iso(-(6 * DAY + 23 * HOUR)), NOW)).toBe(true);
  });

  it("is false for a dismissal exactly 7 days ago or more", () => {
    expect(isVerifyBannerSnoozed(iso(-7 * DAY), NOW)).toBe(false);
    expect(isVerifyBannerSnoozed(iso(-8 * DAY), NOW)).toBe(false);
  });

  it("is false for a value that isn't a date", () => {
    expect(isVerifyBannerSnoozed("yesterday", NOW)).toBe(false);
    expect(isVerifyBannerSnoozed("", NOW)).toBe(false);
  });

  it("is false for a date that isn't what a dismissal writes, even one inside the 7 days", () => {
    expect(isVerifyBannerSnoozed("Nov 5 2026", NOW)).toBe(false);
    expect(isVerifyBannerSnoozed("2026-11-05", NOW)).toBe(false);
    expect(isVerifyBannerSnoozed("1730800000000", NOW)).toBe(false);
    expect(isVerifyBannerSnoozed(String(NOW.getTime() - DAY), NOW)).toBe(false);
  });

  it("is false for any dismissal dated in the future", () => {
    expect(isVerifyBannerSnoozed(iso(MINUTE), NOW)).toBe(false);
    expect(isVerifyBannerSnoozed(iso(3 * DAY), NOW)).toBe(false);
    expect(isVerifyBannerSnoozed(iso(7 * DAY + HOUR), NOW)).toBe(false);
  });
});

describe("the stored dismissal", () => {
  it("keys on the person", () => {
    expect(verifyBannerKey("u1")).toBe("splitify:verify-banner-dismissed:u1");
  });

  it("round-trips today's date", () => {
    stubStorage();
    writeVerifyBannerDismissal("u1", NOW);
    expect(readVerifyBannerDismissal("u1")).toBe(NOW.toISOString());
  });

  it("leaves another person's key empty", () => {
    stubStorage();
    writeVerifyBannerDismissal("u1", NOW);
    expect(readVerifyBannerDismissal("u2")).toBeNull();
  });

  it("returns null when reading throws", () => {
    stubStorage({
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readVerifyBannerDismissal("u1")).toBeNull();
  });

  it("does nothing when writing throws", () => {
    stubStorage({
      setItem: () => {
        throw new Error("full");
      },
    });
    expect(() => writeVerifyBannerDismissal("u1", NOW)).not.toThrow();
  });
});
