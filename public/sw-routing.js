// The service worker's routing decisions, as pure functions. A classic worker loads this with importScripts, so there
// is no `export`: it sets `self.SplitifySwRouting` there and `module.exports` where there is a module system (the
// tests). `scripts/build-sw.mjs` copies it to `out/sw-routing.js`.

/** Pages the export holds without a dynamic segment (every `index.html` under `out/` that no rewrite stands in for). */
const STATIC_PAGES = new Set([
  "/",
  "/groups/",
  "/groups/add/",
  "/friends/",
  "/friends/add/",
  "/friends/add/contact/",
  "/activity/",
  "/dashboard/",
  "/profile/",
  "/privacy/",
  "/delete-account/",
  "/expense/add/",
  "/feedback/add/",
  "/webauthn/register/",
  "/sign-in/",
  "/sign-up/",
  "/forgot-password/",
]);

/** The same patterns as `hosting.rewrites` in firebase.json (`*` is one path segment), most specific first. */
const REWRITES = [
  ["/groups/*/expense/*/", "/groups/_/expense/_/index.html"],
  ["/groups/*/expense/", "/groups/_/expense/index.html"],
  ["/groups/*/edit/", "/groups/_/edit/index.html"],
  ["/groups/*/settle/", "/groups/_/settle/index.html"],
  ["/groups/*/settings/", "/groups/_/settings/index.html"],
  ["/groups/*/add-member/", "/groups/_/add-member/index.html"],
  ["/groups/*/activity/", "/groups/_/activity/index.html"],
  ["/groups/*/", "/groups/_/index.html"],
  ["/expense/*/edit/", "/expense/_/edit/index.html"],
  ["/friends/*/edit/contact/", "/friends/_/edit/contact/index.html"],
  ["/friends/*/", "/friends/_/index.html"],
  ["/activity/*/", "/activity/_/index.html"],
].map(([pattern, destination]) => ({
  regex: new RegExp("^" + pattern.replace(/\*/g, "[^/]+") + "$"),
  destination,
}));

const STATIC_FILE =
  /\.(?:js|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/i;

/**
 * How the worker answers a request: `precache-first` for the build's static files, `network-first-page` for pages
 * (and the version manifest) with the cache as the offline fallback, `bypass` for everything it must never touch:
 * the API, the worker itself, Firebase's reserved paths and any other origin.
 */
function cacheStrategy(url, origin) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "bypass";
  }
  if (parsed.origin !== origin) return "bypass";
  const path = parsed.pathname;
  if (path === "/api" || path.startsWith("/api/")) return "bypass";
  if (path.startsWith("/__/") || path.startsWith("/.well-known/"))
    return "bypass";
  if (path === "/sw.js") return "bypass";
  if (path.startsWith("/_next/static/") || path.startsWith("/images/"))
    return "precache-first";
  if (STATIC_FILE.test(path) && path !== "/sw-manifest.js")
    return "precache-first";
  return "network-first-page";
}

/** The cached page that stands in for a path, by the rules firebase.json rewrites with; `/404.html` for no match. */
function fallbackPage(pathname) {
  const path = pathname.endsWith("/") ? pathname : pathname + "/";
  for (const { regex, destination } of REWRITES) {
    if (regex.test(path)) return destination;
  }
  if (STATIC_PAGES.has(path))
    return path === "/" ? "/index.html" : path + "index.html";
  return "/404.html";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { cacheStrategy, fallbackPage };
} else {
  self.SplitifySwRouting = { cacheStrategy, fallbackPage };
}
