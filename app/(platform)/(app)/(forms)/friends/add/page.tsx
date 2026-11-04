import { AutoContainer } from "@/components/container/auto-container";

import Search from "./search";
import { resolvePageProps } from "@/utils/page";

const FriendsAddPage = async (pageProps: ServerSidePageProp) => {
  const { searchParams } = await resolvePageProps(pageProps);
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
