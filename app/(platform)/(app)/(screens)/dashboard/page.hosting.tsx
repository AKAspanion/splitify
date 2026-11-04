import type { Metadata } from "next";

export { default } from "./page";

// The static page has no signed-in content, so its title is what names the screen.
export const metadata: Metadata = { title: "Dashboard" };
