import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

const Analytics: React.FC<{ pId?: string }> = ({ pId }) => {
  if (process.env.NODE_ENV !== "production") {
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
