import Link from "next/link";
import { Button } from "@/components/ui/button";

// Firebase Hosting serves this as out/404.html for any path that is not a page.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">
        We couldn&apos;t find that page.
      </h1>
      <Link href="/groups">
        <Button>Go to your groups</Button>
      </Link>
    </main>
  );
}
