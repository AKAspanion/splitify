const ContentType = "application/json";
const charset = "utf-8";
const Authorization = `Basic ${process.env.ONE_SIGNAL_REST_API_KEY || ""}`;
const app_id = `${process.env.NEXT_PUBLIC_ONE_SIGNAL_APP_ID || ""}`;

const postCall = <T>(path: string, body: T) => {
  return fetch(`https://onesignal.com/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": ContentType, charset, Authorization },
    body: JSON.stringify({ ...body, app_id }),
  });
};

export const sendNotification = async ({
  content,
  heading,
  external_id,
}: SendNotificationUserbody) => {
  try {
    const target_channel = "push";
    const notificationBody = {
      target_channel,
      contents: { en: content },
      headings: { en: heading },
      include_aliases: { external_id },
    };

    const data = await postCall("/notifications", notificationBody);
    return await data.json();
  } catch (e) {
    const error = e as Error;
    return { errors: [error.message] };
  }
};
