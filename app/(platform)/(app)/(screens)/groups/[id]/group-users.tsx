"use client";
import {
  UserAvatars,
  UserAvatarsLoading,
} from "@/app/(platform)/(app)/_components/user-avatars";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useGroupUsers from "@/hooks/use-group-users";

const GroupUsers = ({ id, backUrl }: { id: string; backUrl: string }) => {
  const { users, loading } = useGroupUsers(id);

  const noData = !users || users.length === 0;

  return loading || noData ? (
    <UserAvatarsLoading />
  ) : (
    <UserAvatars
      users={users}
      action={
        <div className="h-10 flex items-center justify-center">
          <Link href={`/groups/${id}/add-member?back=${backUrl}`}>
            <Button variant="ghost" size="icon">
              <PlusCircleIcon className="text-sparkle" />
            </Button>
          </Link>
        </div>
      }
    />
  );
};

export default GroupUsers;
