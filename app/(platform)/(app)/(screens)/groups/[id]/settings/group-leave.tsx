"use client";
import useConfirm from "@/components/confirm/useConfirm";
import { ListItem } from "@/components/list-item";
import Spinner from "@/components/ui/spinner";
import { useAction } from "@/hooks/use-action";
import { NotificationService } from "@/lib/notification/service";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const GroupLeave = ({ id }: { id?: string }) => {
  const { getConfirmation } = useConfirm();
  const router = useRouter();
  const loading = false;
  // const { execute, loading } = useAction(eaveGroup, {
  //   onSuccess: ({ userId, groupId, groupName }) => {
  //     toast.success("Group Leaved successfully");
  //     router.push(`/groups`);
  //     // NotificationService.LeaveGroup(userId, groupId, groupName);
  //   },
  //   onError: (error, debug) => {
  //     console.error(debug);
  //     toast.error(error);
  //   },
  // });
  const handleLeave = async () => {
    const confirm = await getConfirmation({
      title: "Leave group?",
      subtitle: "Are you sure you want to leave the group?",
    });

    if (!confirm) {
      return;
    }

    if (id) {
      // execute({ groupId: id });
    }
  };

  return !id ? null : loading ? (
    <div className="text-red-500">
      <ListItem title="Deleting group" icon={<Spinner />} />
    </div>
  ) : (
    <div className="text-red-500 cursor-pointer" onClick={handleLeave}>
      <ListItem title="Leave group" icon={<LogOutIcon width={20} />} />
    </div>
  );
};

export default GroupLeave;
