// import { Biometric } from "@/components/biometric/biometric";
import { Suspense } from "react";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>{children}</Suspense>
      <Suspense>{/* <Biometric /> */}</Suspense>
    </>
  );
}
