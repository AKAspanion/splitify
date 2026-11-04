import dynamic from "next/dynamic";
import { Suspense } from "react";
import { resolvePageProps } from "@/utils/page";

const FriendDetails = dynamic(() => import("./friend-details"));

const FriendDetailsPage = async (pageProps: ServerSidePageProp) => {
  const props = await resolvePageProps(pageProps);
  return (
    <Suspense>
      <FriendDetails {...props} />
    </Suspense>
  );
};

export default FriendDetailsPage;
