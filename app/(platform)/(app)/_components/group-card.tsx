import { Group } from "@prisma/client";
import { ListIcon } from "lucide-react";
import Link from "next/link";

type GroupCardProps = {
  group: Group | null;
};

export const GroupCard = (props: GroupCardProps) => {
  const { group } = props;

  return !group ? null : (
    <Link href={`/groups/${group.id}`}>
      <div className="rounded">
        <div className="flex items-stretch gap-4">
          <div className="flex flex-col items-stretch justify-center rounded bg-gradient-to-r from-green-500/40 to-lime-500/40 p-3">
            <ListIcon className="w-8 h-8" />
          </div>
          <div className="flex items-center">
            <div className="flex flex-col">
              <div className="text-md font-semibold">{group?.title || "-"}</div>
              <div className="text-xs font-light">all settled up</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
