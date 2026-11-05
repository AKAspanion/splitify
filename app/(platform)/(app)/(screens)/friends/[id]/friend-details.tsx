"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getYouKeyword } from "@/utils/validate";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NoData } from "@/components/no-data";
import { useAuth } from "@/hooks/use-auth";
import { useRouteIds } from "@/hooks/use-route-ids";
import { toUserMessage } from "@/lib/data/errors";
import { DEFAULT_AVATAR, useFriend } from "@/lib/data/people";
import SharedGroups from "./shared-groups";
import VerifyDetails from "./verify-details";

const FriendDetails = () => {
  const { friendId } = useRouteIds();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const backTo = searchParams.get("back") || "/friends";

  const { data: friend, isPending, error, refetch } = useFriend(friendId);

  const header = <Header title="" backTo={backTo} />;

  if (friendId === null || (!isPending && !error && friend === null))
    return (
      <AutoContainer header={header}>
        <NoData
          title="We couldn't find that. It may have been deleted, or you may not be a member."
          action={
            <Link href="/groups">
              <Button type="button" variant="outline">
                Go to groups
              </Button>
            </Link>
          }
        />
      </AutoContainer>
    );

  if (error)
    return (
      <AutoContainer header={header}>
        <NoData
          title={toUserMessage(error)}
          action={
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      </AutoContainer>
    );

  if (isPending || !friend)
    return (
      <AutoContainer header={header}>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-3 w-[200px]" />
          </div>
        </div>
      </AutoContainer>
    );

  const isYou = user?.uid === friend.id;

  return (
    <AutoContainer header={header}>
      <div className="flex flex-col gap-6">
        <Image
          alt="profile pic"
          width={56}
          height={56}
          className="rounded-full"
          src={friend.imageUrl || DEFAULT_AVATAR}
        />
        <div>
          <div className="">
            {getYouKeyword(user?.uid || "null", friend.id, friend.name || "-")}
          </div>
          <div className="text-sm font-light break-all">{friend.email}</div>
        </div>
        {isYou ? null : (
          <>
            {!friend.signedUp ? <VerifyDetails friend={friend} /> : null}
            <SharedGroups id={friend.id} />
          </>
        )}
      </div>
    </AutoContainer>
  );
};

export default FriendDetails;
