import { Suspense } from "react";
import { Footer } from "./_components/footer";
import { Navbar } from "./_components/navbar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-full">
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
