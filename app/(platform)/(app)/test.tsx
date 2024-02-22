"use client";
import { Button } from "@/components/ui/button";
import { NotificationService } from "@/lib/notification/service";

export const Test = () => {
  const testNotification = () => {
    NotificationService.sendNotification(
      "kghkcgk",
      "jhhjfhjhjh",
      ["user_2c96NED3YSRvUEaBqUUl7l51HkE", "user_2cH8UFEAEUYs6KDTDi7EIGfIF60"],
      { url: "https://splitify.spanion.in/logs" },
    );
  };
  return (
    <div>
      <Button onClick={() => testNotification()}>Test</Button>
    </div>
  );
};
