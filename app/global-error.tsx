"use client";

import { Button } from "@/components/ui/button";

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
        <h2>Something went wrong!</h2>
        <code className="py-4">{error?.message}</code>
        <Button onClick={() => reset()}>Try again</Button>
      </body>
    </html>
  );
}
