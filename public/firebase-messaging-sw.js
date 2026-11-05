/* Shows Splitify's push notifications while no tab is open.
 * A worker cannot import from node_modules, so the Firebase compat scripts come from the CDN, at the version of the
 * `firebase` package installed in this repository (keep them in step). The public web config is read from this
 * worker's own URL: lib/push/register.ts registers it with `?apiKey=...&projectId=...&appId=...`. */
importScripts(
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js",
);

const params = new URL(self.location.href).searchParams;
const appId = params.get("appId") || "";

if (params.get("apiKey") && params.get("projectId") && appId) {
  firebase.initializeApp({
    apiKey: params.get("apiKey"),
    projectId: params.get("projectId"),
    appId,
    // The sender id is the project number inside the web app id (`1:<number>:web:<hash>`).
    messagingSenderId: appId.split(":")[1],
  });

  const messaging = firebase.messaging();

  // A message with a `notification` part is shown by the browser itself; one with only a data payload
  // (title, body and link) is shown here.
  messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return;
    const data = payload.data || {};
    if (!data.title) return;
    self.registration.showNotification(data.title, {
      body: data.body || "",
      icon: "/images/logo-192x192.png",
      data: { link: data.link || "/" },
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  // Only same-origin links open: a link from a message is never trusted to leave the app.
  const target = new URL(link, self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client && "navigate" in client) {
            return client.focus().then(() => client.navigate(target.href));
          }
        }
        return self.clients.openWindow(target.href);
      }),
  );
});
