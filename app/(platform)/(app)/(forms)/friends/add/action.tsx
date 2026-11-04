"use client";

import { Button } from "@/components/ui/button";
import { toUserMessage } from "@/lib/data/errors";
import { useAddFriend } from "@/lib/data/people";
import { toast } from "sonner";

export const Action = ({
  id,
  groupId,
  isFriend,
}: {
  id: string;
  groupId?: string;
  isFriend?: boolean;
}) => {
  const { mutate, isPending } = useAddFriend();

  const onRequest = () => {
    if (isFriend) return;

    mutate(
      { friendId: id, groupId },
      {
        onSuccess: () => toast.success("Friend added"),
        onError: (error) => toast.error(toUserMessage(error)),
      },
    );
  };

  return (
    <div>
      <Button
        disabled={isFriend || isPending}
        type="button"
        variant={isFriend ? "ghost" : "outline"}
        size={"sm"}
        loading={isPending}
        onClick={onRequest}
        className={isFriend ? "text-green-500" : ""}
      >
        {isFriend ? "Added" : "Add"}
      </Button>
    </div>
  );
};
