"use client";

// Stands in for "@clerk/nextjs" in the hosting build only (see next.config.mjs): the same client components from
// the client-only SDK, without the server action that @clerk/nextjs's ClerkProvider imports.
import { ClerkProvider as ReactClerkProvider } from "@clerk/react";
import type { ComponentProps } from "react";

export * from "@clerk/react";

export const ClerkProvider = (
  props: Omit<ComponentProps<typeof ReactClerkProvider>, "publishableKey">,
) => (
  <ReactClerkProvider
    {...props}
    publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  />
);
