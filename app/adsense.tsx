"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { adsAllowedOn } from "@/lib/ads/ads-allowed";

/**
 * The AdSense script, in production only. Left out of pages whose URL can carry a one-time code (`adsAllowedOn`), so
 * a third-party script never reads it from the address bar.
 */
const Adsense: React.FC<{ pId?: string }> = ({ pId }) => {
  const pathname = usePathname();

  if (process.env.NODE_ENV !== "production") {
    return null;
  }
  if (!pId || !adsAllowedOn(pathname)) {
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
