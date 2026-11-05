import Page from "./page";

export const metadata = { title: "Friend" };

// The one static page every friend id is served from (firebase.json rewrites /friends/* to it).
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function FriendPage() {
  return <Page />;
}
