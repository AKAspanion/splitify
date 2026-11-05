"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { useSearchParams } from "next/navigation";
import Search from "./search";

const FriendsAddPage = () => {
  const searchParams = useSearchParams();
  const backTo = searchParams.get("back") || undefined;
  const groupId = searchParams.get("groupId") || undefined;
  const mail = searchParams.get("email") || undefined;

  const keyString = `back=${backTo}&groupId=${groupId}&email=${mail}`;

  return (
    <AutoContainer key={keyString}>
      <Search backTo={backTo} mail={mail} groupId={groupId} />
    </AutoContainer>
  );
};

export default FriendsAddPage;
