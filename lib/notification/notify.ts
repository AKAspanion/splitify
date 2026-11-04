import { after } from "next/server";
import { APILogger } from "@/lib/logger";
import { sendNotification } from "@/lib/onesignal";
import type { ActivityMessage } from "./messages";

/**
 * Sends the message's push to each user after the response goes out, so an action never waits for OneSignal and
 * never fails when it does. The person who made the change (`actorId`) gets `actorContent` when the message has
 * one. A failed push is logged with the activity type only. Never throws.
 */
export function notifyAfterResponse(
  externalIds: string[],
  msg: ActivityMessage,
  actorId?: string,
): void {
  const ids = [...new Set(externalIds.filter(Boolean))];
  if (ids.length === 0) return;

  const send = async () => {
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          sendNotification({
            heading: msg.heading,
            content:
              id === actorId && msg.actorContent
                ? msg.actorContent
                : msg.content,
            external_id: [id],
            options: { url: msg.url },
          }),
        ),
      );
      const failed = results.filter(
        (r) => r.status === "rejected" || !!r.value?.errors,
      ).length;
      if (failed > 0) {
        await APILogger.error("Push notification failed", {
          type: msg.type,
          failed,
        });
      }
    } catch {
      console.error("Push notification failed");
    }
  };

  try {
    after(send);
  } catch {
    console.error("Push notification could not be scheduled");
  }
}
