import { Suspense } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { OfflineBanner } from "@/components/offline/offline-banner";
import { Navbar } from "./_components/navbar";
import { NavbarBottom } from "./_components/navbar-bottom";

// The signed-in shell of the hosting build: nothing under it renders until someone is signed in.
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <Navbar />
      <div className="mt-0 sm:mt-16 h-[calc(100vh-73px)] sm:h-[calc(100vh-64px)] overflow-y-auto md:max-w-(--breakpoint-2xl) mx-auto">
        <OfflineBanner />
        <VerifyEmailBanner />
        <Suspense>{children}</Suspense>
      </div>
      <NavbarBottom />
    </RequireAuth>
  );
}
