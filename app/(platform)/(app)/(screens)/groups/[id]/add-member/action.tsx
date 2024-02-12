"use client";

import { updateGroupMember } from "@/actions/update-group-member";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { PlusCircleIcon } from "lucide-react";
import { toast } from "sonner";

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
    onSuccess: () => {
      toast.success("Group member added successfully");
    },
    onError: (error, debug) => {
      console.error(error, debug);
      toast.error(error);
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
        <PlusCircleIcon />
      </Button>
    </div>
  );
};
