"use client";

import { useSyncExternalStore } from "react";

export function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

/** Follows `navigator.onLine` and the `online`/`offline` events. Online on the server and before hydration. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => true);
}
