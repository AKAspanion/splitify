import dynamic from "next/dynamic";
import { Suspense } from "react";

const FriendDetails = dynamic(() => import("./friend-details"));

const FriendDetailsPage = (props: ServerSideComponentProp) => {
  return (
    <Suspense>
      <FriendDetails {...props} />
    </Suspense>
  );
};

export default FriendDetailsPage;
