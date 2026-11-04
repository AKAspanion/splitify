import { getUrlWithHost } from "@/utils/validate";

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

export async function deleteOneSignalUser(
  externalId: string,
): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(
      `https://api.onesignal.com/apps/${app_id}/users/by/external_id/${encodeURIComponent(externalId)}`,
      { method: "DELETE", headers: { Authorization } },
    );
    // A user OneSignal doesn't know (404) is already gone.
    return { ok: (res.status >= 200 && res.status < 300) || res.status === 404 };
  } catch {
    return { ok: false };
  }
}

export const sendNotification = async ({
  content,
  heading,
  external_id,
  options = {},
}: SendNotificationUserbody) => {
  try {
    const { url } = options;
    const withHostUrl = getUrlWithHost(url);
    const target_channel = "push";
    const notificationBody = {
      web_url: withHostUrl,
      app_url: withHostUrl,
      target_channel,
      contents: { en: content },
      headings: { en: heading },
      include_aliases: { external_id },
    };

    const data = await postCall("/notifications", notificationBody);
    const res = await data.json();
    return res;
  } catch (e) {
    const error = e as Error;
    return { errors: [error.message] };
  }
};
