/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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

// The public pages exported as a static site for Firebase Hosting: only *.hosting.tsx files are routes, so no
// route handler, server action or page.tsx is part of it.
const hostingConfig = {
  ...nextConfig,
  output: "export",
  trailingSlash: true,
  images: { ...nextConfig.images, unoptimized: true },
  pageExtensions: ["hosting.tsx"],
  // The hosting build has no Clerk (no account, no key), so "@clerk/nextjs" points at a signed-out stub.
  turbopack: { resolveAlias: { "@clerk/nextjs": "./lib/clerk-hosting.tsx" } },
};

export default process.env.NEXT_BUILD_TARGET === "hosting"
  ? hostingConfig
  : nextConfig;
