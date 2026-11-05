import { readFileSync } from "node:fs";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { functionRewrites } from "./scripts/dev-env.mjs";

/** @type {import('next').NextConfig} */
const baseConfig = {
  trailingSlash: true,
  pageExtensions: ["hosting.tsx"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        port: "",
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        port: "",
      },
    ],
  },
};

/**
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
export default function nextConfig(phase) {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    // `next dev` has no Hosting in front of it, and a static export refuses rewrites: so in development only, drop
    // the export and send /api/<function>/** to the Functions emulator, as firebase.json's hosting rewrites do.
    const firebaseJson = JSON.parse(readFileSync("./firebase.json", "utf8"));
    return {
      ...baseConfig,
      rewrites: async () => functionRewrites(firebaseJson, "demo-splitify"),
    };
  }
  // One static export for Firebase Hosting: only *.hosting.tsx files are routes, so there is no server.
  return { ...baseConfig, output: "export" };
}
