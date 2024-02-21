import { auth } from "@clerk/nextjs";

const ContentType = "application/json";

export class NotificationService {
  public static async sendNotification(
    heading: string,
    content: string,
    userIds: string[],
  ) {
    await fetch("/api/push-notification/notifications", {
      method: "POST",
      headers: { "Content-Type": ContentType },
      body: JSON.stringify({ heading, content, userIds }),
    });
  }
}
