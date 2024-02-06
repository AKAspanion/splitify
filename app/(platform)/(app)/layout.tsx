import { Navbar } from "./_components/navbar";
import { NavbarBottom } from "./_components/navbar-bottom";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="mt-16 h-[calc(100vh-64px-73px)] sm:h-[calc(100vh-64px)] overflow-y-auto">
        {children}
      </div>
      <NavbarBottom />
    </>
  );
}
