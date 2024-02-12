import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export const Logo = (props: { to?: string }) => {
  const { to = "/" } = props;
  return (
    <Link className="flex" href={to}>
      <div className="hover:opacity-75 transition items-center flex gap-2 ">
        <Image
          src="/images/logo.svg"
          className="dark:invert rounded"
          alt="Logo"
          height={30}
          width={30}
        />
        <p
          className={cn("text-md text-neutral-700 dark:text-neutral-50 pt-0.5")}
        >
          Splitify
        </p>
      </div>
    </Link>
  );
};
