"use client";
import {
  UserAvatars,
  UserAvatarsLoading,
} from "@/app/(platform)/(app)/_components/user-avatars";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useGroupMembers, toUserModel } from "@/lib/data/groups";
import { toUserMessage } from "@/lib/data/errors";

const GroupUsers = ({ id, backUrl }: { id: string; backUrl: string }) => {
  const { data: members, isLoading, error, refetch } = useGroupMembers(id);

  if (error)
    return (
      <div className="flex items-center gap-3 text-sm">
        <span>{toUserMessage(error)}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          Try again
        </Button>
      </div>
    );

  if (isLoading || !members) return <UserAvatarsLoading />;

  return (
    <UserAvatars
      users={members.map(toUserModel)}
      action={
        <div className="h-10 flex items-center justify-center">
          <Link href={`/groups/${id}/add-member?back=${backUrl}`}>
            <Button variant="ghost" size="icon" aria-label="Add members">
              <PlusCircleIcon className="text-sparkle" />
            </Button>
          </Link>
        </div>
      }
    />
  );
};

export default GroupUsers;
