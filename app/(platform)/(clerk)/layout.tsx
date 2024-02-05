import { ClerkProvider } from "@clerk/nextjs";

export default function ClerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex items-center justify-center min-h-screen">
      {children}
    </div>
  );
}
