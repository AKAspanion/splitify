import { Suspense } from "react";
import Adsense from "@/app/adsense";
import { Footer } from "./_components/footer";
import { Navbar } from "./_components/navbar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-full">
      {/* Ads load on the public pages only: here and on the privacy page. */}
      <Adsense />
      <Suspense>
        <Navbar />
      </Suspense>
      <div className="pt-40 pb-20 min-h-screen">
        <Suspense>{children}</Suspense>
      </div>
      <Suspense>
        <Footer />
      </Suspense>
    </main>
  );
}
