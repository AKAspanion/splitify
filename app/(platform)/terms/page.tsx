import { Header } from "@/components/container/header";

const CONTACT = "panditankit1995@gmail.com";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

const TermsPage = () => {
  return (
    <div className="flex items-center justify-center flex-col">
      {/* Public, but no <Adsense />: a terms page is not an ad surface (knowledge/decisions/adsense-on-privacy-and-delete-account-pages.md). */}
      <div className="p-6 w-full">
        <Header backTo="/" fullPageLoad title="Terms of Service" />
      </div>
      <article className="w-full max-w-2xl space-y-6 px-6 pb-12 text-sm leading-relaxed">
        <p className="text-muted-foreground">
          Effective date: 17 November 2026
        </p>

        <Section title="Agreeing to these terms">
          <p>
            By using Splitify, on the web at splitify.spanion.in or in the
            Android and iOS apps, you agree to these terms and to our{" "}
            <a className="underline" href="/privacy/">
              privacy policy
            </a>
            . If you do not agree, do not use Splitify.
          </p>
        </Section>

        <Section title="What Splitify does">
          <p>
            Splitify records shared expenses and who owes whom. It does not
            move, hold or send money. Settling up happens outside the app.
          </p>
        </Section>

        <Section title="Your account">
          <ul className="list-disc space-y-1 pl-5">
            <li>You must be 13 or older to use Splitify.</li>
            <li>Keep your account secure.</li>
            <li>You are responsible for what happens under your account.</li>
          </ul>
        </Section>

        <Section title="What you enter">
          <ul className="list-disc space-y-1 pl-5">
            <li>You own the content you enter.</li>
            <li>The members of a group see what you enter in that group.</li>
            <li>
              You let Splitify store your content and show it to those members,
              so the app works.
            </li>
            <li>
              Enter only what you have the right to share, including the names
              and email addresses of your contacts.
            </li>
          </ul>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>use Splitify for anything unlawful;</li>
            <li>abuse or harass other members;</li>
            <li>
              try to break, overload or get around the security of the app;
            </li>
            <li>access other people&apos;s data.</li>
          </ul>
        </Section>

        <Section title="Advertising">
          <p>
            The public pages show ads from Google AdSense, as the{" "}
            <a className="underline" href="/privacy/">
              privacy policy
            </a>{" "}
            describes.
          </p>
        </Section>

        <Section title="Availability and changes">
          <p>
            Splitify is provided &quot;as is&quot; and &quot;as available&quot;.
            We may change or stop features. We do not promise that it is
            error-free or always available, so check the balances before you
            settle up.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            To the extent the law allows, Splitify is not liable for indirect or
            consequential losses, or for amounts that are recorded wrongly.
          </p>
        </Section>

        <Section title="Ending your account">
          <p>
            You can delete your account at any time, as described at{" "}
            <a className="underline" href="/delete-account/">
              /delete-account
            </a>
            . We may suspend an account that breaks these terms.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            If we change these terms, we change the effective date above. If you
            keep using Splitify, you accept the changed terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Email{" "}
            <a className="underline" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>
            .
          </p>
        </Section>
      </article>
    </div>
  );
};

export default TermsPage;
