import dynamic from "next/dynamic";

import { ScreenSkeleton } from "../../_components/screen-skeleton";
import { Suspense } from "react";
import { UserCardLoading } from "../../_components/user-card";

const FriendsList = dynamic(() => import("./friends-list"), {
  loading: () => <ScreenSkeleton card={<UserCardLoading />} />,
});

const FriendsPage = async (props: ServerSideComponentProp) => {
  const keyString = `page=${props.searchParams?.["page"]}&search=${props.searchParams?.["search"]}&&text=${props.searchParams?.["text"]}`;
  return (
    <Suspense
      key={keyString}
      fallback={<ScreenSkeleton card={<UserCardLoading />} />}
    >
      <FriendsList {...props} />
    </Suspense>
  );
};

export default FriendsPage;
