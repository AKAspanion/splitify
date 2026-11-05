import Page from "./page";

export const metadata = { title: "Settlement" };

// Static export builds one placeholder page; firebase.json rewrites every id to it, and the screen reads the
// real id from the address.
export const generateStaticParams = () => [{ id: "_" }];

export default function Hosted() {
  return <Page />;
}
