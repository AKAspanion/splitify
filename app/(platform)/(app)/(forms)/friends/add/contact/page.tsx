"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { useSearchParams } from "next/navigation";
import { peopleHref } from "@/lib/data/people";
import Form from "./form";

const FriendsAddContactPage = () => {
  const searchParams = useSearchParams();
  const backTo = searchParams.get("back") || undefined;
  const groupId = searchParams.get("groupId") || undefined;
  const mail = searchParams.get("email") || undefined;

  const to = peopleHref("/friends/add", {
    groupId,
    back: backTo,
    email: mail,
  });

  const keyString = `back=${backTo}&groupId=${groupId}&email=${mail}`;

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
