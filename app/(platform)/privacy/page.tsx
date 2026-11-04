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

const PrivacyPage = () => {
  return (
    <div className="flex items-center justify-center flex-col">
      <div className="p-6 w-full">
        <Header backTo="/" title="Privacy Policy" />
      </div>
      <article className="w-full max-w-2xl space-y-6 px-6 pb-12 text-sm leading-relaxed">
        <p className="text-muted-foreground">Effective date: 4 November 2026</p>

        <Section title="Who we are">
          <p>
            Splitify helps people split shared expenses in groups. It is
            available on the web at splitify.spanion.in and as Android and iOS
            apps. This policy covers all three.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-1 pl-5">
            <li>Your name, email address and profile picture, from sign-up.</li>
            <li>
              The groups, expenses, payments, splits and settlements you enter.
            </li>
            <li>The names and email addresses of contacts you add.</li>
            <li>Feedback you send us.</li>
            <li>
              A passkey&apos;s public key, when you turn on biometric lock.
            </li>
            <li>A push subscription id, when you allow notifications.</li>
            <li>Page views and performance measurements.</li>
          </ul>
        </Section>

        <Section title="Why we use it">
          <p>
            We use it to run the app, to send the notifications you allow, and
            to understand how the app is used and how well it performs. We do
            not sell your data.
          </p>
        </Section>

        <Section title="Who handles it for us">
          <ul className="list-disc space-y-1 pl-5">
            <li>Clerk handles accounts and sign-in.</li>
            <li>
              Vercel provides hosting, analytics and performance measurement.
            </li>
            <li>OneSignal sends push notifications.</li>
            <li>UploadThing stores image uploads.</li>
            <li>Google AdSense may show ads and use cookies to do so.</li>
          </ul>
        </Section>

        <Section title="What other members can see">
          <p>
            What you enter in a group is visible to the members of that group.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your data while your account exists. When you delete your
            account, it is anonymised: your name, email address, profile
            picture, passkeys and feedback are removed, and the expenses you
            shared with other people stay in their groups under the name
            &quot;Deleted user&quot;. A group that only you belonged to is
            deleted.
          </p>
        </Section>

        <Section title="Deleting your account">
          <p>
            You can delete your account in the app, under Profile, then Delete
            account, or as described at{" "}
            <a className="underline" href="/delete-account">
              /delete-account
            </a>
            .
          </p>
        </Section>

        <Section title="Children">
          <p>
            Splitify is not intended for anyone under 13. We do not knowingly
            collect personal information from children.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy? Email{" "}
            <a className="underline" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>
            .
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>If we change this policy, we change the effective date above.</p>
        </Section>
      </article>
    </div>
  );
};

export default PrivacyPage;
