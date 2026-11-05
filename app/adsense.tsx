"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { adsAllowedFor } from "@/lib/ads/ads-allowed";

/**
 * The page this document first loaded, read once when the module loads in the browser. While prerendering there is
 * no document, and the page being rendered is its first.
 */
const FIRST_PATH =
  typeof window === "undefined" ? null : window.location.pathname;

/**
 * The AdSense script, in production only. Left out of a document whose first page or current page can carry a
 * one-time code (`adsAllowedFor`), so a third-party script never reads it from the address bar or the navigation
 * entry.
 */
const Adsense: React.FC<{ pId?: string }> = ({ pId }) => {
  const pathname = usePathname();

  if (process.env.NODE_ENV !== "production") {
    return null;
  }
  if (!pId || !adsAllowedFor(FIRST_PATH ?? pathname, pathname)) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${pId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
};

export default Adsense;
