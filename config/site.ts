import type { Metadata } from "next";

const APP_NAME = "Splitify";
const APP_DEFAULT_TITLE = "Splitify";
const APP_TITLE_TEMPLATE = "%s - Splitify App";
const APP_DESCRIPTION = "Simplify and manage splits, the easy way!";

export const siteConfig: Metadata = {
  description: APP_DESCRIPTION,
  title: {
    default: APP_NAME,
    template: APP_TITLE_TEMPLATE,
  },
  icons: [
    {
      url: "/images/logo.svg",
      href: "/images/logo.svg",
    },
  ],
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL("https://splitify.spanion.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    images: "/images/ss/desktop-dark.png",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    images: "/images/ss/desktop-dark.png",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};
