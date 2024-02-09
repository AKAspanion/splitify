"use client";

import { AppProgressBar } from "next-nprogress-bar";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
      }}
    >
      <AppProgressBar
        height="2px"
        color="#355714"
        options={{ showSpinner: false }}
        shallowRouting
      />
      {children}
    </ClerkProvider>
  );
}
