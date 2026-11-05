"use client";

import { Suspense } from "react";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";
import { UserCardLoading } from "@/app/(platform)/(app)/_components/user-card";
import FriendsList from "./friends-list";

const FriendsPage = () => {
  return (
    <Suspense fallback={<ScreenSkeleton card={<UserCardLoading />} />}>
      <FriendsList />
    </Suspense>
  );
};

export default FriendsPage;
