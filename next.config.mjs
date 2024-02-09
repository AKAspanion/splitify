/** @type {import('next').NextConfig} */

import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // disable: process.env.NODE_ENV !== "production",
});

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

export default withSerwist(nextConfig);