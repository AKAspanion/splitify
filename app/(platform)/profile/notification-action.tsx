"use client";

import { Button } from "@/components/ui/button";
import { registerWebPush } from "@/lib/push/register";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

type State = "" | "granted" | "default" | "denied" | "unsupported";

// The browser's permission is read while rendering, not set from an effect. The page is prerendered, where there is
// no Notification: the server snapshot "" renders nothing, and hydration then reads the real permission.
const noSubscription = () => () => {};
const readPermission = (): State =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;
const prerenderedPermission = (): State => "";

export default function NotificationAction() {
  const permission = useSyncExternalStore(
    noSubscription,
    readPermission,
    prerenderedPermission,
  );
  // What turning notifications on ended in, which outranks the permission read on mount.
  const [result, setResult] = useState<State>();
  const state = result ?? permission;

  useEffect(() => {
    if (readPermission() === "granted") {
      // Quietly make sure this browser's token is registered on this account.
      void registerWebPush();
    }
  }, []);

  async function handleAllow() {
    const result = await registerWebPush();
    if (result === "registered") setResult("granted");
    else if (result === "denied") setResult("denied");
    else setResult("unsupported");
  }

  if (state === "") return null;

  if (state === "unsupported") {
    return <div>This browser can&apos;t show notifications.</div>;
  }

  if (state === "denied") {
    return (
      <div>
        Notifications are blocked. Allow them in your browser&apos;s settings.
      </div>
    );
  }

  if (state === "granted") {
    return (
      <Button disabled>
        <Bell />
        <div>Notifications are on</div>
      </Button>
    );
  }

  return (
    <Button onClick={handleAllow}>
      <BellOff />
      <div>Turn on</div>
    </Button>
  );
}
