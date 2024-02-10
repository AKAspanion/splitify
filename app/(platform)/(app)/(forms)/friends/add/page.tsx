import { AutoContainer } from "@/components/container/auto-container";

import Search from "./search";

const FriendsAddPage = ({ searchParams }: ServerSideComponentProp) => {
  const backTo = searchParams["back"];
  return (
    <AutoContainer>
      <Search backTo={backTo} />
    </AutoContainer>
  );
};

export default FriendsAddPage;
