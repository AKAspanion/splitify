"use client";

import { updateGroupMember } from "@/actions/update-group-member";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { CheckIcon } from "lucide-react";

export const Action = ({
  groupId,
  isInGroup,
  memberClerkId,
}: {
  groupId: string;
  memberClerkId: string;
  isInGroup?: boolean;
}) => {
  const { execute, loading } = useAction(updateGroupMember, {
    onSuccess: (data) => {
      // console.log("data", data);
    },
    onError: (error) => {
      // console.log("error", error);
    },
  });

  const onRequest = async () => {
    if (isInGroup) return;

    execute({ groupId, memberClerkId });
  };
  return (
    <div>
      <Button
        disabled={isInGroup || loading}
        type="button"
        variant={"ghost"}
        size={"icon"}
        onClick={onRequest}
        className={isInGroup ? "text-green-500" : ""}
      >
        <CheckIcon />
      </Button>
    </div>
  );
};
