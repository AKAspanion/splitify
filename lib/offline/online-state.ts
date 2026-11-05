import { onlineManager } from "@tanstack/react-query";

/**
 * react-query assumes it starts online and only changes its mind on an `online`/`offline` event. A page opened while
 * already offline gets no event, so its first fetches would fail and retry as if the network were up, and end by
 * replacing the saved data on screen with an error. Told at startup, a fetch made offline waits instead.
 */
export function syncOnlineState(source?: { onLine?: boolean }): void {
  // Nothing to read while the page is prerendered (no browser, or a runtime without `onLine`).
  if (typeof source?.onLine !== "boolean") return;
  onlineManager.setOnline(source.onLine);
}
