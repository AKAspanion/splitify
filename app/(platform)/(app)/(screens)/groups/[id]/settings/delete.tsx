"use client";
import { deleteGroup } from "@/actions/delete-group";
import useConfirm from "@/components/confirm/useConfirm";
import { ListItem } from "@/components/list-item";
import Spinner from "@/components/ui/spinner";
import { useAction } from "@/hooks/use-action";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const DeleteGroup = ({ id }: { id?: string }) => {
  const { getConfirmation } = useConfirm();
  const router = useRouter();
  const { execute, loading } = useAction(deleteGroup, {
    onSuccess: () => {
      toast.success("Group deleted successfully");
      router.push(`/groups`);
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });
  const handleDelete = async () => {
    const confirm = await getConfirmation({
      title: "Delete group?",
      subtitle: "This will remove group for ALL people involved, not just you.",
    });

    if (!confirm) {
      return;
    }

    if (id) {
      execute({ groupId: id });
    }
  };

  return !id ? null : loading ? (
    <div className="text-red-500">
      <ListItem title="Deleting group" icon={<Spinner />} />
    </div>
  ) : (
    <div className="text-red-500 cursor-pointer" onClick={handleDelete}>
      <ListItem title="Delete group" icon={<TrashIcon width={20} />} />
    </div>
  );
};
