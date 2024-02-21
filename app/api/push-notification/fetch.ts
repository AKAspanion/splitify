const ContentType = "application/json";
const charset = "utf-8";
const Authorization = `Basic ${process.env.ONE_SIGNAL_REST_API_KEY || ""}`;
const app_id = `${process.env.NEXT_PUBLIC_ONE_SIGNAL_APP_ID || ""}`;

export const postCall = <T>(path: string, body: T) => {
  return fetch(`https://onesignal.com/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": ContentType, charset, Authorization },
    body: JSON.stringify({ ...body, app_id }),
  });
};
