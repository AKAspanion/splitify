import { onlineManager } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { syncOnlineState } from "./online-state";

describe("syncOnlineState", () => {
  afterEach(() => onlineManager.setOnline(true));

  it("tells react-query the page started offline, which it never learns from an event", () => {
    onlineManager.setOnline(true);
    syncOnlineState({ onLine: false });
    expect(onlineManager.isOnline()).toBe(false);
  });

  it("tells it the page started online", () => {
    onlineManager.setOnline(false);
    syncOnlineState({ onLine: true });
    expect(onlineManager.isOnline()).toBe(true);
  });

  it("leaves it alone where there is no browser to ask", () => {
    onlineManager.setOnline(true);
    syncOnlineState(undefined);
    syncOnlineState({});
    expect(onlineManager.isOnline()).toBe(true);
  });
});
