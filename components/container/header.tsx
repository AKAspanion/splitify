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
};

export const Header = (props: HeaderProps) => {
  const { backTo, actions, title } = props;
  return (
    <div className="flex w-full gap-6 justify-between items-center">
      <div className="flex gap-4 items-center">
        {backTo ? (
          // Many pages pass a `back` query value through: anything but a same-site path goes to the groups.
          <Link href={safeNextPath(backTo)}>
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon />
            </Button>
          </Link>
        ) : null}
        <div className="font-semibold text-lg line-clamp-1">{title}</div>
      </div>
      {actions ? <div className="flex gap-4">{actions}</div> : null}
    </div>
  );
};
