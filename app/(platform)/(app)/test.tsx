"use client";
import { Button } from "@/components/ui/button";
import { NotificationService } from "@/lib/notification/service/onesignal";

export const Test = () => {
  const testNotification = () => {
    NotificationService.sendNotification("hello pandit", "message for you", [
      "user_2c1z3eLoRagHzgHS1KH3kBuCZfJ",
    ]);
  };
  return (
    <div>
      <Button onClick={() => testNotification()}>Test</Button>
    </div>
  );
};
