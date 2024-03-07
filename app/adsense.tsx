import Script from "next/script";

const Adsense: React.FC<{ pId?: string }> = ({ pId }) => {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return pId ? (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${pId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  ) : null;
};

export default Adsense;
