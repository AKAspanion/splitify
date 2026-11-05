import Page from "./page";

export const metadata = { title: "Update contact" };

// The one static page every friend id is served from (firebase.json rewrites /friends/*/edit/contact to it).
export function generateStaticParams() {
  return [{ id: "_" }];
}

// A wrapper, not a bare re-export: a client page re-exported next to generateStaticParams isn't seen by the export.
export default function EditContactPage() {
  return <Page />;
}
