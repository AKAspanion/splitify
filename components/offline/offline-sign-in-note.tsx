"use client";

import { useOnline } from "@/hooks/use-online";

export const OFFLINE_SIGN_IN = "You're offline. Connect to sign in.";

/** Says why the sign-in screens' buttons are disabled while offline. */
export function OfflineSignInNote() {
  const online = useOnline();
  if (online) return null;
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {OFFLINE_SIGN_IN}
    </p>
  );
}
