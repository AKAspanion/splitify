"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { toUser, type GroupMember } from "@/lib/data/expenses";

const SettleUsers = ({
  user1Id,
  user2Id,
  members,
}: {
  user1Id: string;
  user2Id: string;
  members: GroupMember[];
}) => {
  const found1 = members.find((u) => u.id === user1Id);
  const found2 = members.find((u) => u.id === user2Id);
  const user1 = found1 && toUser(found1);
  const user2 = found2 && toUser(found2);

  return user1 && user2 ? (
    <div className="w-full flex flex-col gap-6 items-center justify-between">
      <div className="w-full flex gap-4 items-center justify-between">
        <Image
          alt="profile pic"
          width={56}
          height={56}
          className="rounded-full"
          src={user1?.profile_image_url || ""}
        />
        <div>
          <ArrowRight />
        </div>
        <Image
          alt="profile pic"
          width={56}
          height={56}
          className="rounded-full"
          src={user2?.profile_image_url || ""}
        />
      </div>
      <div className="w-full flex gap-4 items-center justify-between">
        <div className="w-[calc(100%-16px)] text-left truncate">
          {user1?.firstName || user1?.name || "-"}
        </div>
        <div className="text-xs">paid</div>
        <div className="w-[calc(100%-16px)] text-right truncate">
          {user2?.firstName || user2?.name || "-"}
        </div>
      </div>
    </div>
  ) : null;
};

export default SettleUsers;
