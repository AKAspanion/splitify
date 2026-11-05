"use client";

import { AppProgressBar } from "next-nprogress-bar";
import { AuthProvider } from "./auth/auth-provider";
import ConfirmProvider from "./confirm/ConfirmContext";
import { Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  // One client for the page's life: a client made on every render (the theme resolves after the first one)
  // leaves each query watching the old cache, so an invalidation after a write would reach nobody.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <>
      <Suspense>
        <AppProgressBar
          height="3px"
          color="#32CD32"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </Suspense>
      <AuthProvider>
        <Suspense>
          <QueryClientProvider client={queryClient}>
            <ConfirmProvider>{children}</ConfirmProvider>
          </QueryClientProvider>
        </Suspense>
      </AuthProvider>
    </>
  );
}
