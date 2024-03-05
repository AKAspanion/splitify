import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";

import Form from "./form";
import { urlEncode } from "@/utils/func";

const FriendsAddContactPage = ({ searchParams }: ServerSideComponentProp) => {
  const backTo = searchParams["back"];
  const groupId = searchParams["groupId"];
  const mail = searchParams["email"];

  const to = urlEncode({
    path: "/friends/add",
    query: { groupId: groupId || "", back: backTo, email: mail },
  });

  const keyString = `back=${searchParams?.["back"]}&groupId=${searchParams?.["groupId"]}&&email=${searchParams?.["email"]}`;

  return (
    <AutoContainer
      key={keyString}
      header={<Header title="Add new contact" backTo={to} />}
    >
      <Form backTo={backTo} groupId={groupId} mail={mail} />
    </AutoContainer>
  );
};

export default FriendsAddContactPage;
