import Script from "next/script";

/**
 * Google AdSense's script, in production builds that have a publisher id. Rendered by the public pages only, the
 * landing page and the privacy page, never by the root layout: the ad script would otherwise run beside the signed-in
 * app's Auth tokens and saved data (knowledge/decisions/adsense-on-public-pages-only.md).
 */
const Adsense = () => {
  const pId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
  if (process.env.NODE_ENV !== "production" || !pId) return null;

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
