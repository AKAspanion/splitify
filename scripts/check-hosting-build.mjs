// Checks the hosting build in out/: which pages exist, then what the Firebase Hosting emulator serves from it.
// Run after `yarn build:hosting`. Exits non-zero on the first failure, with a line naming it.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 5050;

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
  const base = `http://127.0.0.1:${PORT}`;
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

  const links = await get("/coming-soon");
  for (const href of ["/", "/privacy", "/delete-account"]) {
    expect(
      links.body.includes(`href="${href}"`) ||
        links.body.includes(`href="${href}/"`),
      `/coming-soon has no link to ${href}`,
    );
  }
  expect(
    links.body.includes(
      "We&#x27;re moving Splitify to a faster home. Signing in will be back shortly. Your privacy policy and account deletion pages are still here.",
    ) ||
      links.body.includes(
        "We're moving Splitify to a faster home. Signing in will be back shortly. Your privacy policy and account deletion pages are still here.",
      ),
    "/coming-soon body text is not as specified",
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
    ["/coming-soon", await get("/coming-soon")],
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
// Not built yet: the API, the admin logs and the WebAuthn pages (2c) stay on the coming-soon page.
for (const dir of ["api", "logs", "webauthn"]) {
  if (existsSync(path.join(root, "out", dir)))
    fail(`out/${dir}/ must not exist`);
}

// Phase 2: serve out/ with the Hosting emulator and check it from inside.
const result = spawnSync(
  "npx",
  [
    "--yes",
    "firebase-tools@15.34.2",
    "emulators:exec",
    "--only",
    "hosting",
    "--project",
    "demo-splitify",
    `node scripts/check-hosting-build.mjs --served`,
  ],
  { cwd: root, stdio: "inherit" },
);
process.exit(result.status ?? 1);
