import { AutoContainer } from "@/components/container/auto-container";

import Search from "./search";

const FriendsAddPage = ({ searchParams }: ServerSideComponentProp) => {
  const backTo = searchParams["back"];
  const groupId = searchParams["groupId"];
  return (
    <AutoContainer>
      <Search backTo={backTo} groupId={groupId} />
    </AutoContainer>
  );
};

export default FriendsAddPage;
