import dynamic from "next/dynamic";
import { Suspense } from "react";
import { resolvePageProps } from "@/utils/page";

const FriendsEditContact = dynamic(() => import("./edit-contact"));

const FriendsEditContactPage = async (pageProps: ServerSidePageProp) => {
  const props = await resolvePageProps(pageProps);
  const keyString = `back=${props?.searchParams?.["back"]}`;

  return (
    <Suspense key={keyString}>
      <FriendsEditContact {...props} />
    </Suspense>
  );
};

export default FriendsEditContactPage;
