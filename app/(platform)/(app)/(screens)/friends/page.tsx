import dynamic from "next/dynamic";
import { ScreenSkeleton } from "../../_components/screen-skeleton";
import { UserCardLoading } from "../../_components/user-card";

const FriendList = dynamic(() => import("./friend-list"), {
  loading: () => <ScreenSkeleton card={<UserCardLoading />} />,
});

const FriendsPage = async () => {
  return <FriendList />;
};

export default FriendsPage;
