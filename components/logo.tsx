import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";

import { cn } from "@/lib/utils";

export const Logo = () => {
  return (
    <Link className="hidden md:flex" href="/">
      <div className="hover:opacity-75 transition items-center flex gap-2 ">
        <Image
          src="/logo-512x512.webp"
          className="dark:invert rounded"
          alt="Logo"
          height={30}
          width={30}
        />
        <p
          className={cn(
            "text-md text-neutral-700 dark:text-neutral-200 uppercase font-thin"
          )}
        >
          Splitify
        </p>
      </div>
    </Link>
  );
};
