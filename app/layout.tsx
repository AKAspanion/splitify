import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import { Launch } from "./launch";
import { ThemeProvider } from "@/components/theme/provider";
import Adsense from "./adsense";
import Analytics from "./analytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = siteConfig;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <Script
        strategy="afterInteractive"
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      />
      <Adsense pId={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID} />
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <Suspense>{children}</Suspense>
            <Suspense>
              <Launch />
            </Suspense>
            <Suspense>
              <Toaster />
            </Suspense>
          </Providers>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
