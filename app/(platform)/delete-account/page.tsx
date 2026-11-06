import Adsense from "@/app/adsense";
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

const DeleteAccountPage = () => {
  return (
    <div className="flex items-center justify-center flex-col">
      {/* A public page, so it loads the ads (knowledge/decisions/adsense-on-public-pages-only.md). */}
      <Adsense />
      <div className="p-6 w-full">
        <Header backTo="/" fullPageLoad title="Delete your account" />
      </div>
      <article className="w-full max-w-2xl space-y-6 px-6 pb-12 text-sm leading-relaxed">
        <Section title="In the app">
          <p>
            Sign in to Splitify on the web, Android or iOS, open Profile, then
            choose Delete account and confirm. Your account is deleted straight
            away and you are signed out.
          </p>
        </Section>

        <Section title="What is removed">
          <ul className="list-disc space-y-1 pl-5">
            <li>Your sign-in account.</li>
            <li>Your name, email address and profile picture.</li>
            <li>Your passkeys and the feedback you sent.</li>
            <li>Your friendships, in both directions.</li>
            <li>
              Any group that only you belonged to, with its expenses and
              activity.
            </li>
          </ul>
        </Section>

        <Section title="What other members keep">
          <p>
            Groups you shared with other people stay, along with their expenses,
            payments and splits, so everyone&apos;s balances still add up. Your
            name on them becomes &quot;Deleted user&quot;. Contacts you added
            are other people&apos;s records and stay.
          </p>
        </Section>

        <Section title="If you can't sign in">
          <p>
            Email{" "}
            <a className="underline" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>{" "}
            from the email address your account uses, and ask for your account
            to be deleted.
          </p>
        </Section>

        <p>
          See also our{" "}
          <a className="underline" href="/privacy">
            privacy policy
          </a>
          .
        </p>
      </article>
    </div>
  );
};

export default DeleteAccountPage;
