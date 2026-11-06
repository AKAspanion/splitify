import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { safeNextPath } from "@/lib/auth/next-path";

/**
 * A link's `back` query value when it is a same-site path, else `fallback`: an off-site, protocol-relative or
 * `javascript:` URL is dropped. safeNextPath returns a path it accepts unchanged.
 */
export function backHref(
  back: string | null | undefined,
  fallback: string,
): string {
  return back && safeNextPath(back) === back ? back : fallback;
}

type HeaderProps = {
  backTo?: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  /**
   * Makes the back link a plain anchor. A public page that loaded the ad script leaves by a full page load, so the
   * script can't follow into the app (knowledge/decisions/adsense-on-public-pages-only.md).
   */
  fullPageLoad?: boolean;
};

export const Header = (props: HeaderProps) => {
  const { backTo, actions, title, fullPageLoad = false } = props;
  const back = backTo ? (
    <Button variant="ghost" size="icon">
      <ArrowLeftIcon />
    </Button>
  ) : null;
  return (
    <div className="flex w-full gap-6 justify-between items-center">
      <div className="flex gap-4 items-center">
        {backTo ? (
          // Many pages pass a `back` query value through: anything but a same-site path goes to the groups.
          fullPageLoad ? (
            <a href={safeNextPath(backTo)}>{back}</a>
          ) : (
            <Link href={safeNextPath(backTo)}>{back}</Link>
          )
        ) : null}
        <div className="font-semibold text-lg line-clamp-1">{title}</div>
      </div>
      {actions ? <div className="flex gap-4">{actions}</div> : null}
    </div>
  );
};
