import { Skeleton } from "@/components/ui/skeleton";
import { GROUP_CATEGORY_ICONS, GroupType } from "@/constants/ui";
import { cn } from "@/lib/utils";
import { Group } from "@prisma/client";
import { NotepadText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { boolean } from "zod";

type GroupCardProps = {
  group: Group | null;
  action?: React.ReactNode;
  description?: React.ReactNode;
  compact?: boolean;
};

export const GroupCard = (props: GroupCardProps) => {
  const { group, action, description, compact = false } = props;

  const type = group?.type as GroupType;
  const GroupIcon = GROUP_CATEGORY_ICONS[type] || NotepadText;

  return !group ? null : (
    <Link href={`/groups/${group.id}`}>
      <div className="rounded flex justify-between items-center">
        <div className="flex items-stretch gap-4 ">
          {group?.image_url ? (
            <div
              className={cn("relative rounded overflow-hidden", {
                "w-16 h-16": !compact,
                "w-10 h-10": compact,
              })}
            >
              <Image
                fill
                className="dark:brightness-75"
                style={{ objectFit: "cover" }}
                src={group?.image_url}
                alt="bg image"
              />
              <div
                className={cn("absolute drop-shadow text-white", {
                  "top-3 left-3": !compact,
                  "top-2 left-2": compact,
                })}
              >
                <GroupIcon
                  className={cn({ "w-10 h-10": !compact, "w-6 h-6": compact })}
                />
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
              {group?.description ? (
                <div className="text-xs font-light">{group?.description}</div>
              ) : null}
              {description ? (
                <div className="text-xs font-light">{description}</div>
              ) : null}
            </div>
          </div>
        </div>
        {action ? action : null}
      </div>
    </Link>
  );
};

export const GroupCardLoading = ({
  compact = false,
}: {
  compact?: boolean;
}) => {
  return (
    <div className="flex gap-4">
      <Skeleton
        className={cn("rounded", {
          "h-[64px] w-[64px] ": !compact,
          "h-10 w-10 ": compact,
        })}
      />
      <div className="flex flex-col justify-center gap-1">
        <Skeleton className={cn("h-5 w-[150px]")} />
        <Skeleton className={cn("h-4 w-[60px] rounded-md")} />
      </div>
    </div>
  );
};
