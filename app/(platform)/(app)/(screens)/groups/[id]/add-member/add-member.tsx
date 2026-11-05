"use client";

import {
  UserCard,
  UserCardLoading,
} from "@/app/(platform)/(app)/_components/user-card";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";
import { AutoContainer } from "@/components/container/auto-container";
import { CheckIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Action } from "./action";
import { Header } from "@/components/container/header";
import { ListItem } from "@/components/list-item";
import { OnlineOnly } from "@/components/offline/online-only";
import { useRouteIds } from "@/hooks/use-route-ids";
import {
  toUserModel,
  useFriendsToAdd,
  useGroup,
  useGroupMembers,
} from "@/lib/data/groups";
import { urlEncode } from "@/utils/func";
import { GroupNotFound, LoadError } from "../_components/group-states";

const AddMember = () => {
  const { groupId: id } = useRouteIds();
  const searchParams = Object.fromEntries(useSearchParams().entries());
  const backTo = searchParams["back"];

  const group = useGroup(id);
  const members = useGroupMembers(id);
  const friends = useFriendsToAdd();

  const backUrl = urlEncode({
    path: `/groups/${id}/add-member`,
    query: searchParams,
  });

  const addFriendUrl = urlEncode({
    path: `/friends/add`,
    query: { groupId: id ?? "", back: backUrl },
  });

  const backToUrl = urlEncode({
    path: backTo ? backTo : `/groups/${id}/settings`,
  });

  const header = <Header backTo={backToUrl} title="Add members to group" />;

  if (id === null)
    return (
      <AutoContainer header={header}>
        <GroupNotFound />
      </AutoContainer>
    );

  if (group.isLoading || members.isLoading || friends.isLoading)
    return <ScreenSkeleton card={<UserCardLoading />} />;

  const error = group.error ?? members.error ?? friends.error;
  if (error)
    return (
      <AutoContainer header={header}>
        <LoadError
          error={error}
          onRetry={() => {
            group.refetch();
            members.refetch();
            friends.refetch();
          }}
        />
      </AutoContainer>
    );

  if (!group.data)
    return (
      <AutoContainer header={header}>
        <GroupNotFound />
      </AutoContainer>
    );

  const memberIds = new Set((members.data ?? []).map((m) => m.id));
  const friendsNotInGroup = (friends.data ?? []).filter(
    (f) => !memberIds.has(f.id),
  );
  const friendsInGroup = (friends.data ?? []).filter((f) =>
    memberIds.has(f.id),
  );

  return (
    <AutoContainer header={header}>
      <div className="pb-6 flex flex-col gap-6">
        <OnlineOnly>
          {(offline) => (
            <>
              {offline ? (
                <div aria-disabled className="opacity-50 cursor-not-allowed">
                  <ListItem title="Add a friend" icon={<UserPlusIcon />} />
                </div>
              ) : (
                <Link href={addFriendUrl}>
                  <ListItem title="Add a friend" icon={<UserPlusIcon />} />
                </Link>
              )}
              {/* A disabled fieldset disables every button inside it. */}
              <fieldset disabled={offline} className="contents">
                {friendsNotInGroup.map((d) => (
                  <UserCard
                    user={toUserModel(d)}
                    key={d.id}
                    actions={<Action groupId={id} memberId={d.id} />}
                  />
                ))}
              </fieldset>
            </>
          )}
        </OnlineOnly>
        <div>
          {friendsInGroup.length === 0 ? null : (
            <div className="pb-3 font-semibold text-normal">Added in group</div>
          )}
          <div className="flex flex-col gap-6">
            {friendsInGroup.map((d) => (
              <UserCard
                user={toUserModel(d)}
                key={d.id}
                disabled
                actions={
                  <div className="p-2">
                    <CheckIcon className="text-green-500" />
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </AutoContainer>
  );
};

export default AddMember;
