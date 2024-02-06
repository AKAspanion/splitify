import { Group } from "@prisma/client";
import { ListIcon } from "lucide-react";
import Link from "next/link";

type GroupCardProps = {
  group: Group;
};

export const GroupCard = (props: GroupCardProps) => {
  const { group } = props;

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="rounded">
        <div className="flex items-stretch gap-4">
          <div className="flex flex-col items-stretch justify-center rounded bg-gradient-to-r from-green-500/40 to-lime-500/40 p-4">
            <ListIcon className="w-12 h-12" />
          </div>
          <div className="flex items-center">
            <div className="flex flex-col">
              <div className="text-md font-semibold">{group?.title || "-"}</div>
              {group?.type ? (
                <div className="text-sm">{group?.type}</div>
              ) : null}
              <div className="text-xs font-light pt-1">all settled up</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
