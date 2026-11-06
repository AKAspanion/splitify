"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { backHref, Header } from "@/components/container/header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NoData } from "@/components/no-data";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouteIds } from "@/hooks/use-route-ids";
import { toUserMessage } from "@/lib/data/errors";
import { useFriend } from "@/lib/data/people";
import Form from "./form";

const FriendsEditContact = () => {
  const { friendId } = useRouteIds();
  const searchParams = useSearchParams();

  const { data: friend, isPending, error, refetch } = useFriend(friendId);

  // Where the back link and a save go: the link's `back` only when it is a same-site path.
  const to = backHref(
    searchParams.get("back"),
    friendId ? `/friends/${friendId}/` : "/friends/",
  );
  const header = <Header title="Update contact" backTo={to} />;

  // Only a contact (someone who hasn't signed up) can be edited: anyone else is shown as missing.
  const missing =
    friendId === null ||
    (!isPending && !error && (friend === null || friend?.signedUp));

  return (
    <AutoContainer header={header}>
      {missing ? (
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
      ) : error ? (
        <NoData
          title={toUserMessage(error)}
          action={
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : isPending || !friend ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Form
          key={friend.id}
          backTo={to}
          id={friend.id}
          name={friend.name || ""}
          mail={friend.email}
        />
      )}
    </AutoContainer>
  );
};

export default FriendsEditContact;
