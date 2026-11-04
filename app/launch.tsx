"use client";

import { onUserChanged } from "@/lib/firebase/auth";
import { listenForIosToken, registerWebPush } from "@/lib/push/register";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const Launch = () => {
  const [uid, setUid] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "" || pathname === "/";

  useEffect(() => onUserChanged((user) => setUid(user?.uid ?? null)), []);

  // Someone signed in: take the iOS wrapper's token, and re-register this browser's when it already has permission.
  // The permission prompt itself is never raised here.
  useEffect(() => {
    if (!uid) return;
    const stopListening = listenForIosToken();
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    )
      void registerWebPush();
    return stopListening;
  }, [uid]);

  useEffect(() => {
    if (uid && isHome) {
      router.push("/groups");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return null;
};
