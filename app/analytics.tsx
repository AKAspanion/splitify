import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

const Analytics: React.FC<{ pId?: string }> = ({ pId }) => {
  // /_vercel/insights does not exist on Firebase Hosting, so the hosting build renders no analytics.
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_BUILD_TARGET === "hosting"
  ) {
    return null;
  }

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  );
};

export default Analytics;
