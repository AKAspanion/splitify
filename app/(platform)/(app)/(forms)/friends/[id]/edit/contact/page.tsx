import dynamic from "next/dynamic";
import { Suspense } from "react";

const FriendsEditContact = dynamic(() => import("./edit-contact"));

const FriendsEditContactPage = (props: ServerSideComponentProp) => {
  const keyString = `back=${props?.searchParams?.["back"]}`;

  return (
    <Suspense key={keyString}>
      <FriendsEditContact {...props} />
    </Suspense>
  );
};

export default FriendsEditContactPage;
