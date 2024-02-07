import { createFriend } from "@/actions/create-friend";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { HandshakeIcon } from "lucide-react";

export const Action = ({
  id,
  isFriend,
}: {
  id: string;
  isFriend?: boolean;
}) => {
  const { execute, loading } = useAction(createFriend, {
    onSuccess: (data) => {
      // console.log("data", data);
    },
    onError: (error) => {
      // console.log("error", error);
    },
  });

  const onRequest = async () => {
    if (isFriend) return;

    execute({ friendClerkId: id });
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
        <HandshakeIcon />
      </Button>
    </div>
  );
};
