import { db } from "@/lib/db";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const SettleUsers = async ({
  user1Id,
  user2Id,
}: {
  user1Id: string;
  user2Id: string;
}) => {
  const users = await db.user.findMany({
    where: { id: { in: [user1Id, user2Id] } },
  });

  const user1 = users.find((u) => u.id === user1Id);
  const user2 = users.find((u) => u.id === user2Id);

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
