"use client";

import { Button } from "@/components/ui/button";
import { registerWebPush } from "@/lib/push/register";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

type State = "" | "granted" | "default" | "denied" | "unsupported";

export default function NotificationAction() {
  const [state, setState] = useState<State>("");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setState("unsupported");
      return;
    }
    setState(Notification.permission);
    if (Notification.permission === "granted") {
      // Quietly make sure this browser's token is registered on this account.
      void registerWebPush();
    }
  }, []);

  async function handleAllow() {
    const result = await registerWebPush();
    if (result === "registered") setState("granted");
    else if (result === "denied") setState("denied");
    else setState("unsupported");
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
