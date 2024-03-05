import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { db } from "@/lib/db";
import Image from "next/image";
import dynamic from "next/dynamic";
import { GroupCardLoading } from "../../../_components/group-card";
import { Skeleton } from "@/components/ui/skeleton";
import VerifyDetails from "./verify-details";

const SharedGroups = dynamic(() => import("./shared-groups"), {
  loading: () => (
    <div>
      <Skeleton className="mb-3 h-6 w-[100px]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <GroupCardLoading key={i} compact />
        ))}
      </div>
    </div>
  ),
});

const FriendDetails = async ({ params }: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const friend = await db.user.findUnique({ where: { id } });

  const isVerified = friend?.id?.startsWith("sp") ? friend?.fromClerk : true;

  return (
    <AutoContainer header={<Header title="" backTo={`/friends`} />}>
      <div className="flex flex-col gap-6">
        <Image
          alt="profile pic"
          width={56}
          height={56}
          className="rounded-full"
          src={friend?.profile_image_url || ""}
        />
        <div>
          <div className="">{friend?.name}</div>
          <div className="text-sm font-light">{friend?.email}</div>
        </div>
        {!isVerified ? <VerifyDetails friend={friend} /> : null}
        <SharedGroups id={id} />
      </div>
    </AutoContainer>
  );
};

export default FriendDetails;
