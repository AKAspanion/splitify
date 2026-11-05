"use client";

import { useOnline } from "@/hooks/use-online";

export const OFFLINE_NEEDS_CONNECTION =
  "You're offline. This needs a connection.";

/** Gives its children `disabled` while offline and, then, says why under them. */
export function OnlineOnly({
  children,
}: {
  children: (disabled: boolean) => React.ReactNode;
}) {
  const online = useOnline();
  return (
    <>
      {children(!online)}
      {!online && (
        <p role="status" className="text-xs text-muted-foreground mt-1">
          {OFFLINE_NEEDS_CONNECTION}
        </p>
      )}
    </>
  );
}
