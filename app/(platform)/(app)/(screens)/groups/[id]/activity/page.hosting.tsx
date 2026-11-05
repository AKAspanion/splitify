import GroupActivityPage from "./page";

export const metadata = { title: "Group activity" };

// The one static page every /groups/<id>/activity request is rewritten to; the browser reads the real id from the URL.
export const generateStaticParams = () => [{ id: "_" }];

export default function HostedGroupActivityPage() {
  return <GroupActivityPage />;
}
