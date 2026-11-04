import Link from "next/link";
import { Header } from "@/components/container/header";
import { Button } from "@/components/ui/button";

const ComingSoonPage = () => {
  return (
    <div className="flex items-center justify-center flex-col">
      <div className="p-6 w-full">
        <Header title="Splitify is coming back soon" />
      </div>
      <article className="w-full max-w-2xl space-y-6 px-6 pb-12 text-sm leading-relaxed">
        <p className="text-muted-foreground">
          We&apos;re moving Splitify to a faster home. Signing in will be back
          shortly. Your privacy policy and account deletion pages are still
          here.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/">
            <Button>Home</Button>
          </Link>
          <Link href="/privacy">
            <Button variant="outline">Privacy policy</Button>
          </Link>
          <Link href="/delete-account">
            <Button variant="outline">Delete your account</Button>
          </Link>
        </div>
      </article>
    </div>
  );
};

export default ComingSoonPage;
