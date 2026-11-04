import type { Metadata } from "next";
import Page from "./page";

export default function HostingPage() {
  return <Page />;
}

// The static page has no signed-in content, so its title is what names the screen.
export const metadata: Metadata = { title: "Update group" };

// One placeholder page for every group: the real id is read from the address in the browser.
export function generateStaticParams() {
  return [{ id: "_" }];
}
