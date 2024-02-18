import { Group } from "@prisma/client";
import { ListIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type GroupCardProps = {
  group: Group | null;
  description?: React.ReactNode;
};

export const GroupCard = (props: GroupCardProps) => {
  const { group, description } = props;

  return !group ? null : (
    <Link href={`/groups/${group.id}`}>
      <div className="rounded">
        <div className="flex items-stretch gap-4 ">
          {group?.image_url ? (
            <div className="w-16 h-16 relative rounded overflow-hidden">
              <Image
                fill
                style={{ objectFit: "cover" }}
                src={group?.image_url}
                alt="bg image"
              />
            </div>
          ) : (
            <div className="flex flex-col items-stretch justify-center rounded bg-gradient-to-r from-green-500/70 to-lime-500/70 p-3">
              <ListIcon className="w-10 h-10" />
            </div>
          )}
          <div className="flex items-center">
            <div className="flex flex-col">
              <div className="text-md font-semibold">
                {group?.title || "-"}{" "}
              </div>
              {description ? (
                <div className="text-xs font-light">{description}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
