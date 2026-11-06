"use client";

import Script from "next/script";
import { useAuth } from "@/hooks/use-auth";
import { adsAllowedOn } from "@/lib/ads/ads-allowed";

/**
 * The page this document first loaded, read once when the module loads in the browser; null while prerendering. A
 * document that arrived on `/auth/action/` keeps that URL, one-time code and all, in its navigation entry
 * (`performance`) after a client-side navigation away, so it never gets the ad script, wherever it goes.
 */
const FIRST_PATH =
  typeof window === "undefined" ? null : window.location.pathname;

/**
 * Google AdSense's script, in production builds that have a publisher id. Rendered by the public pages only, the
 * landing page and the privacy page, never by the root layout: the ad script would otherwise run beside the signed-in
 * app's Auth tokens and saved data (knowledge/decisions/adsense-on-public-pages-only.md).
 *
 * Only for a signed-out visitor: IndexedDB, where Firebase keeps a signed-in person's tokens, is shared by the whole
 * origin, so the script waits until Auth reports nobody signed in. A script next/script has loaded can't be unloaded,
 * so the public pages leave for the app and the sign-in screens by a full page load.
 */
const Adsense = () => {
  const { status } = useAuth();
  const pId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
  if (process.env.NODE_ENV !== "production" || !pId) return null;
  if (status !== "signed-out") return null;
  if (FIRST_PATH !== null && !adsAllowedOn(FIRST_PATH)) return null;

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
