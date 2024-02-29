import { createFriend } from "@/actions/create-friend";
import { updateGroupMember } from "@/actions/update-group-member";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { useAction } from "@/hooks/use-action";
import { NotificationService } from "@/lib/notification/service";
import { UserPlus } from "lucide-react";
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
  const { execute, loading } = useAction(createFriend, {
    onSuccess: ({ message, userId, friendId }) => {
      toast.success(message);
      NotificationService.createFriend(userId, friendId);
    },
    onError: (error, debug) => {
      console.error(error, debug);
      toast.error(error);
    },
  });

  const onRequest = async () => {
    if (isFriend) return;

    await execute({ friendId: id, groupId });
  };

  return (
    <div>
      <Button
        disabled={isFriend || loading}
        type="button"
        variant={"ghost"}
        size={"icon"}
        onClick={onRequest}
        className={isFriend ? "text-green-500" : ""}
      >
        {loading ? <Spinner size="sm" /> : <UserPlus />}
      </Button>
    </div>
  );
};
