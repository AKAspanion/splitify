import { Footer } from "./_components/footer";
import { Navbar } from "./_components/navbar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-full">
      <Navbar />
      <div className="pt-40 pb-20 min-h-screen">{children}</div>
      <Footer />
    </main>
  );
}
