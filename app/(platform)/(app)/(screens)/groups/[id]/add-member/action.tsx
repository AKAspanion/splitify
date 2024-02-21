"use client";

import { updateGroupMember } from "@/actions/update-group-member";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { useAction } from "@/hooks/use-action";
import { NotificationService } from "@/lib/notification/service";
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
    onSuccess: ({ group }) => {
      toast.success("Group member added successfully");
      const friend = group?.users?.[0];
      const friendId = friend?.id;
      if (friendId) {
        NotificationService.sendNotification(
          `Added to group`,
          `You have been added in group ${group?.title}`,
          [friendId],
        );
      }
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
        {loading ? <Spinner size="sm" /> : <PlusCircleIcon />}
      </Button>
    </div>
  );
};
