"use client";
import {
  UserAvatars,
  UserAvatarsLoading,
} from "@/app/(platform)/(app)/_components/user-avatars";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { GET_METHOD_CALLBACK } from "@/utils/api";

const GroupUsers = ({ id, backUrl }: { id: string; backUrl: string }) => {
  // const { users, loading } = useGroupUsers(id);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: [`group-users`],
    queryFn: GET_METHOD_CALLBACK(`/api/app/group/${id}/users`, {}),
    enabled: true,
  });

  const noData = !users || users.length === 0;

  return isLoading || noData ? (
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
