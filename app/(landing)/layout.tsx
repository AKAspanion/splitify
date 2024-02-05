import { Footer } from "./_components/footer";
import { Navbar } from "./_components/navbar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      <Navbar />
      <main className="pt-40 pb-20 min-h-screen">{children}</main>
      <Footer />
    </div>
  );
}
