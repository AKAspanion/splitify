"use client";

import { Button } from "@/components/ui/button";

// The page never shows the error's message, which can carry internals. Next already logs a caught error to the
// browser console, and the digest is what ties this page to the server's log of it.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="p-6">
        <h2>Something went wrong.</h2>
        {error?.digest ? (
          <p className="py-4 text-sm">
            Reference: <code>{error.digest}</code>
          </p>
        ) : null}
        <Button onClick={() => reset()}>Try again</Button>
      </body>
    </html>
  );
}
