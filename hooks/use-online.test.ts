import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOnlineSnapshot, subscribeOnline } from "./use-online";
import { bannerLines } from "@/components/offline/offline-banner";

describe("online state", () => {
  let target: EventTarget;
  beforeEach(() => {
    target = new EventTarget();
    vi.stubGlobal("window", target);
    vi.stubGlobal("navigator", { onLine: true });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the offline and online events", () => {
    let calls = 0;
    const stop = subscribeOnline(() => calls++);
    expect(getOnlineSnapshot()).toBe(true);
    (globalThis.navigator as { onLine: boolean }).onLine = false;
    target.dispatchEvent(new Event("offline"));
    expect(getOnlineSnapshot()).toBe(false);
    (globalThis.navigator as { onLine: boolean }).onLine = true;
    target.dispatchEvent(new Event("online"));
    expect(getOnlineSnapshot()).toBe(true);
    expect(calls).toBe(2);
    stop();
    target.dispatchEvent(new Event("online"));
    expect(calls).toBe(2);
  });
});

describe("bannerLines", () => {
  it("offline with two paused writes", () => {
    expect(bannerLines(false, 2)).toEqual([
      "You're offline. Showing what was saved on this device.",
      "2 changes waiting to sync",
    ]);
  });
  it("offline with none", () => {
    expect(bannerLines(false, 0)).toEqual([
      "You're offline. Showing what was saved on this device.",
    ]);
  });
  it("online with paused writes resuming", () => {
    expect(bannerLines(true, 2)).toEqual(["Syncing 2 changes…"]);
  });
  it("online with none shows nothing", () => {
    expect(bannerLines(true, 0)).toEqual([]);
  });
});
