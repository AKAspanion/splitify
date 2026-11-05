/* Splitify's one service worker: it serves the app shell offline and shows push notifications while no tab is open.
 *
 * Offline: `/sw-manifest.js` lists every file the export holds and a version that changes with any of them; install
 * precaches them into the cache named for that version, and activation deletes the older caches. Pages go to the
 * network first (a navigation waits 3 seconds) and fall back to the cache; the build's static files come from the cache first. The decisions are pure
 * functions in `/sw-routing.js` (lib/offline/sw-routing.js). The worker never caches `/api/**` or another origin.
 * Both imported scripts are revalidated with the worker, so a new build updates it and shows the update toast.
 *
 * Push: a worker cannot import from node_modules, so the Firebase compat scripts come from the CDN, at the version of
 * the `firebase` package installed in this repository (keep them in step). The public web config is read from this
 * worker's own URL: lib/push/register.ts registers it with `?apiKey=...&projectId=...&appId=...`. */
importScripts("/sw-manifest.js", "/sw-routing.js");

const routing = self.SplitifySwRouting;
const manifest = self.__SPLITIFY_SW_MANIFEST__ || { version: "dev", files: [] };
const CACHE_PREFIX = "splitify-shell-";
const CACHE_NAME = CACHE_PREFIX + manifest.version;

// Characters like `$` and `!` in the export's file names stay as they are: Hosting matches them unencoded.
const toUrl = (file) =>
  "/" +
  file
    .split("/")
    .map((part) => encodeURI(part).replace(/[?#]/g, encodeURIComponent))
    .join("/");

// A response that followed a redirect (Hosting sends `/groups/index.html` to `/groups/`) cannot answer a navigation:
// copy it into a plain one.
async function plain(response) {
  if (!response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

// A page is held under its file (`/groups/index.html`, `/404.html`) and asked for by its path (`/groups/`, `/404/`).
// Hosting redirects the file URL to the path, so the path is what is fetched.
function pageUrl(file) {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return toUrl(file).slice(0, -"index.html".length);
  return toUrl(file.slice(0, -".html".length)) + "/";
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    manifest.files.map(async (file) => {
      const url = toUrl(file);
      const isPage = file.endsWith(".html");
      const fetched = await fetch(isPage ? pageUrl(file) : url, { cache: "reload" });
      if (!fetched.ok) throw new Error("precache " + fetched.status);
      const response = await plain(fetched);
      if (isPage) await cache.put(pageUrl(file), response.clone());
      await cache.put(url, response);
    }),
  );
}

self.addEventListener("install", (event) => {
  // The new worker waits until the page asks for it (SKIP_WAITING), so a reload is the person's choice.
  event.waitUntil(precache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  // Only a page of this site may tell the worker to take over.
  if (event.origin !== self.location.origin) return;
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function remember(request, response) {
  if (!response.ok || response.type !== "basic") return;
  try {
    await (await caches.open(CACHE_NAME)).put(request, await plain(response));
  } catch (error) {
    console.error("[sw] cache write failed: " + (error && error.name));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await remember(request, response.clone());
  return response;
}

// A navigation that gets no answer in this long is answered from the cache instead (a connection that is up but
// does not carry data would otherwise leave the page blank until the browser gives up).
const NAVIGATION_TIMEOUT_MS = 3000;

async function cachedAnswer(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  if (request.mode === "navigate") {
    return caches.match(routing.fallbackPage(new URL(request.url).pathname));
  }
  return undefined;
}

async function networkFirst(request) {
  const pending = fetch(request);
  try {
    let response;
    if (request.mode === "navigate") {
      const late = Symbol("late");
      const first = await Promise.race([
        pending,
        new Promise((resolve) =>
          setTimeout(() => resolve(late), NAVIGATION_TIMEOUT_MS),
        ),
      ]);
      if (first === late) {
        // Slow: the cached page answers if there is one, and the network's answer still refreshes the cache.
        const cached = await cachedAnswer(request);
        if (cached) {
          pending
            .then((later) => remember(request, later))
            .catch(() => undefined);
          return cached;
        }
        response = await pending;
      } else {
        response = first;
      }
    } else {
      response = await pending;
    }
    await remember(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cachedAnswer(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const strategy = routing.cacheStrategy(request.url, self.location.origin);
  if (strategy === "precache-first") event.respondWith(cacheFirst(request));
  else if (strategy === "network-first-page")
    event.respondWith(networkFirst(request));
});

// Push, best effort: the offline shell works when the Firebase scripts cannot load.
try {
  importScripts(
    "https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js",
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
} catch (error) {
  console.error("[sw] push setup failed: " + (error && error.name));
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
