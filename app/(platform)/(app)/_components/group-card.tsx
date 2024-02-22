import { Skeleton } from "@/components/ui/skeleton";
import { GROUP_CATEGORY_ICONS, GroupType } from "@/constants/ui";
import { Group } from "@prisma/client";
import { ListIcon, NotepadText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type GroupCardProps = {
  group: Group | null;
  description?: React.ReactNode;
};

export const GroupCard = (props: GroupCardProps) => {
  const { group, description } = props;

  const type = group?.type as GroupType;
  const GroupIcon = GROUP_CATEGORY_ICONS[type] || NotepadText;

  return !group ? null : (
    <Link href={`/groups/${group.id}`}>
      <div className="rounded">
        <div className="flex items-stretch gap-4 ">
          {group?.image_url ? (
            <div className="w-16 h-16 relative rounded overflow-hidden">
              <Image
                fill
                className="dark:brightness-75"
                style={{ objectFit: "cover" }}
                src={group?.image_url}
                alt="bg image"
              />
              <div className="absolute top-3 left-3 drop-shadow text-white">
                <GroupIcon className="w-10 h-10" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-stretch justify-center rounded bg-gradient-to-r from-green-500/70 to-lime-500/70 p-3">
              <GroupIcon className="w-10 h-10" />
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

export const GroupCardLoading = () => {
  return (
    <div className="flex space-y-3 gap-4">
      <Skeleton className="h-[64px] w-[64px] rounded" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-5 w-[60px] rounded-full" />
      </div>
    </div>
  );
};
