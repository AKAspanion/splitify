"use client";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { toUserMessage } from "@/lib/data/errors";
import { useAddGroupMember } from "@/lib/data/groups";
import { PlusCircleIcon } from "lucide-react";
import { toast } from "sonner";

export const Action = ({
  groupId,
  isInGroup,
  memberId,
}: {
  groupId: string;
  memberId: string;
  isInGroup?: boolean;
}) => {
  const { mutate, isPending } = useAddGroupMember();

  const onRequest = () => {
    if (isInGroup) return;

    mutate(
      { groupId, userId: memberId },
      {
        onSuccess: () => toast.success("Group member added successfully"),
        onError: (error) => toast.error(toUserMessage(error)),
      },
    );
  };
  return (
    <div>
      <Button
        disabled={isInGroup || isPending}
        type="button"
        variant={"ghost"}
        size={"icon"}
        aria-label="Add to group"
        onClick={onRequest}
        className={isInGroup ? "text-green-500" : ""}
      >
        {isPending ? <Spinner size="sm" /> : <PlusCircleIcon />}
      </Button>
    </div>
  );
};
