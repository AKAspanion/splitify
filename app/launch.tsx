"use client";

import { useAuth } from "@/hooks/use-auth";
import { UpdateToast } from "@/components/offline/update-toast";
import {
  listenForIosToken,
  registerAppWorker,
  registerWebPush,
} from "@/lib/push/register";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const Launch = () => {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const pathname = usePathname();
  const isHome = pathname === "" || pathname === "/";

  // The one service worker (offline shell and push) is registered for everyone, signed in or not.
  // The worker only works in the exported build, not in next dev (see knowledge/operations/service-worker.md).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }
    registerAppWorker().catch((error) =>
      console.error(
        `[sw] registration failed: ${error instanceof Error ? error.name : "unknown"}`,
      ),
    );
  }, []);

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

  // Someone signed in on the landing page goes to the app by a full page load, never a client navigation: the landing
  // page may have loaded the ad script, which would carry over (knowledge/decisions/adsense-on-public-pages-only.md).
  useEffect(() => {
    if (uid && isHome) {
      window.location.replace("/groups/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return <UpdateToast />;
};
