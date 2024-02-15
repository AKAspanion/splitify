import { createFriend } from "@/actions/create-friend";
import { updateGroupMember } from "@/actions/update-group-member";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { HandshakeIcon } from "lucide-react";
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
    onSuccess: (data) => {
      toast.success(data.message);
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

  console.log(groupId);
  
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
        <HandshakeIcon />
      </Button>
    </div>
  );
};
