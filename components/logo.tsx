import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The logo, linking to `to`. `fullPageLoad` makes it a plain anchor: a public page that may have loaded the ad script
 * leaves by a full page load, so the script can't follow into the app (knowledge/decisions/adsense-on-public-pages-only.md).
 */
export const Logo = (props: { to?: string; fullPageLoad?: boolean }) => {
  const { to = "/", fullPageLoad = false } = props;
  const content = (
    <div className="hover:opacity-75 transition items-center flex gap-2 ">
      <Image
        src="/images/logo.svg"
        className="dark:invert rounded"
        alt="Logo"
        height={30}
        width={30}
      />
      <p className={cn("text-md text-neutral-700 dark:text-neutral-50 pt-0.5")}>
        Splitify
      </p>
    </div>
  );
  return fullPageLoad ? (
    <a className="flex" href={to}>
      {content}
    </a>
  ) : (
    <Link className="flex" href={to}>
      {content}
    </Link>
  );
};
