import Image from "next/image";

/**
 * The one centred card every sign-in screen sits in: the mark over the app's name, a muted subtitle, the screen's
 * actions (`children`) and small footer links. It follows the theme the root ThemeProvider picks.
 */
export function AuthCard(props: {
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { subtitle, children, footer } = props;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/images/logo.svg"
            className="dark:invert rounded"
            alt=""
            height={48}
            width={48}
            priority
          />
          <h1 className="text-2xl font-semibold">Splitify</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="space-y-4">{children}</div>
        {footer ? (
          <div className="flex flex-col items-center gap-2 text-sm">
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}
