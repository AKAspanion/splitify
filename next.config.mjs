/** @type {import('next').NextConfig} */
const nextConfig = {
  // One static export for Firebase Hosting: only *.hosting.tsx files are routes, so there is no server.
  output: "export",
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

export default nextConfig;
