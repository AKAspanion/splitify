"use client";

import { useMutationState } from "@tanstack/react-query";
import { useOnline } from "@/hooks/use-online";

export const OFFLINE_MESSAGE =
  "You're offline. Showing what was saved on this device.";

function changes(n: number): string {
  return `${n} ${n === 1 ? "change" : "changes"}`;
}

/** The banner's lines: offline says so and counts what waits; online with paused writes says they sync. */
export function bannerLines(online: boolean, paused: number): string[] {
  if (!online) {
    return paused > 0
      ? [OFFLINE_MESSAGE, `${changes(paused)} waiting to sync`]
      : [OFFLINE_MESSAGE];
  }
  return paused > 0 ? [`Syncing ${changes(paused)}…`] : [];
}

export function OfflineBanner() {
  const online = useOnline();
  const paused = useMutationState({
    filters: { status: "pending" },
    select: (mutation) => mutation.state.isPaused,
  }).filter(Boolean).length;
  const lines = bannerLines(online, paused);
  if (lines.length === 0) return null;
  return (
    <div
      role="status"
      className="bg-amber-100 text-amber-900 text-sm px-4 py-2 text-center"
    >
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
