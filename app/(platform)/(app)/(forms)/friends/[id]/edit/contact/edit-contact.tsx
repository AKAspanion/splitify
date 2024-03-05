import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";

import Form from "./form";
import { db } from "@/lib/db";

const FriendsEditContact = async ({
  params,
  searchParams,
}: ServerSideComponentProp) => {
  const id = params["id"] || "null";
  const backTo = searchParams["back"];

  const friend = await db.user.findUnique({ where: { id } });

  const to = backTo || `/friends/${friend?.id || ""}`;

  return (
    <AutoContainer header={<Header title="Update contact" backTo={to} />}>
      <Form
        backTo={to}
        id={friend?.id || "null"}
        name={friend?.name || ""}
        mail={friend?.email || ""}
      />
    </AutoContainer>
  );
};

export default FriendsEditContact;
