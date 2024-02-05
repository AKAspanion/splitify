import { Navbar } from "./_components/navbar";
import { NavbarBottom } from "./_components/navbar-bottom";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      <div className="pt-16">{children}</div>
      <NavbarBottom />
    </div>
  );
}
