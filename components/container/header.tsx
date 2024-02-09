import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowLeftIcon } from "lucide-react";

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
          <Link href={backTo}>
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon />
            </Button>
          </Link>
        ) : null}
        <div className="font-semibold text-lg">{title}</div>
      </div>
      {actions ? <div className="flex gap-4">{actions}</div> : null}
    </div>
  );
};
