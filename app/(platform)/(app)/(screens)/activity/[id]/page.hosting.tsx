import ActivityDetailsPage from "./page";

export const metadata = { title: "Activity details" };

// The one static page every /activity/<id> request is rewritten to; the browser reads the real id from the URL.
export const generateStaticParams = () => [{ id: "_" }];

export default function HostedActivityDetailsPage() {
  return <ActivityDetailsPage />;
}
