// Checks the hosting build in out/: which pages exist, then what the Firebase Hosting emulator serves from it.
// Run after `pnpm build`. Exits non-zero on the first failure, with a line naming it.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { host: HOST, port: PORT } = JSON.parse(
  readFileSync(path.join(root, "firebase.json"), "utf8"),
).emulators.hosting;

// Every scripts/hosting-pages/*.json is `{ pages: string[], requests: { path, expectText }[] }`: the files
// `out/` must hold and what the emulator must answer with 200 and that text. Each slice adds its own file.
const manifestDir = path.join(root, "scripts", "hosting-pages");
const readManifests = () =>
  readdirSync(manifestDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const manifest = JSON.parse(
        readFileSync(path.join(manifestDir, name), "utf8"),
      );
      if (!Array.isArray(manifest.pages) || !Array.isArray(manifest.requests)) {
        fail(
          `scripts/hosting-pages/${name} needs "pages" and "requests" lists`,
        );
      }
      return { name, ...manifest };
    });

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

// Phase 2, run inside the emulator.
const checkServed = async () => {
  const base = `http://${HOST}:${PORT}`;
  const get = async (route) => {
    const res = await fetch(base + route);
    return { res, body: await res.text() };
  };
  const expect = (cond, message) => cond || fail(message);

  for (const { name, requests } of readManifests()) {
    for (const { path: route, expectText } of requests) {
      const { res, body } = await get(route);
      expect(
        res.status === 200,
        `${name}: ${route} answered ${res.status}, not 200`,
      );
      expect(
        body.includes(expectText),
        `${name}: ${route} does not contain "${expectText}"`,
      );
    }
  }

  // Any path that is not a page gets the 404 page, with a way back into the app.
  const missing = await get("/no-such-page");
  expect(
    missing.res.status === 404,
    `/no-such-page answered ${missing.res.status}, not 404`,
  );
  expect(
    missing.body.includes("We couldn&#x27;t find that page.") ||
      missing.body.includes("We couldn't find that page."),
    "the 404 page does not say it couldn't find the page",
  );
  expect(
    missing.body.includes('href="/groups"') ||
      missing.body.includes('href="/groups/"'),
    "the 404 page has no link to /groups",
  );

  const assetlinks = await get("/.well-known/assetlinks.json");
  expect(
    assetlinks.res.status === 200,
    "/.well-known/assetlinks.json is not 200",
  );
  expect(
    (assetlinks.res.headers.get("content-type") ?? "").startsWith(
      "application/json",
    ),
    "/.well-known/assetlinks.json is not application/json",
  );

  const staticMatch = (await get("/")).body.match(
    /\/_next\/static\/[^"')\s]+\.js/,
  );
  expect(staticMatch, "/ references no /_next/static/ script");
  const asset = await get(staticMatch[0]);
  expect(asset.res.status === 200, `${staticMatch[0]} is not 200`);

  const headers = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "cross-origin-opener-policy": "same-origin-allow-popups",
  };
  const everyResponse = [
    ["/", await get("/")],
    ["/privacy", await get("/privacy")],
    [staticMatch[0], asset],
  ];
  for (const [route, { res }] of everyResponse) {
    for (const [name, value] of Object.entries(headers)) {
      expect(
        res.headers.get(name) === value,
        `${route}: ${name} is "${res.headers.get(name)}", expected "${value}"`,
      );
    }
  }
  expect(
    asset.res.headers.get("cache-control") ===
      "public, max-age=31536000, immutable",
    `${staticMatch[0]}: cache-control is "${asset.res.headers.get("cache-control")}"`,
  );
  for (const [route, { res }] of everyResponse) {
    const csp = res.headers.get("content-security-policy") ?? "";
    for (const part of [
      "default-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "worker-src 'self'",
      "upgrade-insecure-requests",
    ]) {
      expect(
        csp.includes(part),
        `${route}: content-security-policy lacks "${part}"`,
      );
    }
  }
  const home = (await get("/")).res;
  expect(
    home.headers.get("cache-control") === "no-cache",
    `/: cache-control is "${home.headers.get("cache-control")}", expected no-cache`,
  );
  console.log("OK: hosting build served as specified");
};

if (process.argv[2] === "--served") {
  await checkServed();
  process.exit(0);
}

// Phase 1: what out/ holds.
for (const { name, pages } of readManifests()) {
  for (const file of pages) {
    if (!existsSync(path.join(root, "out", file)))
      fail(`${name}: out/${file} is missing`);
  }
}
// Phase 2: serve out/ with the Hosting emulator and check it from inside.
const config = spawnSync("node", ["scripts/emulator-firebase-config.mjs"], {
  cwd: root,
  stdio: "inherit",
});
if (config.status !== 0) {
  fail(
    `scripts/emulator-firebase-config.mjs failed${config.error ? `: ${config.error.message}` : ""}`,
  );
}
const result = spawnSync(
  path.join(root, "node_modules", ".bin", "firebase"),
  [
    "emulators:exec",
    "--config",
    "firebase.emulators.json",
    "--only",
    "hosting",
    "--project",
    "demo-splitify",
    `node scripts/check-hosting-build.mjs --served`,
  ],
  { cwd: root, stdio: "inherit" },
);
process.exit(result.status ?? 1);
