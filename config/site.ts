const APP_NAME = "Splitify";
const APP_DEFAULT_TITLE = "Splitify";
const APP_TITLE_TEMPLATE = "%s - Splitify App";
const APP_DESCRIPTION = "Simplify and manage splits, the easy way!";

export const siteConfig = {
  name: APP_NAME,
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
  metadata: {
    applicationName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: APP_DEFAULT_TITLE,
      // startUpImage: [],
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      description: APP_DESCRIPTION,
    },
    twitter: {
      card: "summary",
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      description: APP_DESCRIPTION,
    },
  },
};
