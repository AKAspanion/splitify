"use client";

import { AutoContainer } from "@/components/container/auto-container";
import { backHref } from "@/components/container/header";
import { useSearchParams } from "next/navigation";
import Search from "./search";

const FriendsAddPage = () => {
  const searchParams = useSearchParams();
  // Only a same-site path is kept: the search's back link and the contact page's `back` both use it.
  const back = searchParams.get("back");
  const backTo = back ? backHref(back, "/friends/") : undefined;
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
