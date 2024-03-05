import { AutoContainer } from "@/components/container/auto-container";

import Search from "./search";

const FriendsAddPage = ({ searchParams }: ServerSideComponentProp) => {
  const backTo = searchParams["back"];
  const groupId = searchParams["groupId"];
  const mail = searchParams["email"];

  const keyString = `back=${searchParams?.["back"]}&groupId=${searchParams?.["groupId"]}&&email=${searchParams?.["email"]}`;

  return (
    <AutoContainer key={keyString}>
      <Search backTo={backTo} mail={mail} groupId={groupId} />
    </AutoContainer>
  );
};

export default FriendsAddPage;
